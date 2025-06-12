import os
from typing import Optional

from utils.env import get_env, get_env_bool  # NOQA: F401


# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

# Version, be sure to bump this with each release (please follow semver.org)
APP_VERSION = "0.1.0"

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = get_env("SECRET_KEY", required=True)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# This is when debug is off, else django wont allow you to visit the site
ALLOWED_HOSTS = get_env("ALLOWED_HOSTS", required=True).split(",")

INTERNAL_IPS = ["127.0.0.1"]


# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sitemaps",
    "django.contrib.gis",
    "django.contrib.sites",  # Required for allauth
    # Third party apps
    "wagtail.embeds",
    "wagtail.sites",
    "wagtail.users",
    "wagtail.snippets",
    "wagtail.documents",
    "wagtail.images",
    "wagtail.admin",
    "wagtail.search",
    "wagtail",
    "wagtail.contrib.forms",
    "wagtail.contrib.redirects",
    "wagtail.contrib.routable_page",
    "wagtail.contrib.settings",
    "wagtail_localize",
    "wagtail_localize.locales",
    "modelcluster",
    "taggit",
    "wagtail_meta_preview",
    "wagtail_headless_preview",
    "rest_framework",
    # Django AllAuth
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    # "allauth.socialaccount.providers.google",
    # "allauth.socialaccount.providers.facebook",
    # Project specific apps
    "pipit",
    "sitesettings",
    "customuser",
    "customimage",
    "customdocument",
    "main",
    "nextjs",
    "posts",
    "learning_resources",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "allauth.account.middleware.AccountMiddleware",
]

ROOT_URLCONF = "pipit.urls"
APPEND_SLASH = True

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [
            os.path.join(
                os.path.dirname(BASE_DIR), "templates"
            ),  # Project-level templates
            os.path.join(
                os.path.dirname(BASE_DIR), "main", "templates"
            ),  # main app templates
        ],
        "OPTIONS": {
            "debug": DEBUG,
            "loaders": [
                "django.template.loaders.filesystem.Loader",
                "django.template.loaders.app_directories.Loader",
            ],
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.template.context_processors.i18n",
                "django.template.context_processors.media",
                "django.template.context_processors.static",
                "django.template.context_processors.tz",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "wagtail.contrib.settings.context_processors.settings",
                # Project specific
                "pipit.context_processors.settings_context_processor",
            ],
        },
    }
]

WSGI_APPLICATION = "pipit.wsgi.application"


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases
# Using PostgreSQL
DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": get_env("DATABASE_NAME", required=True),
        "USER": get_env("DATABASE_USER", required=True),
        "PASSWORD": get_env("DATABASE_PASSWORD", required=True),
        "HOST": get_env("DATABASE_HOST", required=True),
        "PORT": int(get_env("DATABASE_PORT", default="5432")),
    }
}

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field
DEFAULT_AUTO_FIELD = "django.db.models.AutoField"


# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"  # NOQA
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},  # NOQA
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},  # NOQA
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"  # NOQA
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/
TIME_ZONE = "Europe/Copenhagen"
LANGUAGE_CODE = "en"
SITE_ID = 1
USE_I18N = True
USE_TZ = True
LOCALE_PATHS = [os.path.join(BASE_DIR, "locale")]

# Multi-language support configuration
# Centralized language configuration for the backend
WAGTAIL_I18N_ENABLED = True
WAGTAIL_CONTENT_LANGUAGES = LANGUAGES = [
    ("en", "English"),
    ("ru", "Русский"),
]

# Email
DEFAULT_FROM_EMAIL = get_env("DEFAULT_FROM_EMAIL", default="noreply@example.com")

# Authentication and Django AllAuth Configuration
AUTH_USER_MODEL = "customuser.User"
LOGIN_REDIRECT_URL = "/"  # Redirect to account page after login

# Session settings
SESSION_COOKIE_AGE = 1209600  # 2 weeks in seconds
SESSION_COOKIE_HTTPONLY = True

# Django AllAuth settings
AUTHENTICATION_BACKENDS = [
    # Needed to login by username in Django admin, regardless of `allauth`
    "django.contrib.auth.backends.ModelBackend",
    # `allauth` specific authentication methods, such as login by e-mail
    "allauth.account.auth_backends.AuthenticationBackend",
]

# Provider specific settings
# SOCIALACCOUNT_PROVIDERS = {
#     'google': {
#         # For each OAuth based provider, either add a ``SocialApp``
#         # (``socialaccount`` app) containing the required client
#         # credentials, or list them here:
#         'APP': {
#             'client_id': '123',
#             'secret': '456',
#             'key': ''
#         }
#     }
# }


# Django AllAuth configuration
ACCOUNT_LOGIN_METHODS = {
    "email",
    "username",
}  # Allow login with either username or email
ACCOUNT_SIGNUP_FIELDS = [
    "email*",
    "username*",
    "password1*",
    "password2*",
]  # Required fields during signup
ACCOUNT_EMAIL_VERIFICATION = "none"
ACCOUNT_LOGOUT_ON_PASSWORD_CHANGE = False
ACCOUNT_LOGIN_BY_CODE_ENABLED = True
ACCOUNT_EMAIL_VERIFICATION_BY_CODE_ENABLED = False
ACCOUNT_LOGOUT_ON_GET = False  # POST request required for logout for CSRF protection
ACCOUNT_PRESERVE_USERNAME_CASING = False  # Treat usernames as case insensitive

# Wagtail
WAGTAIL_SITE_NAME = "LearningApp"
WAGTAILIMAGES_IMAGE_MODEL = "customimage.CustomImage"
WAGTAILDOCS_DOCUMENT_MODEL = "customdocument.CustomDocument"
WAGTAIL_ALLOW_UNICODE_SLUGS = False

WAGTAILSEARCH_BACKENDS = {
    "default": {
        "BACKEND": "wagtail.search.backends.database",
    }
}

WAGTAILIMAGES_FORMAT_CONVERSIONS = {
    "png": "jpeg",
    "webp": "webp",
}

# Uploaded media
MEDIA_URL = "/wt/media/"
MEDIA_ROOT = get_env("MEDIA_PATH", required=True)


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

# Static URL to use when referring to static files located in STATIC_ROOT.
STATIC_URL = "/wt/static/"

# The absolute path to the directory where collectstatic will collect static
# files for deployment. Example: "/var/www/example.com/static/"I
STATIC_ROOT = get_env("STATIC_PATH", required=True)

# This setting defines the additional locations the staticfiles will traverse
STATICFILES_DIRS = (
    # "/home/special.polls.com/polls/static",
    # "/home/polls.com/polls/static",
)

# Prevent content type sniffing
SECURE_CONTENT_TYPE_NOSNIFF = True

# Admin
ADMIN_URL = "wt/admin/"

# NextJS
WAGTAIL_HEADLESS_PREVIEW = {
    "CLIENT_URLS": {
        "default": "/api/preview/",
    }
}

# Sentry
SENTRY_DSN: Optional[str] = None
SENTRY_ENVIRONMENT: Optional[str] = None
