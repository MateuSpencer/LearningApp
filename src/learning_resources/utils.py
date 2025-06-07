"""
Utility functions for the learning_resources app
"""

import re
import requests
import json
from urllib.parse import urlparse, parse_qs
from requests.exceptions import RequestException
from typing import Dict, Tuple, Optional, Any


def extract_youtube_video_id(url: str) -> Optional[str]:
    """
    Extract YouTube video ID from various YouTube URL formats.
    Returns None if the URL is not a YouTube URL or if the video ID cannot be extracted.

    This function also removes any query parameters after the video ID such as
    ?si=8A8OKD2YHSv5PWxC which are not needed for video identification.
    """
    # Common YouTube URL patterns
    # 1. https://www.youtube.com/watch?v=VIDEO_ID
    # 2. https://youtu.be/VIDEO_ID
    # 3. https://youtube.com/watch?v=VIDEO_ID
    # 4. https://www.youtube.com/embed/VIDEO_ID

    # Parse the URL to get components
    parsed_url = urlparse(url)

    # Check if it's a YouTube domain
    if not any(domain in parsed_url.netloc for domain in ["youtube.com", "youtu.be"]):
        return None

    # Case 1 & 3: youtube.com/watch?v=VIDEO_ID
    if "youtube.com" in parsed_url.netloc and parsed_url.path == "/watch":
        query_params = parse_qs(parsed_url.query)
        if "v" in query_params:
            # Extract just the video ID, discarding any additional parameters
            video_id = query_params["v"][0]
            # Ensure we only return the 11-character video ID
            return video_id.split("&")[0][:11]

    # Case 2: youtu.be/VIDEO_ID
    elif "youtu.be" in parsed_url.netloc:
        # The path will be like '/VIDEO_ID', so remove the leading '/'
        # Also remove any query parameters
        path = parsed_url.path[1:]
        video_id = path.split("?")[0]
        return video_id[:11]  # Ensure only 11 chars for video ID

    # Case 4: youtube.com/embed/VIDEO_ID
    elif "youtube.com" in parsed_url.netloc and "/embed/" in parsed_url.path:
        # The path will be like '/embed/VIDEO_ID'
        path = parsed_url.path.split("/embed/")[1]
        video_id = path.split("?")[0]
        return video_id[:11]  # Ensure only 11 chars for video ID

    return None


def normalize_url(url: str) -> Tuple[str, bool, str]:
    """
    Normalize a URL for consistent storage and comparison:
    - For YouTube URLs, extract the video ID and convert to canonical form
    - For other URLs, normalize to a consistent format

    Returns:
    - normalized_url: The processed URL
    - is_modified: True if the URL was modified during normalization
    - url_type: 'youtube' or 'other'
    """
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    # Check if it's a YouTube URL
    video_id = extract_youtube_video_id(url)
    if video_id:
        original_url = url
        # Convert to canonical YouTube form
        normalized_url = f"https://www.youtube.com/watch?v={video_id}"
        return normalized_url, normalized_url != original_url, "youtube"

    # For non-YouTube URLs, ensure consistency
    parsed = urlparse(url)
    normalized_host = parsed.netloc.lower()

    # Remove 'www.' prefix for consistency in comparison
    if normalized_host.startswith("www."):
        normalized_host = normalized_host[4:]

    # Rebuild the URL
    scheme = "https"  # Default to https
    path = parsed.path.rstrip("/")
    if not path:
        path = "/"

    # Include query parameters for consistency when comparing
    query = parsed.query
    query_string = f"?{query}" if query else ""

    # Rebuild with query parameters for full comparison
    normalized_url = f"{scheme}://{normalized_host}{path}{query_string}"

    # Check if the URL was modified
    is_modified = normalized_url != url

    return normalized_url, is_modified, "other"


def check_url_availability(url: str) -> Dict:
    """
    Check if a URL is available via HTTPS or HTTP.

    Returns a dict with:
    - status: 'success' or 'error'
    - url: The recommended URL to use
    - message: Info message
    - status_code: HTTP status code (if available)
    """
    result = {"status": "error", "url": url, "message": "", "status_code": None}

    # First try HTTPS if the URL doesn't already specify it
    https_url = url
    if not url.startswith("https://"):
        https_url = "https://" + url.split("://")[-1]

    try:
        response = requests.head(https_url, timeout=5, allow_redirects=True)
        if response.status_code < 400:
            result["status"] = "success"
            result["url"] = https_url
            result["message"] = f"URL is available via HTTPS"
            result["status_code"] = response.status_code
            return result
        else:
            # HTTPS failed, try HTTP if it's not a YouTube URL
            # YouTube always requires HTTPS
            if "youtube.com" in url or "youtu.be" in url:
                result["message"] = (
                    f"YouTube URL returned status code {response.status_code}. YouTube requires HTTPS."
                )
                result["status_code"] = response.status_code
                return result
    except RequestException as e:
        # HTTPS failed, try HTTP if it's not already HTTP
        if "youtube.com" in url or "youtu.be" in url:
            result["message"] = (
                f"Error accessing YouTube URL: {str(e)}. YouTube requires HTTPS."
            )
            return result

    # Try HTTP as a fallback for non-YouTube URLs
    if not url.startswith("http://"):
        http_url = "http://" + url.split("://")[-1]

        try:
            response = requests.head(http_url, timeout=5, allow_redirects=True)
            if response.status_code < 400:
                result["status"] = "success"
                result["url"] = http_url
                result["message"] = (
                    f"URL is only available via HTTP, not HTTPS. Consider using HTTPS if possible."
                )
                result["status_code"] = response.status_code
                return result
            else:
                result["message"] = (
                    f"URL is not available via HTTP or HTTPS (status code: {response.status_code})"
                )
                result["status_code"] = response.status_code
        except RequestException as e:
            result["message"] = f"URL is not available: {str(e)}"

    return result


def validate_url(url: str) -> Dict:
    """
    Complete URL validation:
    1. Normalize the URL
    2. Check if it's available
    3. For YouTube, ensure proper format

    Returns a dict with validation results
    """
    # Basic URL validation
    if not url:
        return {
            "status": "error",
            "original_url": url,
            "normalized_url": "",
            "message": "URL is empty",
            "url_type": "unknown",
            "exists": False,
            "modified": False,
        }

    # Add protocol if missing
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    # Normalize the URL
    normalized_url, is_modified, url_type = normalize_url(url)

    # Check availability
    availability = check_url_availability(normalized_url)

    # Prepare the response
    result = {
        "status": availability["status"],
        "original_url": url,
        "normalized_url": normalized_url,
        "recommended_url": availability["url"],
        "message": availability["message"],
        "url_type": url_type,
        "exists": availability["status"] == "success",
        "modified": is_modified,
    }

    # Add YouTube-specific information
    if url_type == "youtube":
        video_id = extract_youtube_video_id(url)
        result["youtube_video_id"] = video_id

        # Add YouTube-specific validation messages
        if is_modified:
            result["message"] = (
                f"YouTube URL has been normalized: removed query parameters after video ID ({video_id})"
            )

    return result


def get_youtube_video_metadata(video_id: str) -> Dict[str, Any]:
    """
    Fetch metadata for a YouTube video using the OEmbed API.

    Args:
        video_id: The YouTube video ID

    Returns:
        Dict containing metadata like title, author_name, etc.
    """
    if not video_id or len(video_id) != 11:
        return {
            "status": "error",
            "message": "Invalid YouTube video ID format",
            "title": "",
            "author": "",
            "provider": "YouTube",
            "thumbnail": "",
        }

    try:
        # Use the oEmbed API to get video information
        url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        response = requests.get(url, timeout=5)

        if response.status_code == 200:
            data = response.json()
            return {
                "title": data.get("title", ""),
                "author": data.get("author_name", ""),
                "provider": data.get("provider_name", "YouTube"),
                "thumbnail": data.get("thumbnail_url", ""),
            }
        elif response.status_code == 404:
            # YouTube returns 404 when video doesn't exist
            return {
                "status": "error",
                "message": "Video not found. It may be private, removed, or does not exist.",
                "title": "",
                "author": "",
                "provider": "YouTube",
                "thumbnail": "",
            }
        else:
            # Other error response
            return {
                "status": "error",
                "message": f"YouTube API error (status code: {response.status_code})",
                "title": "",
                "author": "",
                "provider": "YouTube",
                "thumbnail": "",
            }
    except Exception as e:
        # If there's any error, return error info
        return {
            "status": "error",
            "message": f"Error fetching YouTube metadata: {str(e)}",
            "title": "",
            "author": "",
            "provider": "YouTube",
            "thumbnail": "",
        }

    return {}
