from django.shortcuts import render
from rest_framework import viewsets, permissions, filters, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend, FilterSet
from django_filters import CharFilter
from django.db.models import Q
from django.db import models  # Add missing models import
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
import requests
from requests.exceptions import RequestException

from .models import (
    LearningResource,
    ResourceURL,
    ResourcePageAssociation,
    QualityVote,
    DifficultyVote,
    AppropriatenessVote,
)
from .serializers import (
    LearningResourceSerializer,
    ResourceURLSerializer,
    ResourcePageAssociationSerializer,
    QualityVoteSerializer,
    DifficultyVoteSerializer,
    AppropriatenessVoteSerializer,
)


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
class LearningResourceViewSet(viewsets.ModelViewSet):
    """
    API endpoint for learning resources with filtering, searching, and sorting

    Filtering:
    - resource_type: Filter by resource type (e.g., ?resource_type=video)
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
        return LearningResource.objects.all()

    def validate_resource_url(self, url):
        """
        Validate that a URL exists and returns a success status code
        """
        try:
            response = requests.head(url, timeout=5, allow_redirects=True)
            if response.status_code >= 400:
                raise ValidationError(
                    f"URL validation failed: {url} returned status code {response.status_code}"
                )
        except RequestException as e:
            raise ValidationError(f"URL validation failed: {str(e)}")

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

        # Check if URL already exists
        existing_url = ResourceURL.objects.filter(url=url).first()
        if existing_url:
            # Instead of returning a 400 error, return a 200 response with the existing resource info
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

        # Create the URL
        ResourceURL.objects.create(
            learning_resource=resource,
            url=url,
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
            serializer.save()
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
            serializer.save()
            # Re-fetch the resource to get updated vote counts
            resource = self.get_object()
            return Response(self.get_serializer(resource).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
    - POST /api/resource-associations/{id}/upvote/ to upvote an association
    - POST /api/resource-associations/{id}/downvote/ to downvote an association
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
        Does nothing if already upvoted.
        """
        association = self.get_object()
        user = request.user
        vote_type = "upvote"

        try:
            existing_vote = AppropriatenessVote.objects.get(
                association=association, user=user
            )

            # If already upvoted, do nothing
            if existing_vote.vote_type == vote_type:
                pass  # Vote remains the same
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
        Does nothing if already downvoted.
        """
        association = self.get_object()
        user = request.user
        vote_type = "downvote"

        try:
            existing_vote = AppropriatenessVote.objects.get(
                association=association, user=user
            )

            # If already downvoted, do nothing
            if existing_vote.vote_type == vote_type:
                pass  # Vote remains the same
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
