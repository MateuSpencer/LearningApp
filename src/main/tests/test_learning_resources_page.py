from wagtail.test.utils import WagtailPageTests
from wagtail_factories import SiteFactory

from ..factories.base_page import BasePageFactory
from ..factories.learning_resources_page import LearningResourcesPageFactory
from ..pages import LearningResourcesPageSerializer


class LearningResourcesPageTest(WagtailPageTests):
    def setUp(self):
        self.root_page = BasePageFactory.create(title="Start", parent=None)
        SiteFactory.create(root_page=self.root_page)

    def test_get_serializer_class(self):
        page = LearningResourcesPageFactory.create(
            title="Learning Resources", parent=self.root_page
        )
        self.assertEqual(page.get_serializer_class(), LearningResourcesPageSerializer)

    def test_json_representation(self):
        page = LearningResourcesPageFactory.create(
            title="Learning Resources", parent=self.root_page
        )

        data = page.get_component_data({})

        self.assertTrue("component_props" in data)
        self.assertTrue("title" in data["component_props"])
        self.assertEqual("Learning Resources", data["component_props"]["title"])
