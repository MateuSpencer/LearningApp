from django.db import models
from django.conf import settings
from main.mixins import TimestampMixin
import uuid
from django.db.models import Sum


class LearningResource(TimestampMixin, models.Model):
    """
    Core model for learning resources that can be associated with pages
    """

    RESOURCE_TYPE_CHOICES = (
        ("video", "Video"),
        ("youtube", "YouTube"),  # Added for explicit YouTube categorization
        ("pdf", "PDF"),
        ("image", "Image"),
        ("website", "Website"),
        ("article", "Article"),
        ("book", "Book"),  # Added for completeness
        ("course", "Course"),  # Added for completeness
        ("tool", "Tool"),  # Added for completeness
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPE_CHOICES)

    # Fields for aggregating votes
    quality_vote_count = models.IntegerField(default=0)
    quality_vote_sum = models.IntegerField(default=0)
    difficulty_beginner_count = models.IntegerField(default=0)
    difficulty_moderate_count = models.IntegerField(default=0)
    difficulty_advanced_count = models.IntegerField(default=0)

    # AI-generated summary field
    ai_summary = models.TextField(
        blank=True, null=True, verbose_name="AI-generated summary"
    )
    ai_summary_generated = models.BooleanField(
        default=False, verbose_name="AI summary has been generated"
    )
    ai_summary_generated_at = models.DateTimeField(
        blank=True, null=True, verbose_name="When AI summary was generated"
    )

    class Meta:
        verbose_name = "Learning Resource"
        verbose_name_plural = "Learning Resources"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            # Index for quality rating sorting
            models.Index(fields=["-quality_vote_sum", "-quality_vote_count"]),
        ]

    def __str__(self):
        return self.title

    def average_quality_rating(self):
        """Calculate the average quality rating."""
        if self.quality_vote_count == 0:
            return 0
        return self.quality_vote_sum / self.quality_vote_count

    def dominant_difficulty_level(self):
        """Determine which difficulty level has the most votes."""
        counts = {
            "beginner": self.difficulty_beginner_count,
            "moderate": self.difficulty_moderate_count,
            "advanced": self.difficulty_advanced_count,
        }
        if sum(counts.values()) == 0:
            return None
        return max(counts.items(), key=lambda x: x[1])[0]

    def update_quality_vote_counts(self):
        """Update the cached quality vote count fields"""
        result = self.quality_votes.aggregate(
            count=models.Count("id"), sum=models.Sum("rating")
        )

        self.quality_vote_count = result.get("count", 0) or 0  # Ensure never NULL
        # Ensure sum is never None, default to 0 if there are no votes
        self.quality_vote_sum = result.get("sum", 0) or 0  # Ensure never NULL
        self.save(update_fields=["quality_vote_count", "quality_vote_sum"])

    def update_difficulty_vote_counts(self):
        """Update the cached difficulty vote count fields"""
        beginner_count = self.difficulty_votes.filter(level="beginner").count() or 0
        moderate_count = self.difficulty_votes.filter(level="moderate").count() or 0
        advanced_count = self.difficulty_votes.filter(level="advanced").count() or 0

        self.difficulty_beginner_count = beginner_count
        self.difficulty_moderate_count = moderate_count
        self.difficulty_advanced_count = advanced_count
        self.save(
            update_fields=[
                "difficulty_beginner_count",
                "difficulty_moderate_count",
                "difficulty_advanced_count",
            ]
        )


class ResourceURL(models.Model):
    """
    Model for URLs associated with learning resources
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    learning_resource = models.ForeignKey(
        LearningResource, on_delete=models.CASCADE, related_name="urls"
    )
    url = models.URLField(unique=True)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Resource URL"
        verbose_name_plural = "Resource URLs"
        ordering = ["-is_primary", "-created_at"]

    def __str__(self):
        return f"{self.url} ({'Primary' if self.is_primary else 'Secondary'})"

    def save(self, *args, **kwargs):
        # If this is the first URL for this resource, make it primary
        if (
            not self.pk
            and not ResourceURL.objects.filter(
                learning_resource=self.learning_resource
            ).exists()
        ):
            self.is_primary = True
        super().save(*args, **kwargs)


class ResourcePageAssociation(models.Model):
    """
    Model for associating learning resources with page slugs
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    learning_resource = models.ForeignKey(
        LearningResource, on_delete=models.CASCADE, related_name="page_associations"
    )
    page_slug = models.CharField(max_length=255, db_index=True)
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="resource_associations",
    )
    added_at = models.DateTimeField(auto_now_add=True)

    # Fields for appropriateness votes
    appropriateness_upvotes = models.IntegerField(default=0)
    appropriateness_downvotes = models.IntegerField(default=0)
    appropriateness_score = models.IntegerField(default=0, db_index=True)

    class Meta:
        verbose_name = "Resource Page Association"
        verbose_name_plural = "Resource Page Associations"
        ordering = ["-appropriateness_score", "-added_at"]
        unique_together = ("learning_resource", "page_slug")
        indexes = [
            models.Index(fields=["-appropriateness_score"]),
            models.Index(fields=["page_slug", "-appropriateness_score"]),
        ]

    def __str__(self):
        return f"{self.learning_resource.title} - {self.page_slug}"

    def update_appropriateness_vote_counts(self):
        """Update the cached appropriateness vote count fields"""
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


class QualityVote(TimestampMixin, models.Model):
    """
    Model for tracking user votes on resource quality (1-5 stars)
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quality_votes"
    )
    learning_resource = models.ForeignKey(
        LearningResource, on_delete=models.CASCADE, related_name="quality_votes"
    )
    rating = models.IntegerField(
        choices=[(i, str(i)) for i in range(1, 6)],  # 1-5 rating
    )

    class Meta:
        verbose_name = "Quality Vote"
        verbose_name_plural = "Quality Votes"
        unique_together = ("user", "learning_resource")

    def __str__(self):
        return f"{self.user.username}: {self.rating} stars for {self.learning_resource.title}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update the resource's vote counts
        self.learning_resource.update_quality_vote_counts()

    def delete(self, *args, **kwargs):
        resource = self.learning_resource  # Keep reference before deletion
        super().delete(*args, **kwargs)
        # After deleting, update the resource's vote counts
        resource.update_quality_vote_counts()


class DifficultyVote(TimestampMixin, models.Model):
    """
    Model for tracking user votes on resource difficulty level
    """

    LEVEL_CHOICES = (
        ("beginner", "Beginner"),
        ("moderate", "Moderate"),
        ("advanced", "Advanced"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="difficulty_votes",
    )
    learning_resource = models.ForeignKey(
        LearningResource, on_delete=models.CASCADE, related_name="difficulty_votes"
    )
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES)

    class Meta:
        verbose_name = "Difficulty Vote"
        verbose_name_plural = "Difficulty Votes"
        unique_together = ("user", "learning_resource")

    def __str__(self):
        return f"{self.user.username}: {self.get_level_display()} for {self.learning_resource.title}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update the resource's vote counts
        self.learning_resource.update_difficulty_vote_counts()

    def delete(self, *args, **kwargs):
        resource = self.learning_resource  # Keep reference before deletion
        super().delete(*args, **kwargs)
        # After deleting, update the resource's vote counts
        resource.update_difficulty_vote_counts()


class AppropriatenessVote(models.Model):
    """
    Model for tracking user votes on resource-page association appropriateness
    """

    VOTE_TYPES = (
        ("upvote", "Upvote"),
        ("downvote", "Downvote"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="appropriateness_votes",
    )
    association = models.ForeignKey(
        ResourcePageAssociation,
        on_delete=models.CASCADE,
        related_name="appropriateness_votes",
    )
    vote_type = models.CharField(max_length=10, choices=VOTE_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Appropriateness Vote"
        verbose_name_plural = "Appropriateness Votes"
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
