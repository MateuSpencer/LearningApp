from django.contrib import admin
from .models import Post, PostPageAssociation, PostAppropriatenessVote


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "author",
        "status",
        "language",
        "created_at",
        "updated_at",
    )
    list_filter = ("status", "language", "created_at", "updated_at")
    search_fields = ("title", "content", "author__username", "author__email")
    readonly_fields = ("created_at", "updated_at")
    list_per_page = 25

    fieldsets = (
        (None, {"fields": ("title", "content", "author", "status", "language")}),
        ("Metadata", {"fields": ("metadata",), "classes": ("collapse",)}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(PostPageAssociation)
class PostPageAssociationAdmin(admin.ModelAdmin):
    list_display = ("post", "page_slug", "added_at", "appropriateness_score")
    list_filter = ("added_at", "appropriateness_score")
    search_fields = ("post__title", "page_slug", "added_by__username")
    readonly_fields = ("added_at",)


@admin.register(PostAppropriatenessVote)
class PostAppropriatenessVoteAdmin(admin.ModelAdmin):
    list_display = ("association", "user", "vote_type", "created_at")
    list_filter = ("vote_type", "created_at")
    search_fields = ("association__post__title", "user__username")
    readonly_fields = ("created_at",)
