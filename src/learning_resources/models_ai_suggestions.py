from django.db import models
from django.conf import settings
from main.mixins import TimestampMixin
import uuid


class AISuggestedResource(TimestampMixin, models.Model):
    """
    Model for storing AI-suggested learning resources for article pages
    Resources are stored as suggestions until they are added to the site
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # The page slug this suggestion is for
    page_slug = models.CharField(max_length=255, db_index=True)

    # Resource information
    title = models.CharField(max_length=255)
    url = models.URLField()
    resource_type = models.CharField(
        max_length=20,
        choices=(
            ("video", "Video"),
            ("youtube", "YouTube"),
            ("pdf", "PDF"),
            ("image", "Image"),
            ("website", "Website"),
            ("article", "Article"),
            ("book", "Book"),
            ("course", "Course"),
            ("documentation", "Documentation"),
            ("tutorial", "Tutorial"),
            ("tool", "Tool"),
        ),
        default="website",
    )
    description = models.TextField(blank=True, null=True)

    # Status of the suggestion
    is_added = models.BooleanField(default=False)

    # When it becomes an actual resource
    learning_resource = models.ForeignKey(
        "learning_resources.LearningResource",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ai_suggestion_origin",
    )

    class Meta:
        verbose_name = "AI Suggested Resource"
        verbose_name_plural = "AI Suggested Resources"
        ordering = ["-created_at"]
        # Prevent duplicate suggestions for the same URL on the same page
        unique_together = [("page_slug", "url")]
        indexes = [
            models.Index(fields=["page_slug"]),
        ]

    def __str__(self):
        return f"{self.title} - {self.page_slug}"

    def convert_to_resource(self, user):
        """
        Convert this suggestion to an actual LearningResource and associate it with the page
        """
        from .models import LearningResource, ResourceURL, ResourcePageAssociation

        # Do nothing if already added
        if self.is_added and self.learning_resource:
            return self.learning_resource

        # Create the learning resource
        resource = LearningResource.objects.create(
            title=self.title,
            resource_type=self.resource_type,
        )

        # Create the URL for the resource
        ResourceURL.objects.create(
            learning_resource=resource,
            url=self.url,
            is_primary=True,
        )

        # Associate the resource with the page
        ResourcePageAssociation.objects.create(
            learning_resource=resource,
            page_slug=self.page_slug,
            added_by=user,
        )

        # Mark this suggestion as added
        self.is_added = True
        self.learning_resource = resource
        self.save()

        return resource
