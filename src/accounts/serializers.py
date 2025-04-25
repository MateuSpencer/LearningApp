from rest_framework import serializers
from django.contrib.auth import get_user_model
from allauth.account.adapter import get_adapter
from allauth.account.utils import setup_user_email

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "date_joined")
        read_only_fields = ("id", "date_joined")


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "first_name", "last_name")
        read_only_fields = ("id",)

    def validate_password(self, password):
        # Use allauth's adapter for password validation
        return get_adapter().clean_password(password)

    def validate_email(self, email):
        # Use allauth's adapter for email validation
        email = get_adapter().clean_email(email)

        # Check if email already exists
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError(
                "A user is already registered with this email address."
            )
        return email

    def validate_username(self, username):
        # Use allauth's adapter for username validation
        return get_adapter().clean_username(username)

    def create(self, validated_data):
        # Get a new user instance from allauth
        user = get_adapter().new_user(self.context.get("request"))

        # Set user attributes
        user.username = validated_data.get("username")
        user.email = validated_data.get("email")
        user.first_name = validated_data.get("first_name", "")
        user.last_name = validated_data.get("last_name", "")

        # Set password
        password = validated_data.get("password")
        user.set_password(password)

        # Save the user
        user.save()

        # Set up email addresses for allauth
        setup_user_email(self.context.get("request"), user, [])

        return user
