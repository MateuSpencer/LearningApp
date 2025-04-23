from django.urls import path
from . import views

urlpatterns = [
    path("csrf-token/", views.GetCSRFToken.as_view(), name="csrf_token"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("register/", views.RegisterView.as_view(), name="register"),
    path("user/", views.UserView.as_view(), name="user_info"),
    path(
        "change-password/", views.ChangePasswordView.as_view(), name="change_password"
    ),
]
