from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, PostPageAssociationViewSet

router = DefaultRouter()
router.register(r"", PostViewSet, basename="post")
router.register(
    r"associations", PostPageAssociationViewSet, basename="post-association"
)

urlpatterns = [
    path("", include(router.urls)),
]
