from rest_framework import serializers
from wagtail.rich_text import expand_db_html

from .base_serializer import BasePageSerializer
from . import AboutPage


class AboutPageSerializer(BasePageSerializer):
    about_text = serializers.SerializerMethodField()

    class Meta:
        model = AboutPage
        fields = [
            "company_name",
            "about_text",
        ] + BasePageSerializer.Meta.fields

    def get_about_text(self, page):
        return expand_db_html(page.about_text) if page.about_text else ""
