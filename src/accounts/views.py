from django.conf import settings
from django.contrib.auth import login, logout
from django.middleware import csrf as csrf_middleware
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from rest_framework import status, views
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from allauth.account.models import EmailAddress
from allauth.account import app_settings as allauth_settings
from allauth.account.utils import perform_login, complete_signup, user_username
from allauth.account.adapter import get_adapter

from .serializers import UserSerializer, RegistrationSerializer


class GetCSRFToken(views.APIView):
    permission_classes = [AllowAny]

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        return Response({"csrfToken": csrf_middleware.get_token(request)})


class LoginView(views.APIView):
    permission_classes = [AllowAny]

    @method_decorator(csrf_protect)
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            raise AuthenticationFailed("Please provide both username and password")

        # Get the adapter to authenticate the user
        user = get_adapter().authenticate(request, username=username, password=password)

        if user is None:
            raise AuthenticationFailed("Invalid username or password")

        # Log the user in using allauth's perform_login
        perform_login(
            request, user, email_verification=allauth_settings.EMAIL_VERIFICATION
        )

        # Return the user data
        serializer = UserSerializer(user)
        return Response(serializer.data)


class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Use the adapter's logout method
        get_adapter().logout(request)
        return Response({"detail": "Successfully logged out"})


class RegisterView(views.APIView):
    permission_classes = [AllowAny]

    @method_decorator(csrf_protect)
    def post(self, request):
        # Pass the request to the serializer context
        serializer = RegistrationSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            # Use the serializer to create the user
            user = serializer.save()

            # Complete the signup process with allauth
            # This handles email verification based on settings
            complete_signup(
                request,
                user,
                allauth_settings.EMAIL_VERIFICATION,
                settings.LOGIN_REDIRECT_URL,
            )

            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    @method_decorator(csrf_protect)
    def delete(self, request):
        user = request.user
        # Log the user out first using allauth's logout
        get_adapter().logout(request)
        # Then delete the user
        user.delete()
        return Response(
            {"detail": "Your account has been successfully deleted."},
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(views.APIView):
    permission_classes = [IsAuthenticated]

    @method_decorator(csrf_protect)
    def post(self, request):
        user = request.user
        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")

        # Validate input
        if not current_password or not new_password:
            raise ValidationError("Both current password and new password are required")

        # Get the adapter for password management
        adapter = get_adapter()

        # Verify current password using allauth's adapter
        if not adapter.check_password(user, current_password):
            raise ValidationError("Current password is incorrect")

        # Validate new password using allauth's adapter
        try:
            adapter.clean_password(new_password, user=user)
        except ValidationError as e:
            raise ValidationError(str(e))

        # Set new password using allauth's adapter
        adapter.set_password(user, new_password)

        # Re-authenticate the user with allauth
        perform_login(
            request, user, email_verification=allauth_settings.EMAIL_VERIFICATION
        )

        return Response(
            {"detail": "Password changed successfully"}, status=status.HTTP_200_OK
        )
