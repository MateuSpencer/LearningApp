from django.urls import path
from .csrf import get_csrf_token

urlpatterns = [
    path("csrf-token/", get_csrf_token, name="csrf_token"),
]
