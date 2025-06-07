import wagtail_factories
from django.test.client import RequestFactory
from wagtail.test.utils import WagtailPageTests

from ..factories.about_page import AboutPageFactory


class AboutPageTest(WagtailPageTests):
    def setUp(self):
        self.site = wagtail_factories.SiteFactory()
        self.factory = RequestFactory(
            SERVER_NAME="{}:{}".format(self.site.hostname, self.site.port)
        )
        self.root_page = self.site.root_page

    def test_that_company_name_are_returned(self):
        page = AboutPageFactory.create(
            title="About", company_name="Acme", parent=self.root_page
        )

        data = page.get_component_data({})
        self.assertEqual(data["component_props"]["company_name"], "Acme")

    def test_that_about_text_is_returned(self):
        page = AboutPageFactory.create(
            title="About",
            company_name="Acme",
            about_text="<p>This is about Acme company.</p>",
            parent=self.root_page,
        )

        data = page.get_component_data({})
        self.assertEqual(
            data["component_props"]["about_text"], "<p>This is about Acme company.</p>"
        )
