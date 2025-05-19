from rest_framework import viewsets, permissions, filters
from rest_framework import status as http_status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import (
    DjangoFilterBackend,
    FilterSet,
    DateTimeFilter,
    CharFilter,
    UUIDFilter,
    BooleanFilter,
)
from django.db.models import Q
from django.utils import timezone
import datetime
from .models import Post, PostPageAssociation, PostAppropriatenessVote
from .serializers import (
    PostSerializer,
    PostPageAssociationSerializer,
    PostAppropriatenessVoteSerializer,
)
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect


class IsAuthorOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the author
        return obj.author == request.user


class SimpleOrderingFilter(filters.BaseFilterBackend):
    """
    Filter that allows ordering by newest first or oldest first only.
    """

    order_param = "order"

    def filter_queryset(self, request, queryset, view):
        order_param = request.query_params.get(self.order_param, "newest")

        if order_param == "oldest":
            return queryset.order_by("created_at")

        # Default to newest first
        return queryset.order_by("-created_at")


class PostPagination(PageNumberPagination):
    """
    Custom pagination for posts
    """

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class PostFilter(FilterSet):
    """
    Custom filter for posts
    """

    # Date filters
    created_after = DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = DateTimeFilter(field_name="created_at", lookup_expr="lte")
    updated_after = DateTimeFilter(field_name="updated_at", lookup_expr="gte")
    updated_before = DateTimeFilter(field_name="updated_at", lookup_expr="lte")

    # Common time-based shortcuts
    created_today = BooleanFilter(method="filter_created_today")
    created_this_week = BooleanFilter(method="filter_created_this_week")
    created_this_month = BooleanFilter(method="filter_created_this_month")

    # Author filter
    author = CharFilter(field_name="author__username")
    author_id = UUIDFilter(field_name="author__id")

    # Page slug filter
    page_slug = CharFilter(method="filter_by_page_slug")

    # Status filter
    status = CharFilter(field_name="status")

    class Meta:
        model = Post
        fields = [
            "author",
            "author_id",
            "page_slug",
            "status",
            "created_after",
            "created_before",
            "updated_after",
            "updated_before",
            "created_today",
            "created_this_week",
            "created_this_month",
        ]

    def filter_created_today(self, queryset, name, value):
        if value:
            today = timezone.now().date()
            return queryset.filter(created_at__date=today)
        return queryset

    def filter_created_this_week(self, queryset, name, value):
        if value:
            today = timezone.now().date()
            start_of_week = today - datetime.timedelta(days=today.weekday())
            return queryset.filter(created_at__date__gte=start_of_week)
        return queryset

    def filter_created_this_month(self, queryset, name, value):
        if value:
            today = timezone.now().date()
            start_of_month = datetime.date(today.year, today.month, 1)
            return queryset.filter(created_at__date__gte=start_of_month)
        return queryset

    def filter_by_page_slug(self, queryset, name, value):
        """
        Filter to match posts by page_slug, supporting exact matches
        """
        if not value:
            return queryset

        # Get posts that have associations with this page slug
        return queryset.filter(page_associations__page_slug=value).distinct()


class AdvancedSearchFilter(filters.SearchFilter):
    """
    Advanced search filter with support for metadata
    """

    def get_search_fields(self, view, request):
        # Default search fields
        search_fields = super().get_search_fields(view, request)

        # Check if metadata search is requested
        search_metadata = request.query_params.get("search_metadata", False)
        if search_metadata and search_metadata.lower() in ("true", "1", "yes"):
            # Include JSONField metadata in search
            # Note: This will depend on the database backend's JSON search capabilities
            search_fields = list(search_fields) + ["metadata"]

        return search_fields


class PostPageAssociationFilter(FilterSet):
    """
    Custom filter for post page associations
    """

    post_id = UUIDFilter(field_name="post__id")
    author = CharFilter(field_name="post__author__username")

    class Meta:
        model = PostPageAssociation
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
class PostViewSet(viewsets.ModelViewSet):
    """
    API endpoint for posts with enhanced filtering, search, and sorting

    Filtering:
    - author: Filter by author username (e.g., ?author=john)
    - author_id: Filter by author UUID (e.g., ?author_id=123e4567-e89b-12d3-a456-426614174000)
    - page_slug: Filter by page slug (e.g., ?page_slug=my-page)
    - status: Filter by status (e.g., ?status=published)
    - created_after: Filter by creation date greater than (e.g., ?created_after=2023-01-01T00:00:00Z)
    - created_before: Filter by creation date less than (e.g., ?created_before=2023-12-31T23:59:59Z)
    - updated_after: Filter by update date greater than (e.g., ?updated_after=2023-01-01T00:00:00Z)
    - updated_before: Filter by update date less than (e.g., ?updated_before=2023-12-31T23:59:59Z)
    - created_today: Filter posts created today (e.g., ?created_today=true)
    - created_this_week: Filter posts created this week (e.g., ?created_this_week=true)
    - created_this_month: Filter posts created this month (e.g., ?created_this_month=true)

    Search:
    - search: Search in title and content (e.g., ?search=keyword)
    - search_metadata: Include metadata in search (e.g., ?search=keyword&search_metadata=true)

    Pagination:
    - page: Page number (e.g., ?page=2)
    - page_size: Number of results per page (e.g., ?page_size=20)

    Sorting:
    - order: Sort by newest or oldest (e.g., ?order=newest or ?order=oldest)
       Default is newest first if not specified
    """

    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    pagination_class = PostPagination
    filter_backends = [
        DjangoFilterBackend,
        AdvancedSearchFilter,
        SimpleOrderingFilter,
    ]
    filterset_class = PostFilter
    search_fields = ["title", "content", "author__username"]
    ordering = ["-created_at"]  # Default to sort by date

    def get_queryset(self):
        queryset = Post.objects.select_related("author").prefetch_related(
            "page_associations"
        )

        # For authenticated users, filter to show only:
        # - their own draft and archived posts
        # - anyone's published posts
        if self.request.user.is_authenticated:
            queryset = queryset.filter(
                Q(status="published")
                | Q(status__in=["draft", "archived"], author=self.request.user)
            )
        else:
            # For non-authenticated users, only show published posts
            queryset = queryset.filter(status="published")

        return queryset

    # Resource URL validation removed as it's no longer needed

    def perform_create(self, serializer):
        # Set the author to the current user and save
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        # Only update if the user is the author (handled by permission class)
        serializer.save()

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def associate_with_page(self, request, pk=None):
        """
        Associate a post with a page
        Requires page_slug in the request body
        """
        post = self.get_object()
        page_slug = request.data.get("page_slug")

        if not page_slug:
            return Response(
                {"detail": "page_slug is required"},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        # Check if association already exists
        if PostPageAssociation.objects.filter(post=post, page_slug=page_slug).exists():
            return Response(
                {"detail": f"Post is already associated with page '{page_slug}'"},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        # Create the association
        association = PostPageAssociation.objects.create(
            post=post, page_slug=page_slug, added_by=request.user
        )

        # Return the updated post with associations
        return Response(self.get_serializer(post).data)

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def remove_page_association(self, request, pk=None):
        """
        Remove a post's association with a page
        Requires page_slug in the request body
        """
        post = self.get_object()
        page_slug = request.data.get("page_slug")
        association_id = request.data.get("association_id")

        if not page_slug and not association_id:
            return Response(
                {"detail": "Either page_slug or association_id is required"},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        # Only allow the author or the person who added the association to remove it
        if association_id:
            try:
                association = PostPageAssociation.objects.get(
                    id=association_id, post=post
                )
            except PostPageAssociation.DoesNotExist:
                return Response(
                    {"detail": "Association not found"},
                    status=http_status.HTTP_404_NOT_FOUND,
                )
        else:
            try:
                association = PostPageAssociation.objects.get(
                    post=post, page_slug=page_slug
                )
            except PostPageAssociation.DoesNotExist:
                return Response(
                    {"detail": f"Post is not associated with page '{page_slug}'"},
                    status=http_status.HTTP_404_NOT_FOUND,
                )

        # Check permissions
        if request.user != post.author and request.user != association.added_by:
            return Response(
                {"detail": "You don't have permission to remove this association"},
                status=http_status.HTTP_403_FORBIDDEN,
            )

        # Don't allow removing the last association
        if post.page_associations.count() <= 1:
            return Response(
                {
                    "detail": "Cannot remove the last page association. A post must be associated with at least one page."
                },
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        # Remove the association
        association.delete()

        # Return the updated post
        return Response(self.get_serializer(post).data)

    def create(self, request, *args, **kwargs):
        """
        Create a new post with page association

        Requires title, content, and page_slug at minimum
        Automatically sets the current user as the author
        """
        # Extract data
        title = request.data.get("title")
        content = request.data.get("content")
        page_slug = request.data.get("page_slug")
        status = request.data.get("status", "draft")  # Default to draft
        metadata = request.data.get("metadata", {})

        if not title:
            return Response(
                {"title": "Title is required"},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        if not content:
            return Response(
                {"content": "Content is required"},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        if not page_slug:
            return Response(
                {"page_slug": "Page slug is required"},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        # Create the post with the current user as author
        post = Post.objects.create(
            title=title,
            content=content,
            author=request.user,
            status=status,
            metadata=metadata,
        )

        # Associate with the page
        association = PostPageAssociation.objects.create(
            post=post, page_slug=page_slug, added_by=request.user
        )

        # Return the complete post with association
        serializer = self.get_serializer(post)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=http_status.HTTP_201_CREATED, headers=headers
        )


class PostPageAssociationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for post page associations

    Filtering:
    - page_slug: Filter by page slug (e.g., ?page_slug=my-page)
    - post_id: Filter by post ID (e.g., ?post_id=123e4567-e89b-12d3-a456-426614174000)
    - added_at: Filter by addition date (e.g., ?added_at__gt=2023-01-01T00:00:00Z)
    - appropriateness_score: Filter by score (e.g., ?appropriateness_score__gt=5)

    Pagination:
    - page: Page number (e.g., ?page=2)
    - page_size: Number of results per page (e.g., ?page_size=20)

    Voting:
    - POST /api/post-associations/{id}/upvote/ to upvote an association
    - POST /api/post-associations/{id}/downvote/ to downvote an association
    """

    serializer_class = PostPageAssociationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = PostPagination
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = PostPageAssociationFilter
    ordering_fields = [
        "added_at",
        "appropriateness_score",
    ]
    ordering = [
        "-appropriateness_score",
        "-added_at",
    ]  # Default to sort by score and date

    def get_queryset(self):
        # Filter by page_slug or post_id if provided in query params
        page_slug = self.request.query_params.get("page_slug", None)
        post_id = self.request.query_params.get("post_id", None)

        # Use select_related for foreign keys to optimize performance
        queryset = PostPageAssociation.objects.select_related(
            "post", "post__author", "added_by"
        )

        # Apply filters if provided
        if page_slug:
            queryset = queryset.filter(page_slug=page_slug)

        if post_id:
            queryset = queryset.filter(post__id=post_id)

        return queryset

    def perform_create(self, serializer):
        serializer.save(added_by=self.request.user)

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def upvote(self, request, pk=None):
        """
        Upvote a post's appropriateness for a page.
        Creates an upvote if no vote exists.
        Changes to an upvote if previously downvoted.
        Removes the vote if already upvoted (toggle).
        """
        association = self.get_object()
        user = request.user
        vote_type = "upvote"

        try:
            existing_vote = PostAppropriatenessVote.objects.get(
                association=association, user=user
            )

            # If already upvoted, toggle it off by deleting
            if existing_vote.vote_type == vote_type:
                existing_vote.delete()
            else:
                # Change vote: update existing downvote to upvote
                existing_vote.vote_type = vote_type
                existing_vote.save()

        except PostAppropriatenessVote.DoesNotExist:
            # Create new upvote
            PostAppropriatenessVote.objects.create(
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
        Downvote a post's appropriateness for a page.
        Creates a downvote if no vote exists.
        Changes to a downvote if previously upvoted.
        Removes the vote if already downvoted (toggle).
        """
        association = self.get_object()
        user = request.user
        vote_type = "downvote"

        try:
            existing_vote = PostAppropriatenessVote.objects.get(
                association=association, user=user
            )

            # If already downvoted, toggle it off by deleting
            if existing_vote.vote_type == vote_type:
                existing_vote.delete()
            else:
                # Change vote: update existing upvote to downvote
                existing_vote.vote_type = vote_type
                existing_vote.save()

        except PostAppropriatenessVote.DoesNotExist:
            # Create new downvote
            PostAppropriatenessVote.objects.create(
                association=association, user=user, vote_type=vote_type
            )

        # Always re-fetch the association to get updated vote counts
        association.refresh_from_db()
        return Response(self.get_serializer(association).data)
