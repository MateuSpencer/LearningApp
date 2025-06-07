from .base_page import BasePageFactory
from ..pages.learning_resources import LearningResourcesPage


class LearningResourcesPageFactory(BasePageFactory):
    class Meta:
        model = LearningResourcesPage
