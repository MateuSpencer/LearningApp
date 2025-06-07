from rest_framework import serializers
from .base_serializer import BasePageSerializer
from . import WikiPage
from learning_resources.models_ai_suggestions import AISuggestedResource
from learning_resources.models import ResourceURL, ResourcePageAssociation
from learning_resources.serializers_ai_suggestions import AISuggestedResourceSerializer


class WikiPageSerializer(BasePageSerializer):
    """Base serializer for the WikiPage"""

    class Meta:
        model = WikiPage
        fields = BasePageSerializer.Meta.fields


class WikiArticleSerializer(WikiPageSerializer):
    """Serializer for article view"""

    article_slug = serializers.SerializerMethodField()
    ai_suggestions = serializers.SerializerMethodField()
    existing_resources_count = serializers.SerializerMethodField()

    class Meta:
        model = WikiPage
        fields = WikiPageSerializer.Meta.fields + [
            "article_slug",
            "ai_suggestions",
            "existing_resources_count",
        ]

    def get_article_slug(self, page):
        return self.context.get("article_slug", "")

    def get_ai_suggestions(self, page):
        """Get AI suggestions for this article that aren't already added to resources"""
        article_slug = self.context.get("article_slug", "")
        if not article_slug:
            return []

        # Get all existing URLs in the system to filter out duplicates
        existing_urls = set(ResourceURL.objects.values_list("url", flat=True))

        # Get suggestions for this page that haven't been added and don't exist as resources
        suggestions = (
            AISuggestedResource.objects.filter(page_slug=article_slug, is_added=False)
            .exclude(url__in=existing_urls)
            .order_by("-created_at")
        )

        return AISuggestedResourceSerializer(suggestions, many=True).data

    def get_existing_resources_count(self, page):
        """Get count of existing learning resources for this article"""
        article_slug = self.context.get("article_slug", "")
        if not article_slug:
            return 0

        return ResourcePageAssociation.objects.filter(page_slug=article_slug).count()


# WikiSearchSerializer has been removed as the search functionality
# is now directly handled through the main WikiIndexPage with query parameters
