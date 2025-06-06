from rest_framework import serializers
from wagtail.rich_text import expand_db_html

from . import ArticlePage
from .base_serializer import BasePageSerializer


class ArticlePageSerializer(BasePageSerializer):
    rich_text = serializers.SerializerMethodField()
    learning_resources = serializers.SerializerMethodField()
    ai_suggested_resources = serializers.SerializerMethodField()

    class Meta:
        model = ArticlePage
        fields = BasePageSerializer.Meta.fields + [
            "rich_text",
            "wiki_url",
            "learning_resources",
            "ai_suggested_resources",
        ]

    def get_rich_text(self, page):
        return expand_db_html(page.rich_text)

    def get_learning_resources(self, page):
        """Get existing learning resources associated with this article"""
        from learning_resources.models import ResourcePageAssociation
        from learning_resources.serializers import LearningResourceSerializer

        # Get the page slug for this article
        page_slug = page.slug

        # Get associated learning resources ordered by appropriateness score
        associations = (
            ResourcePageAssociation.objects.filter(page_slug=page_slug)
            .select_related("learning_resource")
            .order_by("-appropriateness_score", "-added_at")
        )

        resources = []
        for association in associations:
            resource_data = LearningResourceSerializer(
                association.learning_resource, context=self.context
            ).data

            # Add association-specific data
            resource_data["association"] = {
                "id": str(association.id),
                "appropriateness_score": association.appropriateness_score,
                "appropriateness_upvotes": association.appropriateness_upvotes,
                "appropriateness_downvotes": association.appropriateness_downvotes,
                "added_by": (
                    association.added_by.username if association.added_by else None
                ),
                "added_at": (
                    association.added_at.isoformat() if association.added_at else None
                ),
            }

            resources.append(resource_data)

        return resources

    def get_ai_suggested_resources(self, page):
        """Get AI-suggested learning resources for this article that haven't been added yet"""
        from learning_resources.models_ai_suggestions import AISuggestedResource
        from learning_resources.serializers_ai_suggestions import (
            AISuggestedResourceSerializer,
        )
        from learning_resources.models import ResourceURL

        # Get the page slug for this article
        page_slug = page.slug

        # Get existing URLs to filter out duplicates
        existing_urls = set(ResourceURL.objects.values_list("url", flat=True))

        # Get AI suggestions for this page that haven't been added and don't exist as resources
        suggestions = (
            AISuggestedResource.objects.filter(page_slug=page_slug, is_added=False)
            .exclude(url__in=existing_urls)
            .order_by("-created_at")
        )

        return AISuggestedResourceSerializer(
            suggestions, many=True, context=self.context
        ).data
