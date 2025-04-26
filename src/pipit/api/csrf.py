from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.http import require_GET


@require_GET
def get_csrf_token(request):
    """
    Returns a CSRF token for use in AJAX requests.
    This view forces Django to set the CSRF cookie with proper attributes.
    """
    # This will set the CSRF cookie
    token = get_token(request)

    # Create response with token
    response = JsonResponse({"csrfToken": token})

    # Explicitly set the cookie with minimal restrictions for development
    # This ensures the cookie will be accepted in most development environments
    response.set_cookie(
        "csrftoken",
        token,
        max_age=31536000,  # 1 year in seconds
        path="/",
        domain=None,  # Use None to accept any domain
        secure=False,  # Set to False for HTTP local development
        httponly=False,  # CSRF token needs to be accessible from JS
        samesite="Lax",  # Lax is more permissive than Strict
    )

    # Add CORS headers for local development
    response["Access-Control-Allow-Origin"] = "http://localhost:8081"
    response["Access-Control-Allow-Credentials"] = "true"

    return response
