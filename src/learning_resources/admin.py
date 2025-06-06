from django.contrib import admin
from .models import (
    LearningResource,
    ResourceURL,
    ResourcePageAssociation,
    QualityVote,
    DifficultyVote,
    AppropriatenessVote,
)


@admin.register(LearningResource)
class LearningResourceAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "resource_type",
        "language",
        "created_at",
        "quality_vote_count",
        "average_quality_rating_display",
    )
    list_filter = ("resource_type", "language", "created_at")
    search_fields = ("title", "ai_summary")
    readonly_fields = (
        "quality_vote_count",
        "quality_vote_sum",
        "difficulty_beginner_count",
        "difficulty_moderate_count",
        "difficulty_advanced_count",
    )

    def average_quality_rating_display(self, obj):
        return (
            round(obj.average_quality_rating(), 2)
            if obj.quality_vote_count > 0
            else "No ratings"
        )

    average_quality_rating_display.short_description = "Avg. Rating"


@admin.register(ResourceURL)
class ResourceURLAdmin(admin.ModelAdmin):
    list_display = ("url", "learning_resource", "is_primary", "created_at")
    list_filter = ("is_primary", "created_at")
    search_fields = ("url", "learning_resource__title")
    raw_id_fields = ("learning_resource",)


@admin.register(ResourcePageAssociation)
class ResourcePageAssociationAdmin(admin.ModelAdmin):
    list_display = (
        "learning_resource",
        "page_slug",
        "added_by",
        "added_at",
        "appropriateness_score",
    )
    list_filter = ("added_at",)
    search_fields = ("page_slug", "learning_resource__title", "added_by__username")
    raw_id_fields = ("learning_resource", "added_by")
    readonly_fields = (
        "appropriateness_upvotes",
        "appropriateness_downvotes",
        "appropriateness_score",
    )


@admin.register(QualityVote)
class QualityVoteAdmin(admin.ModelAdmin):
    list_display = ("user", "learning_resource", "rating", "created_at")
    list_filter = ("rating", "created_at")
    search_fields = ("user__username", "learning_resource__title")
    raw_id_fields = ("user", "learning_resource")


@admin.register(DifficultyVote)
class DifficultyVoteAdmin(admin.ModelAdmin):
    list_display = ("user", "learning_resource", "level", "created_at")
    list_filter = ("level", "created_at")
    search_fields = ("user__username", "learning_resource__title")
    raw_id_fields = ("user", "learning_resource")


@admin.register(AppropriatenessVote)
class AppropriatenessVoteAdmin(admin.ModelAdmin):
    list_display = ("user", "association", "vote_type", "created_at")
    list_filter = ("vote_type", "created_at")
    search_fields = (
        "user__username",
        "association__page_slug",
        "association__learning_resource__title",
    )
    raw_id_fields = ("user", "association")
