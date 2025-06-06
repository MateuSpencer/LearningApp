from django.shortcuts import render
from rest_framework import viewsets, permissions, filters, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend, FilterSet
from django_filters import CharFilter
from django.db.models import Q
from django.db import models
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
import requests
from urllib.parse import urlparse
from requests.exceptions import RequestException
from django.utils import timezone

from .utils import (
    normalize_url,
    validate_url,
    extract_youtube_video_id,
    get_youtube_video_metadata,
)

from .models import (
    LearningResource,
    ResourceURL,
    ResourcePageAssociation,
    QualityVote,
    DifficultyVote,
    AppropriatenessVote,
)
from .models_ai_suggestions import AISuggestedResource
from .serializers import (
    LearningResourceSerializer,
    ResourceURLSerializer,
    ResourcePageAssociationSerializer,
    QualityVoteSerializer,
    DifficultyVoteSerializer,
    AppropriatenessVoteSerializer,
)
from .serializers_ai_suggestions import AISuggestedResourceSerializer


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit or delete it.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner
        if hasattr(obj, "added_by"):
            return obj.added_by == request.user

        return False


class ResourcePagination(PageNumberPagination):
    """
    Custom pagination for learning resources
    """

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


class ResourceFilter(FilterSet):
    """
    Custom filter for learning resources
    """

    # Add filter for difficulty level
    difficulty = CharFilter(method="filter_by_difficulty")

    # Add filter for specific resource types
    resource_category = CharFilter(method="filter_by_resource_category")

    # Add filter for page associations
    page_slug = CharFilter(method="filter_by_page_slug")

    class Meta:
        model = LearningResource
        fields = {
            "resource_type": ["exact"],
            "created_at": ["gt", "lt"],
            "updated_at": ["gt", "lt"],
        }

    def filter_by_difficulty(self, queryset, name, value):
        """
        Filter resources by their dominant difficulty level
        """
        if not value or value == "all":
            return queryset

        # Map difficulty levels to the corresponding count fields
        difficulty_map = {
            "beginner": "difficulty_beginner_count",
            "moderate": "difficulty_moderate_count",
            "advanced": "difficulty_advanced_count",
        }

        if value not in difficulty_map:
            return queryset

        # Get the field name for the requested difficulty level
        field_name = difficulty_map[value]

        # Create a filter to find resources where the requested difficulty has the highest count
        filter_conditions = Q()
        for other_level, other_field in difficulty_map.items():
            if other_level != value:
                # The selected difficulty count should be greater than other difficulty counts
                filter_conditions &= Q(**{f"{field_name}__gt": models.F(other_field)})

        # Apply the filter
        return queryset.filter(filter_conditions)

    def filter_by_resource_category(self, queryset, name, value):
        """
        Filter resources by category (grouping similar resource types)
        """
        if not value or value == "all":
            return queryset

        # Map category names to resource types
        category_map = {
            "video": ["video", "youtube"],  # Group video and YouTube
            "document": ["pdf", "article", "book"],  # Group document-like resources
            "website": ["website", "tool"],  # Group website-like resources
            "course": ["course"],  # Courses
            "image": ["image"],  # Images
        }

        if value not in category_map:
            return queryset

        # Get the resource types for this category
        resource_types = category_map[value]

        # Filter by any of these resource types
        return queryset.filter(resource_type__in=resource_types)

    def filter_by_page_slug(self, queryset, name, value):
        """
        Filter resources by page association
        """
        if not value:
            return queryset

        # Filter resources that are associated with the specified page
        return queryset.filter(page_associations__page_slug=value).distinct()


class ResourcePageAssociationFilter(FilterSet):
    """
    Custom filter for resource page associations
    """

    resource_id = CharFilter(field_name="learning_resource__id")

    class Meta:
        model = ResourcePageAssociation
        fields = {
            "page_slug": ["exact"],
            "added_at": ["gt", "lt"],
            "appropriateness_score": ["gt", "lt", "exact"],
        }


@method_decorator(ensure_csrf_cookie, name="list")
@method_decorator(csrf_protect, name="create")
@method_decorator(csrf_protect, name="update")
@method_decorator(csrf_protect, name="partial_update")
@method_decorator(csrf_protect, name="destroy")
@method_decorator(csrf_protect, name="quality_vote")
@method_decorator(csrf_protect, name="difficulty_vote")
@method_decorator(csrf_protect, name="set_ai_summary")
class LearningResourceViewSet(viewsets.ModelViewSet):
    """
    API endpoint for learning resources with filtering, searching, and sorting

    Filtering:
    - resource_type: Filter by specific resource type (e.g., ?resource_type=video)
    - resource_category: Filter by grouped category (e.g., ?resource_category=document)
    - difficulty: Filter by difficulty level (e.g., ?difficulty=beginner)
    - created_at: Filter by creation date (e.g., ?created_at__gt=2023-01-01T00:00:00Z)
    - updated_at: Filter by update date (e.g., ?updated_at__lt=2023-12-31T23:59:59Z)

    Search:
    - search: Search in title (e.g., ?search=keyword)

    Pagination:
    - page: Page number (e.g., ?page=2)
    - page_size: Number of results per page (e.g., ?page_size=20)

    Sorting:
    - ordering: Sort by field (e.g., ?ordering=title or ?ordering=-created_at)
                Available fields: created_at, updated_at, quality_vote_sum, quality_vote_count

    Voting:
    - POST /api/learning-resources/{id}/quality-vote/ to vote on quality (1-5 stars)
    - POST /api/learning-resources/{id}/difficulty-vote/ to vote on difficulty level

    URL Validation:
    - POST /api/learning-resources/validate_url/ to validate a URL before submission
    """

    serializer_class = LearningResourceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = ResourcePagination
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = ResourceFilter
    search_fields = ["title"]
    ordering_fields = [
        "created_at",
        "updated_at",
        "quality_vote_sum",
        "quality_vote_count",
    ]
    ordering = [
        "-quality_vote_sum",
        "-created_at",
    ]  # Default to sort by quality rating and date

    def get_queryset(self):
        """
        Get queryset with optional filtering by page_slug
        """
        queryset = LearningResource.objects.all()

        # Filter by page_slug if provided
        page_slug = self.request.query_params.get("page_slug")
        if page_slug:
            # Filter resources that are associated with the specified page
            queryset = queryset.filter(
                page_associations__page_slug=page_slug
            ).distinct()

        return queryset

    def validate_resource_url(self, url):
        """
        Validate that a URL exists and returns a success status code
        """
        validation_result = validate_url(url)
        if validation_result["status"] == "error":
            raise ValidationError(
                f"URL validation failed: {validation_result['message']}"
            )

        return validation_result["recommended_url"]

    def create(self, request, *args, **kwargs):
        """
        Create a new learning resource with URL and page association

        Checks if URL already exists, and if so, returns error
        Otherwise creates the resource, URL, and page association
        """
        # Extract data
        url = request.data.get("url")
        page_slug = request.data.get("page_slug")
        title = request.data.get("title")
        resource_type = request.data.get(
            "resource_type", "website"
        )  # Default to website

        if not url:
            return Response(
                {"url": "URL is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        if not title:
            return Response(
                {"title": "Title is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        if not page_slug:
            return Response(
                {"page_slug": "Page slug is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Normalize the URL for storage and checking duplicates
        validation_result = validate_url(url)
        normalized_url = validation_result["normalized_url"]

        # Set the resource type based on URL type for YouTube URLs
        if validation_result["url_type"] == "youtube":
            resource_type = "youtube"  # Use the specific YouTube resource type

        # Check if URL already exists
        parsed_url = urlparse(normalized_url)

        # Special handling for YouTube URLs
        if "youtube.com" in parsed_url.netloc and parsed_url.path == "/watch":
            from urllib.parse import parse_qs

            # Extract video ID from query parameters
            query_params = parse_qs(parsed_url.query)
            if "v" in query_params:
                video_id = query_params["v"][0]
                # Search for YouTube URLs with this video ID
                existing_urls = ResourceURL.objects.filter(
                    url__contains=f"youtube.com/watch?v={video_id}"
                ).select_related("learning_resource")
        else:
            # For non-YouTube URLs, check by host and path only
            url_host_path = f"{parsed_url.netloc}{parsed_url.path}"
            # Find any URLs that match with this host+path (protocol agnostic)
            existing_urls = ResourceURL.objects.filter(
                url__icontains=url_host_path
            ).select_related("learning_resource")

        if existing_urls.exists():
            # Instead of returning a 400 error, return a 200 response with the existing resource info
            existing_url = existing_urls.first()
            existing_resource = existing_url.learning_resource
            return Response(
                {
                    "status": "duplicate_url",
                    "message": "This URL is already associated with a learning resource",
                    "resource": self.get_serializer(existing_resource).data,
                },
                status=status.HTTP_200_OK,
            )  # Return 200 OK instead of 400 Bad Request

        # Create resource and URL in a transaction
        serializer = self.get_serializer(
            data={"title": title, "resource_type": resource_type}
        )
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        resource = serializer.instance

        # Use the recommended URL (HTTPS if available)
        final_url = validation_result["recommended_url"]

        # Create the URL
        ResourceURL.objects.create(
            learning_resource=resource,
            url=final_url,
            is_primary=True,  # First URL is automatically primary
        )

        # Associate with the page
        association = ResourcePageAssociation.objects.create(
            learning_resource=resource, page_slug=page_slug, added_by=request.user
        )

        # Return the complete resource with URL and association
        headers = self.get_success_headers(serializer.data)
        return Response(
            self.get_serializer(resource).data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def quality_vote(self, request, pk=None):
        """
        Vote on the quality of a resource (1-5 stars)
        Creates a new vote if the user hasn't voted yet
        Changes the vote if the user changes their rating
        Removes the vote if the user votes the same rating again (toggle off)
        """
        resource = self.get_object()

        # Validate rating
        rating = request.data.get("rating")
        if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
            return Response(
                {"detail": "Rating must be an integer between 1 and 5"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = QualityVoteSerializer(
            data={"learning_resource": resource.id, "rating": rating},
            context={"request": request},
        )

        if serializer.is_valid():
            result = serializer.save()
            # Check if vote was deleted by checking if result is a dict with deleted=True
            if isinstance(result, dict) and result.get("deleted"):
                # Vote was deleted (toggled off)
                learning_resource = result.get("learning_resource")
                if learning_resource:
                    learning_resource.update_quality_vote_counts()  # Ensure counts are updated

            # Re-fetch the resource to get updated vote counts
            resource = self.get_object()
            return Response(self.get_serializer(resource).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def difficulty_vote(self, request, pk=None):
        """
        Vote on the difficulty level of a resource
        Creates a new vote if the user hasn't voted yet
        Changes the vote if the user changes their level
        Removes the vote if the user votes the same level again (toggle off)
        """
        resource = self.get_object()

        # Validate level
        level = request.data.get("level")
        valid_levels = ["beginner", "moderate", "advanced"]
        if not level or level not in valid_levels:
            return Response(
                {"detail": f"Level must be one of: {', '.join(valid_levels)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = DifficultyVoteSerializer(
            data={"learning_resource": resource.id, "level": level},
            context={"request": request},
        )

        if serializer.is_valid():
            result = serializer.save()
            # Check if vote was deleted by checking if result is a dict with deleted=True
            if isinstance(result, dict) and result.get("deleted"):
                # Vote was deleted (toggled off)
                learning_resource = result.get("learning_resource")
                if learning_resource:
                    learning_resource.update_difficulty_vote_counts()  # Ensure counts are updated

            # Re-fetch the resource to get updated vote counts
            resource = self.get_object()
            return Response(self.get_serializer(resource).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(
        detail=True, methods=["get"], permission_classes=[permissions.IsAuthenticated]
    )
    def ai_summary(self, request, pk=None):
        """
        Get the AI-generated summary for a learning resource
        """
        resource = self.get_object()

        if not resource.ai_summary_generated:
            return Response(
                {"detail": "AI summary has not been generated yet."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "ai_summary": resource.ai_summary,
                "ai_summary_generated": resource.ai_summary_generated,
                "ai_summary_generated_at": resource.ai_summary_generated_at,
            }
        )

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def set_ai_summary(self, request, pk=None):
        """
        Set the AI-generated summary for a learning resource
        Only allows setting the summary if it hasn't been generated yet
        """
        resource = self.get_object()

        # Check if summary has already been generated
        if resource.ai_summary_generated:
            return Response(
                {
                    "detail": "AI summary has already been generated and cannot be regenerated."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate that ai_summary is provided
        ai_summary = request.data.get("ai_summary")
        if not ai_summary:
            return Response(
                {"detail": "AI summary is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update the resource with the AI summary
        resource.ai_summary = ai_summary
        resource.ai_summary_generated = True
        resource.ai_summary_generated_at = timezone.now()
        resource.save()

        return Response(
            {
                "ai_summary": resource.ai_summary,
                "ai_summary_generated": resource.ai_summary_generated,
                "ai_summary_generated_at": resource.ai_summary_generated_at,
            }
        )

    @action(
        detail=False, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def validate_url(self, request):
        """
        Validate a URL before submission:
        1. Check if URL already exists in the system (normalized form)
        2. Normalize YouTube URLs by removing params after video ID
        3. Check if URL is available via HTTPS, fallback to HTTP if not
        4. Return validation status and suggested corrections
        """
        url = request.data.get("url")
        if not url:
            return Response(
                {"status": "error", "message": "URL is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Full validation
        validation_result = validate_url(url)

        # Check if URL already exists in our system (using normalized form)
        normalized_url = validation_result["normalized_url"]

        # Parse the normalized URL to extract host, path, and query parameters for YouTube
        parsed_url = urlparse(normalized_url)

        # Special handling for YouTube URLs
        if validation_result["url_type"] == "youtube":
            # Get the video ID that was extracted during validation
            video_id = validation_result.get("youtube_video_id")

            # If we have a video ID, fetch the metadata for the YouTube video
            if video_id:
                # Add YouTube video metadata (title, author, etc.) to the response
                metadata = get_youtube_video_metadata(video_id)
                validation_result["metadata"] = metadata

                # Search for YouTube URLs with this video ID to check for duplicates
                existing_urls = ResourceURL.objects.filter(
                    url__contains=f"youtube.com/watch?v={video_id}"
                ).select_related("learning_resource")
            else:
                existing_urls = ResourceURL.objects.none()
        else:
            # For non-YouTube URLs, check by host and path
            url_host_path = f"{parsed_url.netloc}{parsed_url.path}"
            # Find any URLs that match with this host+path
            existing_urls = ResourceURL.objects.filter(
                url__icontains=url_host_path
            ).select_related("learning_resource")

        if existing_urls.exists():
            existing_url = existing_urls.first()
            validation_result["status"] = "duplicate"
            validation_result["message"] = "This URL already exists in the system"
            validation_result["existing_resource"] = {
                "id": str(existing_url.learning_resource.id),
                "title": existing_url.learning_resource.title,
                "resource_type": existing_url.learning_resource.resource_type,
            }

        return Response(validation_result)

    @action(
        detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated]
    )
    def youtube_metadata(self, request, video_id=None):
        """
        Get metadata for a YouTube video by ID
        """
        if not video_id or len(video_id) != 11:
            return Response(
                {
                    "status": "error",
                    "message": "Invalid YouTube video ID. ID must be 11 characters.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        metadata = get_youtube_video_metadata(video_id)

        if not metadata or not metadata.get("title"):
            return Response(
                {
                    "status": "error",
                    "message": "Could not fetch metadata for this video ID. The video may be private, removed, or does not exist.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({"status": "success", **metadata})


@method_decorator(ensure_csrf_cookie, name="list")
@method_decorator(csrf_protect, name="create")
@method_decorator(csrf_protect, name="update")
@method_decorator(csrf_protect, name="partial_update")
@method_decorator(csrf_protect, name="destroy")
class ResourceURLViewSet(viewsets.ModelViewSet):
    """
    API endpoint for resource URLs
    """

    serializer_class = ResourceURLSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return ResourceURL.objects.all()

    def perform_create(self, serializer):
        # Validate URL exists
        resource = self.request.data.get("learning_resource")
        url = self.request.data.get("url")

        learning_resource = LearningResource.objects.get(pk=resource)

        # Save the URL
        serializer.save(learning_resource=learning_resource)


@method_decorator(ensure_csrf_cookie, name="list")
@method_decorator(csrf_protect, name="create")
@method_decorator(csrf_protect, name="update")
@method_decorator(csrf_protect, name="partial_update")
@method_decorator(csrf_protect, name="destroy")
class ResourcePageAssociationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for resource page associations

    Filtering:
    - page_slug: Filter by page slug (e.g., ?page_slug=my-page)
    - added_at: Filter by addition date (e.g., ?added_at__gt=2023-01-01T00:00:00Z)
    - appropriateness_score: Filter by score (e.g., ?appropriateness_score__gt=5)

    Pagination:
    - page: Page number (e.g., ?page=2)
    - page_size: Number of results per page (e.g., ?page_size=20)

    Voting:
    - POST /api/associations/{id}/upvote/ to upvote an association
    - POST /api/associations/{id}/downvote/ to downvote an association
    """

    serializer_class = ResourcePageAssociationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    pagination_class = ResourcePagination
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = ResourcePageAssociationFilter
    ordering_fields = [
        "added_at",
        "appropriateness_score",
    ]
    ordering = [
        "-appropriateness_score",
        "-added_at",
    ]  # Default to sort by score and date

    def get_queryset(self):
        # Filter by page_slug or resource_id if provided in query params
        page_slug = self.request.query_params.get("page_slug", None)
        resource_id = self.request.query_params.get("resource_id", None)

        # Use select_related for foreign keys and prefetch_related for related collections
        queryset = ResourcePageAssociation.objects.select_related(
            "learning_resource", "added_by"
        )

        # Prefetch URLs for resources, prioritizing primary URLs to optimize performance
        queryset = queryset.prefetch_related(
            # Prefetch all related URLs
            "learning_resource__urls",
            # Prefetch primary URLs specifically for faster access
            models.Prefetch(
                "learning_resource__urls",
                queryset=ResourceURL.objects.filter(is_primary=True),
                to_attr="primary_urls",
            ),
        )

        # Apply filters if provided
        if page_slug:
            queryset = queryset.filter(page_slug=page_slug)

        if resource_id:
            queryset = queryset.filter(learning_resource__id=resource_id)

        return queryset

    def create(self, request, *args, **kwargs):
        """
        Create an association between a resource and a page
        Checks if the association already exists
        """
        resource_id = request.data.get("resource_id")
        page_slug = request.data.get("page_slug")

        if not resource_id:
            return Response(
                {"resource_id": "Resource ID is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not page_slug:
            return Response(
                {"page_slug": "Page slug is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if association already exists
        try:
            resource = LearningResource.objects.get(id=resource_id)
        except LearningResource.DoesNotExist:
            return Response(
                {"resource_id": "Learning resource not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if this association already exists
        if ResourcePageAssociation.objects.filter(
            learning_resource=resource, page_slug=page_slug
        ).exists():
            return Response(
                {"detail": "This resource is already associated with this page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create the association
        association = ResourcePageAssociation.objects.create(
            learning_resource=resource, page_slug=page_slug, added_by=request.user
        )

        serializer = self.get_serializer(association)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def upvote(self, request, pk=None):
        """
        Upvote a resource's appropriateness for a page.
        Creates an upvote if no vote exists.
        Changes to an upvote if previously downvoted.
        Removes the vote if already upvoted (toggle).
        """
        association = self.get_object()
        user = request.user
        vote_type = "upvote"

        try:
            existing_vote = AppropriatenessVote.objects.get(
                association=association, user=user
            )

            # If already upvoted, toggle it off by deleting
            if existing_vote.vote_type == vote_type:
                existing_vote.delete()
            else:
                # Change vote: update existing downvote to upvote
                existing_vote.vote_type = vote_type
                existing_vote.save()

        except AppropriatenessVote.DoesNotExist:
            # Create new upvote
            AppropriatenessVote.objects.create(
                association=association, user=user, vote_type=vote_type
            )

        # Always re-fetch the association to get updated vote counts
        association.refresh_from_db()
        return Response(self.get_serializer(association).data)

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def downvote(self, request, pk=None):
        """
        Downvote a resource's appropriateness for a page.
        Creates a downvote if no vote exists.
        Changes to a downvote if previously upvoted.
        Removes the vote if already downvoted (toggle).
        """
        association = self.get_object()
        user = request.user
        vote_type = "downvote"

        try:
            existing_vote = AppropriatenessVote.objects.get(
                association=association, user=user
            )

            # If already downvoted, toggle it off by deleting
            if existing_vote.vote_type == vote_type:
                existing_vote.delete()
            else:
                # Change vote: update existing upvote to downvote
                existing_vote.vote_type = vote_type
                existing_vote.save()

        except AppropriatenessVote.DoesNotExist:
            # Create new downvote
            AppropriatenessVote.objects.create(
                association=association, user=user, vote_type=vote_type
            )

        # Always re-fetch the association to get updated vote counts
        association.refresh_from_db()
        return Response(self.get_serializer(association).data)
