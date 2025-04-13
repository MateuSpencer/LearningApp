from rest_framework import viewsets, permissions, filters
from rest_framework.exceptions import PermissionDenied
from .models import Post
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


@method_decorator(ensure_csrf_cookie, name="list")
@method_decorator(csrf_protect, name="create")
@method_decorator(csrf_protect, name="update")
@method_decorator(csrf_protect, name="partial_update")
@method_decorator(csrf_protect, name="destroy")
class PostViewSet(viewsets.ModelViewSet):
    """
    API endpoint for posts
    """

    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "content"]
    ordering_fields = ["created_at", "updated_at", "title"]
    ordering = ["-created_at"]  # Default ordering

    def get_queryset(self):
        queryset = Post.objects.all()

        # Filter by page_slug if provided
        page_slug = self.request.query_params.get("page", None)
        if page_slug is not None:
            queryset = queryset.filter(page_slug=page_slug)

        return queryset
