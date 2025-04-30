from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view
from rest_framework.response import Response


@ensure_csrf_cookie
@api_view(["GET"])
def auth_status(request):
    """
    Returns the authentication status of the current user.
    This endpoint can be called by the frontend to check if the user is authenticated.
    Also sets a CSRF cookie for subsequent authenticated requests and returns the token
    in the response body for JavaScript access.
    """
    # Get or create a CSRF token
    csrf_token = get_token(request)

    is_authenticated = request.user.is_authenticated
    data = {
        "isAuthenticated": is_authenticated,
        "csrfToken": csrf_token,  # Include the token in the response
    }

    if is_authenticated:
        data["username"] = request.user.username
        data["email"] = request.user.email

    return Response(data)
