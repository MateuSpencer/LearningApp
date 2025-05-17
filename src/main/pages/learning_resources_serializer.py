from rest_framework import serializers
from .base_serializer import BasePageSerializer
from . import LearningResourcesPage
from learning_resources.serializers import LearningResourceSerializer


class LearningResourcesPageSerializer(BasePageSerializer):
    """Base serializer for the LearningResourcesPage"""

    class Meta:
        model = LearningResourcesPage
        fields = BasePageSerializer.Meta.fields


class LearningResourceDetailSerializer(LearningResourcesPageSerializer):
    """Serializer for learning resource detail view"""

    resource = serializers.SerializerMethodField()
    resourceId = serializers.SerializerMethodField()

    class Meta:
        model = LearningResourcesPage
        fields = LearningResourcesPageSerializer.Meta.fields + [
            "resource",
            "resourceId",
        ]

    def get_resource(self, page):
        resource = self.context.get("resource")
        if not resource:
            return None
        return LearningResourceSerializer(
            resource, context={"request": self.context.get("request")}
        ).data

    def get_resourceId(self, page):
        # Return the resource_id from the context
        return str(self.context.get("resource_id"))
