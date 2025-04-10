from django.http import JsonResponse
from rest_framework.request import Request
from rest_framework.response import Response
from wagtail.contrib.routable_page.models import RoutablePageMixin, route
from wagtail.models import PageManager
from wagtail_headless_preview.models import HeadlessPreviewMixin
from django.utils.translation import gettext_lazy as _

from .base import BasePage


class WikiPage(HeadlessPreviewMixin, RoutablePageMixin, BasePage):
    """
    A page that handles Wikipedia-style content using routes instead of individual pages.
    This single page handles all requests to /wiki/* paths.
    """

    # Main route for /wiki/
    @route(r"^$")
    def index_route(self, request, *args, **kwargs):
        """Handles the main Wiki index page"""
        data = self.get_component_data(
            {"request": request}, component_name="WikiIndexPage"
        )
        response_cls = Response if isinstance(request, Request) else JsonResponse
        return response_cls(data)

    # Route for /wiki/Article_Name
    @route(r"^(?P<article_slug>[\w-]+)/$")
    def article_route(self, request, article_slug, *args, **kwargs):
        """Handles individual article pages based on their slug"""
        context = {"request": request, "article_slug": article_slug}

        data = self.get_component_data(
            context=context,
            component_name="WikiArticlePage",
            serializer_cls="main.pages.WikiArticleSerializer",
        )

        response_cls = Response if isinstance(request, Request) else JsonResponse
        return response_cls(data)

    # Route for /wiki/search/?q=query
    @route(r"^search/$")
    def search_route(self, request, *args, **kwargs):
        """Handles search queries"""
        query = request.GET.get("q", "")

        context = {"request": request, "query": query}

        data = self.get_component_data(
            context=context, serializer_cls="main.pages.WikiSearchSerializer"
        )

        response_cls = Response if isinstance(request, Request) else JsonResponse
        return response_cls(data)

    objects: PageManager

    extra_panels = BasePage.extra_panels
    serializer_class = "main.pages.WikiPageSerializer"

    class Meta:
        verbose_name = _("Wiki")
