from rest_framework import serializers
from .models import Post, PostPageAssociation, PostAppropriatenessVote
from django.contrib.auth import get_user_model
from django.utils.text import slugify

User = get_user_model()


class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_username = serializers.SerializerMethodField()
    created_date = serializers.SerializerMethodField()
    updated_date = serializers.SerializerMethodField()
    content_preview = serializers.SerializerMethodField()
    # Add page associations
    page_associations = serializers.SerializerMethodField(read_only=True)
    # Optional associated page slugs for creating new associations
    page_slugs = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False
    )

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "content",
            "content_preview",
            "author",
            "author_name",
            "author_username",
            "created_at",
            "updated_at",
            "created_date",
            "updated_date",
            "status",
            "language",
            "metadata",
            "page_associations",
            "page_slugs",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "author",
            "content_preview",
            "page_associations",
        ]

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.username

    def get_author_username(self, obj):
        return obj.author.username

    def get_created_date(self, obj):
        return obj.created_at.strftime("%B %d, %Y")

    def get_updated_date(self, obj):
        return obj.updated_at.strftime("%B %d, %Y")

    def get_page_associations(self, obj):
        """Return a list of page slugs this post is associated with"""
        associations = obj.page_associations.all()
        return [
            {
                "id": str(assoc.id),
                "page_slug": assoc.page_slug,
                "appropriateness_score": assoc.appropriateness_score,
                "user_vote": self.get_user_association_vote(assoc),
            }
            for assoc in associations
        ]

    def get_user_association_vote(self, association):
        """Get the user's vote for a specific association"""
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None

        try:
            vote = association.appropriateness_votes.get(user=request.user)
            return vote.vote_type
        except PostAppropriatenessVote.DoesNotExist:
            return None

    def create(self, validated_data):
        page_slugs = validated_data.pop("page_slugs", [])

        # Set the current user as the author
        validated_data["author"] = self.context["request"].user

        # Create the post instance
        post = Post.objects.create(**validated_data)

        # Create page associations
        user = self.context["request"].user

        # A post must be associated with at least one page
        if not page_slugs:
            raise serializers.ValidationError(
                {"page_slugs": "At least one page slug is required"}
            )

        self._handle_page_associations(post, page_slugs, user)

        return post

    def update(self, instance, validated_data):
        page_slugs = validated_data.pop("page_slugs", None)

        # Update the instance with validated data
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        # Update page associations if provided
        if page_slugs is not None:
            # Cannot remove all associations - a post must be associated with at least one page
            if not page_slugs:
                raise serializers.ValidationError(
                    {"page_slugs": "Post must remain associated with at least one page"}
                )

            user = self.context["request"].user
            self._handle_page_associations(instance, page_slugs, user)

        return instance

    def _handle_page_associations(self, post, page_slugs, user):
        """
        Handle page associations for a post
        A post must always be associated with at least one page
        """
        # Create new associations for each slug that doesn't have one yet
        for slug in page_slugs:
            if not post.page_associations.filter(page_slug=slug).exists():
                PostPageAssociation.objects.create(
                    post=post, page_slug=slug, added_by=user
                )

    def get_content_preview(self, obj):
        """Return a truncated version of the content for list views"""
        if len(obj.content) > 200:
            return obj.content[:200] + "..."
        return obj.content


class PostPageAssociationSerializer(serializers.ModelSerializer):
    post_title = serializers.CharField(source="post.title", read_only=True)
    post_status = serializers.CharField(source="post.status", read_only=True)
    post_author = serializers.CharField(source="post.author.username", read_only=True)
    added_by_username = serializers.CharField(
        source="added_by.username", read_only=True
    )
    user_vote = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PostPageAssociation
        fields = [
            "id",
            "post",
            "post_title",
            "post_status",
            "post_author",
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
            "added_at",
            "appropriateness_upvotes",
            "appropriateness_downvotes",
            "appropriateness_score",
        ]

    def get_user_vote(self, obj):
        """Return the current user's vote on this association, if any"""
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None

        try:
            vote = obj.appropriateness_votes.get(user=request.user)
            return vote.vote_type
        except PostAppropriatenessVote.DoesNotExist:
            return None


class PostAppropriatenessVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostAppropriatenessVote
        fields = ["id", "association", "vote_type", "created_at"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        association = validated_data["association"]
        vote_type = validated_data["vote_type"]

        # Check if the user already has a vote for this association
        try:
            # If vote exists, update it
            existing_vote = PostAppropriatenessVote.objects.get(
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

        except PostAppropriatenessVote.DoesNotExist:
            # Create a new vote
            return PostAppropriatenessVote.objects.create(
                association=association, user=user, vote_type=vote_type
            )
