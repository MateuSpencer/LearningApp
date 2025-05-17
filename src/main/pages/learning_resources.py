from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response
from wagtail.contrib.routable_page.models import RoutablePageMixin, route
from wagtail.models import PageManager
from wagtail_headless_preview.models import HeadlessPreviewMixin
from django.utils.translation import gettext_lazy as _

from learning_resources.models import LearningResource
from .base import BasePage


class LearningResourcesPage(HeadlessPreviewMixin, RoutablePageMixin, BasePage):
    """
    A page that handles Learning Resources content using routes instead of individual pages.
    This single page handles all requests to /learning-resources/* paths.
    """

    # Main route for /learning-resources/
    @route(r"^$")
    def index_route(self, request, *args, **kwargs):
        """Handles the main Learning Resources index page"""
        data = self.get_component_data(
            {"request": request}, component_name="LearningResourcesIndexPage"
        )
        response_cls = Response if isinstance(request, Request) else JsonResponse
        return response_cls(data)

    # Route for /learning-resources/{resource_id} - accepting UUID as resource_id
    @route(
        r"^(?P<resource_id>[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12})/$"
    )
    def resource_detail_route(self, request, resource_id, *args, **kwargs):
        """Handles individual learning resource pages based on their ID"""
        resource = get_object_or_404(LearningResource, id=resource_id)

        context = {"request": request, "resource": resource, "resource_id": resource_id}

        data = self.get_component_data(
            context=context,
            component_name="LearningResourceDetailPage",
            serializer_cls="main.pages.LearningResourceDetailSerializer",
        )

        response_cls = Response if isinstance(request, Request) else JsonResponse
        return response_cls(data)

    objects: PageManager

    extra_panels = BasePage.extra_panels
    serializer_class = "main.pages.LearningResourcesPageSerializer"

    class Meta:
        verbose_name = _("Learning Resources")
