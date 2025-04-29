from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def auth_status(request):
    """
    Returns the authentication status of the current user.
    This endpoint can be called by the frontend to check if the user is authenticated.
    """
    is_authenticated = request.user.is_authenticated
    data = {
        "isAuthenticated": is_authenticated,
    }

    if is_authenticated:
        data["username"] = request.user.username

    return Response(data)
