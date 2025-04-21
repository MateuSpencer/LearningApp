from django.db import models
from django.conf import settings
from main.mixins import TimestampMixin
import uuid
from django.utils.text import slugify


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
    title = models.CharField(max_length=255, verbose_name="Title", blank=True)
    content = models.TextField(verbose_name="Content")
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
        # Ensure page_slug is not modified by content
        # If page_slug is provided but primary_slug is not, use page_slug as primary_slug base
        if self.page_slug and not self.primary_slug:
            # Use exactly the page slug provided from the frontend (clean path)
            base_slug = self.page_slug

            # Add a random suffix to ensure uniqueness
            import random
            import string

            suffix = "".join(
                random.choices(string.ascii_lowercase + string.digits, k=8)
            )
            self.primary_slug = f"{base_slug}-{suffix}"

            # Make sure primary_slug is unique
            original_slug = self.primary_slug
            counter = 1
            while Post.objects.filter(primary_slug=self.primary_slug).exists():
                self.primary_slug = f"{original_slug}-{counter}"
                counter += 1
        # Fall back to old behavior if page_slug not provided
        elif not self.primary_slug:
            # Use title if available, otherwise use a truncated version of content
            if self.title:
                base_slug = self.title
            else:
                # Use first 50 chars of content for slug generation
                base_slug = self.content[:50]

            self.primary_slug = slugify(base_slug)

            # Make sure slug is unique
            original_slug = self.primary_slug
            counter = 1
            while Post.objects.filter(primary_slug=self.primary_slug).exists():
                self.primary_slug = f"{original_slug}-{counter}"
                counter += 1

        # Make sure page_slug is always set
        # If it's still not set after above logic, copy from primary_slug
        if not self.page_slug and self.primary_slug:
            # Extract the base page slug from primary_slug
            self.page_slug = self.primary_slug.split("-")[0]

        super().save(*args, **kwargs)

    def __str__(self):
        return self.title or f"Post {self.id}"
