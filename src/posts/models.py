from django.db import models
from django.conf import settings
from main.mixins import TimestampMixin
import uuid
from django.db.models import Sum


class Post(TimestampMixin, models.Model):
    """
    Model for user-generated posts associated with specific pages
    """

    STATUS_CHOICES = (
        ("draft", "Draft"),
        ("published", "Published"),
        ("archived", "Archived"),
    )

    # Use centralized language configuration from Django settings
    LANGUAGE_CHOICES = settings.LANGUAGES

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, verbose_name="Title")
    content = models.TextField(verbose_name="Content")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="posts"
    )
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default="draft", db_index=True
    )
    language = models.CharField(
        max_length=2,
        choices=LANGUAGE_CHOICES,
        default="en",
        db_index=True,
        verbose_name="Language",
        help_text="The language in which this post is written",
    )
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Post"
        verbose_name_plural = "Posts"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["author", "-created_at"]),
            models.Index(fields=["language", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.title}"


class PostPageAssociation(models.Model):
    """
    Model for associating posts with page slugs
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="page_associations"
    )
    page_slug = models.CharField(max_length=255, db_index=True)
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="post_associations",
    )
    added_at = models.DateTimeField(auto_now_add=True)

    # Fields for appropriateness votes
    appropriateness_upvotes = models.IntegerField(default=0)
    appropriateness_downvotes = models.IntegerField(default=0)
    appropriateness_score = models.IntegerField(default=0, db_index=True)

    class Meta:
        verbose_name = "Post Page Association"
        verbose_name_plural = "Post Page Associations"
        ordering = ["-appropriateness_score", "-added_at"]
        unique_together = ("post", "page_slug")
        indexes = [
            models.Index(fields=["-appropriateness_score"]),
            models.Index(fields=["page_slug", "-appropriateness_score"]),
            models.Index(fields=["page_slug", "-added_at"]),
        ]

    def __str__(self):
        return f"Post '{self.post.title}' on page '{self.page_slug}'"

    def update_appropriateness_vote_counts(self):
        """Update the cached vote count fields"""
        upvotes = self.appropriateness_votes.filter(vote_type="upvote").count()
        downvotes = self.appropriateness_votes.filter(vote_type="downvote").count()

        self.appropriateness_upvotes = upvotes
        self.appropriateness_downvotes = downvotes
        self.appropriateness_score = upvotes - downvotes
        self.save(
            update_fields=[
                "appropriateness_upvotes",
                "appropriateness_downvotes",
                "appropriateness_score",
            ]
        )


class PostAppropriatenessVote(models.Model):
    """
    Model for tracking user votes on post-page association appropriateness
    """

    VOTE_TYPES = (
        ("upvote", "Upvote"),
        ("downvote", "Downvote"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="post_appropriateness_votes",
    )
    association = models.ForeignKey(
        PostPageAssociation,
        on_delete=models.CASCADE,
        related_name="appropriateness_votes",
    )
    vote_type = models.CharField(max_length=10, choices=VOTE_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Post Appropriateness Vote"
        verbose_name_plural = "Post Appropriateness Votes"
        unique_together = ("user", "association")

    def __str__(self):
        return f"{self.user.username}: {self.vote_type} for {self.association}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update the association's vote counts
        self.association.update_appropriateness_vote_counts()

    def delete(self, *args, **kwargs):
        association = self.association  # Keep reference before deletion
        super().delete(*args, **kwargs)
        # After deleting, update the association's vote counts
        association.update_appropriateness_vote_counts()
