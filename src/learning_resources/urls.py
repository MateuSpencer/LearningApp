from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LearningResourceViewSet,
    ResourceURLViewSet,
    ResourcePageAssociationViewSet,
)
from .views_ai_suggestions import AISuggestedResourceViewSet

# Create a router for our viewsets
router = DefaultRouter()
router.register(
    r"learning-resources", LearningResourceViewSet, basename="learning-resources"
)
router.register(r"resource-urls", ResourceURLViewSet, basename="resource-url")
router.register(
    r"resource-associations",
    ResourcePageAssociationViewSet,
    basename="resource-association",
)
router.register(
    r"ai-suggestions", AISuggestedResourceViewSet, basename="ai-suggestions"
)

urlpatterns = [
    # Include router URLs
    path("", include(router.urls)),
    # Add backward compatibility for validate_url endpoint (with underscore)
    path(
        "validate_url/",
        LearningResourceViewSet.as_view({"post": "validate_url"}),
        name="validate_url",
    ),
    # Add endpoint for fetching YouTube metadata
    path(
        "youtube-metadata/<str:video_id>/",
        LearningResourceViewSet.as_view({"get": "youtube_metadata"}),
        name="youtube-metadata",
    ),
]
