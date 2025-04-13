from django.db import models
from django.conf import settings
from main.mixins import TimestampMixin


class Post(TimestampMixin, models.Model):
    """
    Model for user-generated posts associated with specific pages
    """

    title = models.CharField(max_length=255, verbose_name="Title")
    content = models.TextField(verbose_name="Content")
    page_slug = models.CharField(
        max_length=255, db_index=True, verbose_name="Page Slug"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="posts"
    )

    class Meta:
        verbose_name = "Post"
        verbose_name_plural = "Posts"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.page_slug})"
