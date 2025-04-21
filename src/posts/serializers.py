from rest_framework import serializers
from .models import Post, Tag, Category, SecondarySlug
from django.contrib.auth import get_user_model
from django.utils.text import slugify

User = get_user_model()


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']
        read_only_fields = ['id', 'slug']


class CategorySerializer(serializers.ModelSerializer):
    parent_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'parent', 'parent_name']
        read_only_fields = ['id', 'slug']
    
    def get_parent_name(self, obj):
        if obj.parent:
            return obj.parent.name
        return None


class SecondarySlugSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecondarySlug
        fields = ['id', 'slug', 'created_at']
        read_only_fields = ['id', 'created_at']


class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_username = serializers.SerializerMethodField()
    tags = TagSerializer(many=True, read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    secondary_slugs = SecondarySlugSerializer(many=True, read_only=True)
    created_date = serializers.SerializerMethodField()
    updated_date = serializers.SerializerMethodField()
    tag_names = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )
    category_names = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "content",
            "primary_slug",
            "page_slug",
            "author",
            "author_name",
            "author_username",
            "created_at",
            "updated_at",
            "created_date",
            "updated_date",
            "status",
            "tags",
            "categories",
            "secondary_slugs",
            "metadata",
            "tag_names",
            "category_names",
        ]
        read_only_fields = [
            "id", 
            "created_at", 
            "updated_at", 
            "author", 
            "primary_slug",
            "page_slug"
        ]

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.username

    def get_author_username(self, obj):
        return obj.author.username
    
    def get_created_date(self, obj):
        return obj.created_at.strftime("%B %d, %Y")
    
    def get_updated_date(self, obj):
        return obj.updated_at.strftime("%B %d, %Y")

    def create(self, validated_data):
        # Handle tags and categories
        tag_names = validated_data.pop('tag_names', [])
        category_names = validated_data.pop('category_names', [])
        
        # Set the current user as the author
        validated_data["author"] = self.context["request"].user
        
        # Create the post instance
        post = Post.objects.create(**validated_data)
        
        # Add tags
        self._handle_tags(post, tag_names)
        
        # Add categories
        self._handle_categories(post, category_names)
        
        return post

    def update(self, instance, validated_data):
        # Handle tags and categories
        tag_names = validated_data.pop('tag_names', None)
        category_names = validated_data.pop('category_names', None)
        
        # Update the instance with validated data
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Update tags if provided
        if tag_names is not None:
            self._handle_tags(instance, tag_names)
        
        # Update categories if provided
        if category_names is not None:
            self._handle_categories(instance, category_names)
        
        return instance
    
    def _handle_tags(self, post, tag_names):
        # Clear existing tags if empty list provided
        if tag_names == []:
            post.tags.clear()
            return
            
        # Add tags to the post
        for tag_name in tag_names:
            tag, created = Tag.objects.get_or_create(
                name=tag_name,
                defaults={'slug': slugify(tag_name)}
            )
            post.tags.add(tag)
    
    def _handle_categories(self, post, category_names):
        # Clear existing categories if empty list provided
        if category_names == []:
            post.categories.clear()
            return
            
        # Add categories to the post
        for category_name in category_names:
            category, created = Category.objects.get_or_create(
                name=category_name,
                defaults={'slug': slugify(category_name)}
            )
            post.categories.add(category)
