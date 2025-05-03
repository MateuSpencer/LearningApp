from rest_framework import serializers
from .models import (
    LearningResource,
    ResourceURL,
    ResourcePageAssociation,
    QualityVote,
    AccessibilityVote,
    AppropriatenessVote,
)


class ResourceURLSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceURL
        fields = ["id", "url", "is_primary", "created_at"]
        read_only_fields = ["id", "created_at"]


class LearningResourceSerializer(serializers.ModelSerializer):
    urls = ResourceURLSerializer(many=True, read_only=True)
    primary_url = serializers.SerializerMethodField()
    average_quality_rating = serializers.SerializerMethodField()
    dominant_accessibility_level = serializers.SerializerMethodField()
    user_quality_vote = serializers.SerializerMethodField()
    user_accessibility_vote = serializers.SerializerMethodField()
    # Optional field for creating a resource with URLs
    url_list = serializers.ListField(
        child=serializers.URLField(), write_only=True, required=False
    )

    class Meta:
        model = LearningResource
        fields = [
            "id",
            "title",
            "resource_type",
            "created_at",
            "updated_at",
            "quality_vote_count",
            "quality_vote_sum",
            "accessibility_beginner_count",
            "accessibility_moderate_count",
            "accessibility_advanced_count",
            "average_quality_rating",
            "dominant_accessibility_level",
            "urls",
            "primary_url",
            "user_quality_vote",
            "user_accessibility_vote",
            "url_list",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "quality_vote_count",
            "quality_vote_sum",
            "accessibility_beginner_count",
            "accessibility_moderate_count",
            "accessibility_advanced_count",
        ]

    def get_average_quality_rating(self, obj):
        return obj.average_quality_rating()

    def get_dominant_accessibility_level(self, obj):
        return obj.dominant_accessibility_level()

    def get_primary_url(self, obj):
        try:
            primary_url = obj.urls.get(is_primary=True)
            return ResourceURLSerializer(primary_url).data
        except ResourceURL.DoesNotExist:
            return None

    def get_user_quality_vote(self, obj):
        """Return the current user's quality vote on this resource, if any"""
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None

        try:
            vote = obj.quality_votes.get(user=request.user)
            return vote.rating
        except QualityVote.DoesNotExist:
            return None

    def get_user_accessibility_vote(self, obj):
        """Return the current user's accessibility vote on this resource, if any"""
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None

        try:
            vote = obj.accessibility_votes.get(user=request.user)
            return vote.level
        except AccessibilityVote.DoesNotExist:
            return None

    def create(self, validated_data):
        # Extract URLs if included
        url_list = validated_data.pop("url_list", [])

        # Create the learning resource
        learning_resource = LearningResource.objects.create(**validated_data)

        # Add URLs if provided
        for url in url_list:
            ResourceURL.objects.create(
                learning_resource=learning_resource,
                url=url,
                # First URL will be primary, handled by ResourceURL.save()
            )

        return learning_resource


class ResourcePageAssociationSerializer(serializers.ModelSerializer):
    resource = LearningResourceSerializer(source="learning_resource", read_only=True)
    resource_id = serializers.UUIDField(write_only=True)
    added_by_username = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = ResourcePageAssociation
        fields = [
            "id",
            "resource",
            "resource_id",
            "page_slug",
            "added_by",
            "added_by_username",
            "added_at",
            "appropriateness_upvotes",
            "appropriateness_downvotes",
            "appropriateness_score",
            "user_vote",
        ]
        read_only_fields = [
            "id",
            "added_by",
            "added_at",
            "appropriateness_upvotes",
            "appropriateness_downvotes",
            "appropriateness_score",
        ]

    def get_added_by_username(self, obj):
        return obj.added_by.username

    def get_user_vote(self, obj):
        """Return the current user's appropriateness vote on this association, if any"""
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None

        try:
            vote = obj.appropriateness_votes.get(user=request.user)
            return vote.vote_type
        except AppropriatenessVote.DoesNotExist:
            return None

    def create(self, validated_data):
        # Get the current user from the context
        user = self.context["request"].user

        # Get the learning resource by ID
        resource_id = validated_data.pop("resource_id")
        try:
            learning_resource = LearningResource.objects.get(id=resource_id)
        except LearningResource.DoesNotExist:
            raise serializers.ValidationError(
                {"resource_id": "Learning resource not found."}
            )

        # Create the association
        association = ResourcePageAssociation.objects.create(
            learning_resource=learning_resource, added_by=user, **validated_data
        )

        return association


class QualityVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = QualityVote
        fields = ["id", "learning_resource", "rating", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        learning_resource = validated_data["learning_resource"]
        rating = validated_data["rating"]

        # Check if the user already has a vote for this resource
        try:
            # If vote exists, update it
            existing_vote = QualityVote.objects.get(
                learning_resource=learning_resource, user=user
            )

            # Same rating means toggle off (delete vote)
            if existing_vote.rating == rating:
                existing_vote.delete()
                return None

            # Different rating means update
            existing_vote.rating = rating
            existing_vote.save()
            return existing_vote

        except QualityVote.DoesNotExist:
            # Create a new vote
            return QualityVote.objects.create(
                learning_resource=learning_resource, user=user, rating=rating
            )


class AccessibilityVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessibilityVote
        fields = ["id", "learning_resource", "level", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        learning_resource = validated_data["learning_resource"]
        level = validated_data["level"]

        # Check if the user already has a vote for this resource
        try:
            # If vote exists, update it
            existing_vote = AccessibilityVote.objects.get(
                learning_resource=learning_resource, user=user
            )

            # Same level means toggle off (delete vote)
            if existing_vote.level == level:
                existing_vote.delete()
                return None

            # Different level means update
            existing_vote.level = level
            existing_vote.save()
            return existing_vote

        except AccessibilityVote.DoesNotExist:
            # Create a new vote
            return AccessibilityVote.objects.create(
                learning_resource=learning_resource, user=user, level=level
            )


class AppropriatenessVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppropriatenessVote
        fields = ["id", "association", "vote_type", "created_at"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        association = validated_data["association"]
        vote_type = validated_data["vote_type"]

        # Check if the user already has a vote for this association
        try:
            # If vote exists, update it
            existing_vote = AppropriatenessVote.objects.get(
                association=association, user=user
            )

            # Same vote type means toggle off (delete vote)
            if existing_vote.vote_type == vote_type:
                existing_vote.delete()
                return None

            # Different vote type means update
            existing_vote.vote_type = vote_type
            existing_vote.save()
            return existing_vote

        except AppropriatenessVote.DoesNotExist:
            # Create a new vote
            return AppropriatenessVote.objects.create(
                association=association, user=user, vote_type=vote_type
            )
