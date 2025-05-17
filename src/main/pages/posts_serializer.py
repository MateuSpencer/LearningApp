from rest_framework import serializers
from . import PostsPage
from .base_serializer import BasePageSerializer
from posts.serializers import PostSerializer


class PostsPageSerializer(BasePageSerializer):
    """Base serializer for the PostsPage"""

    class Meta:
        model = PostsPage
        fields = BasePageSerializer.Meta.fields


class PostDetailSerializer(PostsPageSerializer):
    """Serializer for post detail view"""

    post = serializers.SerializerMethodField()
    postId = serializers.SerializerMethodField()

    class Meta:
        model = PostsPage
        fields = PostsPageSerializer.Meta.fields + [
            "post",
            "postId",
        ]

    def get_post(self, page):
        post = self.context.get("post")
        if not post:
            return None
        return PostSerializer(
            post, context={"request": self.context.get("request")}
        ).data

    def get_postId(self, page):
        # Return the post_id from the context
        return str(self.context.get("post_id"))


class UserPostsSerializer(BasePageSerializer):
    """Serializer for the my posts view"""

    class Meta:
        model = PostsPage
        fields = BasePageSerializer.Meta.fields
