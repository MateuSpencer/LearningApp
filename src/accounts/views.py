from django.contrib.auth import authenticate, login, logout
from django.middleware import csrf as csrf_middleware
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from rest_framework import status, views
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

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

        user = authenticate(request, username=username, password=password)

        if user is None:
            raise AuthenticationFailed("Invalid username or password")

        login(request, user)

        # Return the user data
        serializer = UserSerializer(user)
        return Response(serializer.data)


class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"detail": "Successfully logged out"})


class RegisterView(views.APIView):
    permission_classes = [AllowAny]

    @method_decorator(csrf_protect)
    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Log the user in after registration
            login(request, user)
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
        # Log the user out first
        logout(request)
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

        # Verify current password
        if not user.check_password(current_password):
            raise ValidationError("Current password is incorrect")

        # Validate new password (you can add more validation rules)
        if len(new_password) < 8:
            raise ValidationError("New password must be at least 8 characters long")

        # Set new password
        user.set_password(new_password)
        user.save()

        # Re-authenticate the user (since changing password logs them out)
        login(request, user)

        return Response(
            {"detail": "Password changed successfully"}, status=status.HTTP_200_OK
        )
