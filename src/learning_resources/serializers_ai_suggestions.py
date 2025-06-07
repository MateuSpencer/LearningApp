from rest_framework import serializers
from .models_ai_suggestions import AISuggestedResource


class AISuggestedResourceSerializer(serializers.ModelSerializer):
    is_already_added = serializers.SerializerMethodField()

    class Meta:
        model = AISuggestedResource
        fields = [
            "id",
            "title",
            "url",
            "resource_type",
            "description",
            "is_added",
            "page_slug",
            "created_at",
            "is_already_added",
        ]
        read_only_fields = ["id", "is_added", "created_at"]

    def get_is_already_added(self, obj):
        """
        Check if this URL is already added to the site (in any resource)
        """
        from .models import ResourceURL

        # If it's already marked as added, return True
        if obj.is_added:
            return True

        # Check if the URL already exists in any resource
        return ResourceURL.objects.filter(url=obj.url).exists()
