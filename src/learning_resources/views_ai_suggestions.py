from django.utils import timezone
from rest_framework import viewsets, permissions, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response

from .models_ai_suggestions import AISuggestedResource
from .serializers_ai_suggestions import AISuggestedResourceSerializer
from .models import ResourceURL


class AISuggestedResourceViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows AI-suggested learning resources to be viewed, created, or deleted.

    GET /api/learning-resources/ai-suggestions/?page_slug=article-slug
    POST /api/learning-resources/ai-suggestions/
    DELETE /api/learning-resources/ai-suggestions/{id}/
    POST /api/learning-resources/ai-suggestions/{id}/add_to_resources/
    """

    queryset = AISuggestedResource.objects.all()
    serializer_class = AISuggestedResourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Filter to only show suggestions that aren't already resources,
        if specified in query params
        """
        queryset = super().get_queryset()

        # Filter by page slug if provided
        page_slug = self.request.query_params.get("page_slug")
        if page_slug:
            queryset = queryset.filter(page_slug=page_slug)

        # Filter by is_added status if provided
        is_added = self.request.query_params.get("is_added")
        if is_added is not None:
            is_added_bool = is_added.lower() in ["true", "1", "yes"]
            queryset = queryset.filter(is_added=is_added_bool)

        # Exclude resources that already exist as actual resources with the same URL,
        # but only if filter_existing=true
        filter_existing = (
            self.request.query_params.get("filter_existing", "false").lower() == "true"
        )
        if filter_existing:
            # Get all existing URLs in the system
            existing_urls = ResourceURL.objects.values_list("url", flat=True)
            queryset = queryset.exclude(url__in=existing_urls)

        return queryset

    def perform_create(self, serializer):
        """Add extra validation when creating a suggestion"""
        # Check if the URL already exists as a suggestion for this page
        page_slug = serializer.validated_data.get("page_slug")
        url = serializer.validated_data.get("url")

        existing_suggestion = AISuggestedResource.objects.filter(
            page_slug=page_slug, url=url
        ).first()

        if existing_suggestion:
            # If it exists but was previously added to resources, we can reuse it
            if existing_suggestion.is_added:
                existing_suggestion.is_added = False
                existing_suggestion.save()
                return
            # Otherwise it's a duplicate
            raise serializer.ValidationError(
                {"url": "This URL has already been suggested for this page"}
            )

        serializer.save()

    @action(detail=True, methods=["post"])
    def add_to_resources(self, request, pk=None):
        """Add this suggestion to the actual learning resources"""
        suggestion = self.get_object()

        if suggestion.is_added:
            return Response(
                {
                    "detail": "This suggestion has already been added as a resource.",
                    "resource_id": (
                        str(suggestion.learning_resource.id)
                        if suggestion.learning_resource
                        else None
                    ),
                }
            )

        # Convert to a resource
        resource = suggestion.convert_to_resource(request.user)

        return Response(
            {
                "detail": "Successfully added the suggestion as a learning resource.",
                "resource_id": str(resource.id),
                "suggestion_updated": True,
            }
        )

    @action(detail=False, methods=["post"])
    def generate_for_article(self, request):
        """
        Generate AI suggestions for a specific wiki article

        POST /api/learning-resources/ai-suggestions/generate_for_article/
        {
            "page_slug": "article-slug",
            "article_title": "Article Title",
            "article_content": "Article content snippet...",
            "count": 5
        }
        """
        page_slug = request.data.get("page_slug")
        article_title = request.data.get("article_title", "")
        article_content = request.data.get("article_content", "")
        count = request.data.get("count", 5)

        if not page_slug:
            return Response(
                {"error": "page_slug is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get existing URLs to avoid duplicates
            existing_urls = set(ResourceURL.objects.values_list("url", flat=True))
            existing_suggestion_urls = set(
                AISuggestedResource.objects.filter(page_slug=page_slug).values_list(
                    "url", flat=True
                )
            )
            all_existing_urls = existing_urls.union(existing_suggestion_urls)

            # Generate AI suggestions (mock implementation for now)
            # In a real implementation, this would call an AI service
            suggestions_data = self._generate_mock_suggestions(
                page_slug, article_title, article_content, count, all_existing_urls
            )

            # Create suggestion objects
            created_suggestions = []
            for suggestion_data in suggestions_data:
                suggestion = AISuggestedResource.objects.create(
                    title=suggestion_data["title"],
                    url=suggestion_data["url"],
                    resource_type=suggestion_data["resource_type"],
                    description=suggestion_data["description"],
                    page_slug=page_slug,
                )
                created_suggestions.append(suggestion)

            serializer = AISuggestedResourceSerializer(created_suggestions, many=True)
            return Response(
                {"suggestions": serializer.data, "count": len(created_suggestions)}
            )

        except Exception as e:
            return Response(
                {"error": f"Failed to generate suggestions: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["post"])
    def find_more(self, request):
        """
        Generate additional AI suggestions for an article, excluding existing ones

        POST /api/learning-resources/ai-suggestions/find_more/
        {
            "page_slug": "article-slug",
            "article_title": "Article Title",
            "count": 3
        }
        """
        page_slug = request.data.get("page_slug")
        article_title = request.data.get("article_title", "")
        count = request.data.get("count", 3)

        if not page_slug:
            return Response(
                {"error": "page_slug is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Use the same generation logic as generate_for_article
        return self.generate_for_article(request)

    @action(detail=False, methods=["post"])
    def cleanup_for_page(self, request):
        """
        Clean up suggestions for a page by removing those that already exist as resources

        POST /api/learning-resources/ai-suggestions/cleanup_for_page/
        {
            "page_slug": "article-slug"
        }
        """
        page_slug = request.data.get("page_slug")

        if not page_slug:
            return Response(
                {"error": "page_slug is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Get all existing URLs in the system
        existing_urls = set(ResourceURL.objects.values_list("url", flat=True))

        # Find suggestions that have URLs that now exist as resources
        duplicate_suggestions = AISuggestedResource.objects.filter(
            page_slug=page_slug, is_added=False, url__in=existing_urls
        )

        cleaned_count = duplicate_suggestions.count()

        # Mark them as added (they exist as resources now)
        duplicate_suggestions.update(is_added=True)

        return Response(
            {
                "detail": f"Cleaned up {cleaned_count} suggestions that already exist as resources.",
                "cleaned_count": cleaned_count,
            }
        )

    @action(detail=False, methods=["get"])
    def stats_for_page(self, request):
        """
        Get statistics about suggestions for a specific page

        GET /api/learning-resources/ai-suggestions/stats_for_page/?page_slug=article-slug
        """
        page_slug = request.query_params.get("page_slug")

        if not page_slug:
            return Response(
                {"error": "page_slug is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Get counts
        total_suggestions = AISuggestedResource.objects.filter(
            page_slug=page_slug
        ).count()
        active_suggestions = AISuggestedResource.objects.filter(
            page_slug=page_slug, is_added=False
        ).count()
        added_suggestions = AISuggestedResource.objects.filter(
            page_slug=page_slug, is_added=True
        ).count()

        # Get existing resources count
        from .models import ResourcePageAssociation

        existing_resources = ResourcePageAssociation.objects.filter(
            page_slug=page_slug
        ).count()

        return Response(
            {
                "page_slug": page_slug,
                "total_suggestions": total_suggestions,
                "active_suggestions": active_suggestions,
                "added_suggestions": added_suggestions,
                "existing_resources": existing_resources,
            }
        )

    def _generate_mock_suggestions(
        self, page_slug, article_title, article_content, count, existing_urls
    ):
        """
        Mock implementation of AI suggestion generation
        In a real implementation, this would integrate with an AI service like OpenAI, Claude, etc.

        This function provides realistic-looking suggestions based on the article content.
        """
        import random

        # Generate suggestions based on article title patterns
        suggestions = []

        # Base URLs that can be used for different types of resources
        base_patterns = [
            # Educational websites
            ("website", "https://www.khanacademy.org/", "Khan Academy"),
            ("website", "https://www.coursera.org/", "Coursera"),
            ("website", "https://www.edx.org/", "edX"),
            ("website", "https://www.udemy.com/", "Udemy"),
            # Documentation and references
            ("website", "https://developer.mozilla.org/", "MDN Web Docs"),
            ("website", "https://docs.python.org/", "Python Documentation"),
            ("website", "https://stackoverflow.com/", "Stack Overflow"),
            # YouTube channels
            ("youtube", "https://www.youtube.com/watch?v=", "YouTube Tutorial"),
            # Academic resources
            ("pdf", "https://arxiv.org/pdf/", "Research Paper"),
            ("article", "https://medium.com/", "Medium Article"),
            ("book", "https://www.oreilly.com/", "O'Reilly Book"),
        ]

        # Keywords that might appear in article titles to generate relevant suggestions
        topic_keywords = {
            "python": ["programming", "coding", "development", "tutorial"],
            "javascript": ["web development", "frontend", "programming", "js"],
            "machine learning": ["AI", "ML", "data science", "neural networks"],
            "database": ["SQL", "NoSQL", "data management", "storage"],
            "web": ["frontend", "backend", "full stack", "development"],
            "api": ["REST", "GraphQL", "web services", "integration"],
            "security": ["cybersecurity", "encryption", "privacy", "protection"],
            "cloud": ["AWS", "Azure", "GCP", "DevOps"],
        }

        # Generate suggestions based on article title
        title_lower = article_title.lower()
        relevant_topics = []

        for topic, keywords in topic_keywords.items():
            if topic in title_lower or any(
                keyword.lower() in title_lower for keyword in keywords
            ):
                relevant_topics.append(topic)

        # If no specific topics found, use generic approach
        if not relevant_topics:
            relevant_topics = ["tutorial", "guide", "reference"]

        # Generate suggestions
        suggestion_templates = [
            {
                "title": "Introduction to {topic}",
                "desc": "A comprehensive introduction to {topic} covering the basics and fundamentals.",
            },
            {
                "title": "{topic} Tutorial for Beginners",
                "desc": "Step-by-step tutorial explaining {topic} concepts with practical examples.",
            },
            {
                "title": "Advanced {topic} Guide",
                "desc": "In-depth guide covering advanced topics and best practices for {topic}.",
            },
            {
                "title": "{topic} Reference Documentation",
                "desc": "Complete reference documentation for {topic} with detailed explanations.",
            },
            {
                "title": "Practical {topic} Examples",
                "desc": "Collection of practical examples and code snippets for {topic}.",
            },
            {
                "title": "{topic} Best Practices",
                "desc": "Industry best practices and common patterns for working with {topic}.",
            },
            {
                "title": "Complete {topic} Course",
                "desc": "Comprehensive online course covering {topic} from beginner to advanced level.",
            },
            {
                "title": "{topic} Cheat Sheet",
                "desc": "Quick reference guide and cheat sheet for {topic}.",
            },
        ]

        # Generate suggestions
        for i in range(count * 2):  # Generate more than needed, then filter
            if len(suggestions) >= count:
                break

            # Pick a random topic and template
            topic = random.choice(relevant_topics + [article_title])
            template = random.choice(suggestion_templates)
            resource_type, base_url, provider = random.choice(base_patterns)

            # Generate unique URL
            url_suffix = f"{page_slug}-{random.randint(1000, 9999)}"
            if resource_type == "youtube":
                url = f"{base_url}{random.choice(['dQw4w9WgXcQ', 'oHg5SJYRHA0', 'kJQP7kiw5Fk'])}"  # Example video IDs
            elif resource_type == "pdf":
                url = f"{base_url}{random.randint(1000, 9999)}.{random.randint(1000, 9999)}.pdf"
            else:
                url = f"{base_url}{url_suffix}"

            # Skip if URL already exists
            if url in existing_urls:
                continue

            # Create suggestion
            suggestion = {
                "title": template["title"].format(topic=topic.title()),
                "url": url,
                "resource_type": resource_type,
                "description": template["desc"].format(topic=topic.title()),
            }

            suggestions.append(suggestion)
            existing_urls.add(url)  # Track to avoid duplicates

        return suggestions[:count]
