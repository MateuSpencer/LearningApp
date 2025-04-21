from rest_framework import viewsets, permissions, filters
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination
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
from .models import Post, Tag, Category
from .serializers import PostSerializer
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect


class IsAuthorOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow authors of a post to edit or delete it.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the author
        return obj.author == request.user


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

    # Slug filters
    primary_slug = CharFilter(field_name="primary_slug")
    page_slug = CharFilter(method="filter_by_page_slug")

    # Status filter
    status = CharFilter(field_name="status")

    # Tag and category filters
    tag = CharFilter(method="filter_by_tag")
    category = CharFilter(method="filter_by_category")

    class Meta:
        model = Post
        fields = [
            "author",
            "author_id",
            "primary_slug",
            "page_slug",
            "status",
            "created_after",
            "created_before",
            "updated_after",
            "updated_before",
            "created_today",
            "created_this_week",
            "created_this_month",
            "tag",
            "category",
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

    def filter_by_tag(self, queryset, name, value):
        # Support comma-separated tag slugs or names
        if not value:
            return queryset

        tags = [tag.strip() for tag in value.split(",")]
        tag_query = Q()

        for tag in tags:
            tag_query |= Q(tags__slug=tag) | Q(tags__name=tag)

        return queryset.filter(tag_query).distinct()

    def filter_by_category(self, queryset, name, value):
        # Support comma-separated category slugs or names
        if not value:
            return queryset

        categories = [category.strip() for category in value.split(",")]
        category_query = Q()

        for category in categories:
            category_query |= Q(categories__slug=category) | Q(
                categories__name=category
            )

        return queryset.filter(category_query).distinct()

    def filter_by_page_slug(self, queryset, name, value):
        """
        Filter to match posts by page_slug, supporting exact matches
        """
        if not value:
            return queryset

        # Match both exact page_slug and posts that contain this as part of their page_slug
        # This handles cases where posts are created with the full article path
        return queryset.filter(
            Q(page_slug=value) | Q(page_slug__contains=value)
        ).distinct()


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
    - primary_slug: Filter by primary slug (e.g., ?primary_slug=my-post)
    - page_slug: Filter by page slug (e.g., ?page_slug=my-page)
    - status: Filter by status (e.g., ?status=published)
    - created_after: Filter by creation date greater than (e.g., ?created_after=2023-01-01T00:00:00Z)
    - created_before: Filter by creation date less than (e.g., ?created_before=2023-12-31T23:59:59Z)
    - updated_after: Filter by update date greater than (e.g., ?updated_after=2023-01-01T00:00:00Z)
    - updated_before: Filter by update date less than (e.g., ?updated_before=2023-12-31T23:59:59Z)
    - created_today: Filter posts created today (e.g., ?created_today=true)
    - created_this_week: Filter posts created this week (e.g., ?created_this_week=true)
    - created_this_month: Filter posts created this month (e.g., ?created_this_month=true)
    - tag: Filter by tag name or slug (e.g., ?tag=news,technology)
    - category: Filter by category name or slug (e.g., ?category=tutorials,guides)

    Search:
    - search: Search in title and content (e.g., ?search=keyword)
    - search_metadata: Include metadata in search (e.g., ?search=keyword&search_metadata=true)

    Pagination:
    - page: Page number (e.g., ?page=2)
    - page_size: Number of results per page (e.g., ?page_size=20)

    Sorting:
    - ordering: Sort by field (e.g., ?ordering=title or ?ordering=-created_at)
       Available fields: created_at, updated_at, title, status
    """

    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    pagination_class = PostPagination
    filter_backends = [
        DjangoFilterBackend,
        AdvancedSearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = PostFilter
    search_fields = ["title", "content", "primary_slug", "author__username"]
    ordering_fields = [
        "created_at",
        "updated_at",
        "title",
        "status",
        "author__username",
        "primary_slug",
    ]
    ordering = ["-created_at"]  # Default ordering

    def get_queryset(self):
        queryset = Post.objects.select_related("author").prefetch_related(
            "tags", "categories", "secondary_slugs"
        )

        # Filter by status if not authenticated
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(status="published")

        return queryset
