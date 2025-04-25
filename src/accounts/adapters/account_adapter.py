from allauth.account.adapter import DefaultAccountAdapter
from django.conf import settings


class CustomAccountAdapter(DefaultAccountAdapter):
    """
    Custom account adapter to handle specific behaviors for our application.
    This adapter extends the DefaultAccountAdapter from django-allauth.
    """

    def get_login_redirect_url(self, request):
        """
        Return the URL to redirect to after successful login.
        """
        return settings.LOGIN_REDIRECT_URL

    def get_email_verification_redirect_url(self, email_address):
        """
        The URL to return to after successful email verification.
        """
        return settings.LOGIN_REDIRECT_URL

    def is_open_for_signup(self, request):
        """
        Whether registration is allowed.
        """
        return True

    def clean_username(self, username, *args, **kwargs):
        """
        Custom username validation
        """
        # This uses the allauth's built-in validator with case insensitivity
        return super().clean_username(username, *args, **kwargs)

    def clean_email(self, email):
        """
        Custom email validation
        """
        # Apply our own validation on top of allauth's built-in validator
        email = super().clean_email(email)
        # Add any additional email validation here if needed
        return email
