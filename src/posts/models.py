from django.db import models
from django.conf import settings
from main.mixins import TimestampMixin
import uuid
from django.utils.text import slugify
import time
from django.db.models import Sum


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

    # Cached vote count fields for faster sorting and display
    upvotes_count = models.IntegerField(default=0)
    downvotes_count = models.IntegerField(default=0)
    votes_score = models.IntegerField(default=0, db_index=True)  # upvotes - downvotes

    class Meta:
        verbose_name = "Post"
        verbose_name_plural = "Posts"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["author", "-created_at"]),
            models.Index(fields=["-votes_score"]),  # Index for sorting by vote score
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

    def update_vote_counts(self):
        """Update the cached vote count fields"""
        upvotes = self.votes.filter(vote_type="upvote").count()
        downvotes = self.votes.filter(vote_type="downvote").count()

        self.upvotes_count = upvotes
        self.downvotes_count = downvotes
        self.votes_score = upvotes - downvotes
        self.save(update_fields=["upvotes_count", "downvotes_count", "votes_score"])


class Vote(models.Model):
    """
    Model for tracking user votes on posts
    """

    VOTE_TYPES = (
        ("upvote", "Upvote"),
        ("downvote", "Downvote"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="votes")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    vote_type = models.CharField(max_length=10, choices=VOTE_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Vote"
        verbose_name_plural = "Votes"
        # Ensure a user can only have one vote per post
        unique_together = ("post", "user")

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)

        # After saving, update the post's vote counts
        self.post.update_vote_counts()

    def delete(self, *args, **kwargs):
        post = self.post  # Keep reference before deletion
        super().delete(*args, **kwargs)

        # After deleting, update the post's vote counts
        post.update_vote_counts()
