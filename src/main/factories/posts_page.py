from .base_page import BasePageFactory
from ..pages.posts import PostsPage


class PostsPageFactory(BasePageFactory):
    class Meta:
        model = PostsPage
