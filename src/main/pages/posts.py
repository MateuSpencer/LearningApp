from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
from rest_framework.request import Request
from rest_framework.response import Response
from wagtail.contrib.routable_page.models import RoutablePageMixin, route
from wagtail.models import PageManager
from wagtail_headless_preview.models import HeadlessPreviewMixin

from posts.models import Post
from .base import BasePage


class PostsPage(HeadlessPreviewMixin, RoutablePageMixin, BasePage):
    """
    A page that handles Posts content using routes instead of individual pages.
    This single page handles all requests to /posts/* paths.
    """

    # Main route for /posts/
    @route(r"^$")
    def index_route(self, request, *args, **kwargs):
        """Handles the main Posts index page"""
        data = self.get_component_data(
            {"request": request}, component_name="PostsIndexPage"
        )
        response_cls = Response if isinstance(request, Request) else JsonResponse
        return response_cls(data)

    # Route for /posts/{post_id} - accepting UUID as post_id
    @route(
        r"^(?P<post_id>[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12})/$"
    )
    def post_detail_route(self, request, post_id, *args, **kwargs):
        """Handles individual post pages based on their ID"""
        post = get_object_or_404(Post, id=post_id)

        context = {"request": request, "post": post, "post_id": post_id}

        data = self.get_component_data(
            context=context,
            component_name="PostPage",
            serializer_cls="main.pages.PostDetailSerializer",
        )

        response_cls = Response if isinstance(request, Request) else JsonResponse
        return response_cls(data)

    # Route for /posts/my-posts/ - showing user's posts
    @route(r"^my-posts/$")
    def my_posts_route(self, request, *args, **kwargs):
        """Handles the user's posts page"""
        data = self.get_component_data(
            {"request": request},
            component_name="MyPostsPage",
            serializer_cls="main.pages.posts_serializer.UserPostsSerializer",
        )
        response_cls = Response if isinstance(request, Request) else JsonResponse
        return response_cls(data)

    objects: PageManager

    extra_panels = BasePage.extra_panels
    serializer_class = "main.pages.PostsPageSerializer"

    class Meta:
        verbose_name = _("Posts")
