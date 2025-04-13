from rest_framework import serializers
from .models import Post
from django.contrib.auth import get_user_model

User = get_user_model()


class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "content",
            "page_slug",
            "author",
            "author_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "author"]

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.username

    def create(self, validated_data):
        # Set the current user as the author
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)
