from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LearningResourceViewSet,
    ResourceURLViewSet,
    ResourcePageAssociationViewSet,
)

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

urlpatterns = [
    # Include router URLs
    path("", include(router.urls)),
]
