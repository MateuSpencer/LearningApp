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


class WikiSearchSerializer(WikiPageSerializer):
    """Serializer for search results"""

    query = serializers.SerializerMethodField()

    class Meta:
        model = WikiPage
        fields = WikiPageSerializer.Meta.fields + [
            "query",
        ]

    def get_query(self, page):
        return self.context.get("query", "")
