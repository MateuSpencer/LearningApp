from rest_framework import serializers
from .base_serializer import BasePageSerializer
from . import WikiPage


class WikiPageSerializer(BasePageSerializer):
    """Base serializer for the WikiPage"""

    class Meta:
        model = WikiPage
        fields = BasePageSerializer.Meta.fields


class WikiArticleSerializer(WikiPageSerializer):
    """Serializer for article view"""

    article_slug = serializers.SerializerMethodField()

    class Meta:
        model = WikiPage
        fields = WikiPageSerializer.Meta.fields + [
            "article_slug",
        ]

    def get_article_slug(self, page):
        return self.context.get("article_slug", "")


# WikiSearchSerializer has been removed as the search functionality
# is now directly handled through the main WikiIndexPage with query parameters
