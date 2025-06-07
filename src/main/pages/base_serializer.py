from typing import List

from rest_framework import serializers
from wagtail import fields
from wagtail.admin.templatetags.wagtailuserbar import wagtailuserbar
from wagtail.api.v2 import serializers as wagtail_serializers

from sitesettings.models import SiteSetting
from sitesettings.serializers import SiteSettingSerializer
from ..serializers import SeoSerializer
from . import BasePage


class BasePageSerializer(serializers.ModelSerializer):
    serializer_field_mapping = (
        serializers.ModelSerializer.serializer_field_mapping.copy()
    )
    serializer_field_mapping.update(
        {fields.StreamField: wagtail_serializers.StreamField}
    )

    seo = serializers.SerializerMethodField()
    site_setting = serializers.SerializerMethodField()
    wagtail_userbar = serializers.SerializerMethodField()
    language_code = serializers.SerializerMethodField()
    translations = serializers.SerializerMethodField()

    class Meta:
        model = BasePage
        fields: List[str] = [
            "title",
            "last_published_at",
            "seo_title",
            "search_description",
            "seo",
            "site_setting",
            "wagtail_userbar",
            "language_code",
            "translations",
        ]

    def get_seo(self, page):
        return SeoSerializer(page).data

    def get_site_setting(self, page):
        site_setting = SiteSetting.for_site(page.get_site())
        return SiteSettingSerializer(site_setting).data

    def get_wagtail_userbar(self, page):
        request = self.context.get("request", None)
        if not request:
            return None

        in_preview_panel = getattr(request, "in_preview_panel", False)
        if in_preview_panel:
            return None

        if not hasattr(request, "user"):
            return None

        html = wagtailuserbar({"request": request, "self": page})

        if not html:
            return None

        return {
            "html": html,
        }

    def get_language_code(self, page):
        return getattr(page.locale, "language_code", "en")

    def get_translations(self, page):
        translations = page.get_translations(inclusive=False)
        return [
            {
                "title": x.title,
                "url": x.full_url,
                "language_code": getattr(x.locale, "language_code", "en"),
            }
            for x in translations
        ]
