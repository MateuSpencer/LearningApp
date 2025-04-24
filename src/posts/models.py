from django.db import models
from django.conf import settings
from main.mixins import TimestampMixin
import uuid
from django.utils.text import slugify
import time


class Tag(models.Model):
    """
    Model for categorizing posts with tags
    """

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, db_index=True)

    class Meta:
        verbose_name = "Tag"
        verbose_name_plural = "Tags"
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Category(models.Model):
    """
    Model for organizing posts into categories
    """

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, db_index=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
    )

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class SecondarySlug(models.Model):
    """
    Model for additional slugs that can redirect to a post
    """

    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    post = models.ForeignKey(
        "Post", on_delete=models.CASCADE, related_name="secondary_slugs"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Secondary Slug"
        verbose_name_plural = "Secondary Slugs"
        ordering = ["-created_at"]

    def __str__(self):
        return self.slug


class Post(TimestampMixin, models.Model):
    """
    Model for user-generated posts associated with specific pages
    """

    STATUS_CHOICES = (
        ("draft", "Draft"),
        ("published", "Published"),
        ("archived", "Archived"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # title field removed
    content = models.TextField(verbose_name="Content")
    resource_url = models.URLField(
        verbose_name="Resource URL",
        blank=True,
        null=True,
        help_text="URL to an external resource",
    )
    primary_slug = models.SlugField(
        max_length=255,
        db_index=True,
        verbose_name="Primary Slug",
        unique=True,
        blank=True,
    )
    # Keeping page_slug for backwards compatibility
    page_slug = models.CharField(
        max_length=255, db_index=True, verbose_name="Page Slug"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="posts"
    )
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default="draft", db_index=True
    )
    tags = models.ManyToManyField(Tag, related_name="posts", blank=True)
    categories = models.ManyToManyField(Category, related_name="posts", blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Post"
        verbose_name_plural = "Posts"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["author", "-created_at"]),
        ]

    def save(self, *args, **kwargs):
        # Generate primary_slug if it doesn't exist
        if not self.primary_slug:
            # Make sure we have a valid page_slug
            if not self.page_slug or self.page_slug.strip() == "":
                # If no page_slug is set, use a default value - but this should rarely happen
                # as the frontend should always send a page_slug
                self.page_slug = "post"

            # Always use page_slug as base for primary_slug
            base_slug = self.page_slug

            # Add timestamp for uniqueness
            timestamp = int(time.time())
            self.primary_slug = f"{base_slug}-{timestamp}"

            # Ensure uniqueness with counter if needed
            original_slug = self.primary_slug
            counter = 1
            while Post.objects.filter(primary_slug=self.primary_slug).exists():
                self.primary_slug = f"{original_slug}-{counter}"
                counter += 1

        super().save(*args, **kwargs)

    def __str__(self):
        # Update string representation to use content instead of title
        return f"Post {self.id}"
