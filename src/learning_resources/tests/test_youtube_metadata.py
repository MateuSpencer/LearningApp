#!/usr/bin/env python
# Test file for YouTube metadata fetching
# Run this script directly to test the YouTube metadata fetching functionality

import sys
import os
import json
import requests
from urllib.parse import urlparse, parse_qs


# Function to extract YouTube video ID from a URL
def extract_youtube_video_id(url):
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


# Function to get YouTube video metadata
def get_youtube_video_metadata(video_id):
    """
    Fetch metadata for a YouTube video using the OEmbed API.

    Args:
        video_id: The YouTube video ID

    Returns:
        Dict containing metadata like title, author_name, etc.
    """
    if not video_id:
        return {}

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
    except Exception as e:
        # If there's any error, print it out
        print(f"Error fetching YouTube metadata: {e}")
        return {}

    return {}


# Main test function
def test_youtube_metadata(url=None):
    if not url:
        # Use a default URL for testing
        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

    print(f"Testing URL: {url}")

    # Extract video ID
    video_id = extract_youtube_video_id(url)
    if not video_id:
        print("Error: Could not extract video ID from URL")
        return

    print(f"Extracted video ID: {video_id}")

    # Fetch metadata
    metadata = get_youtube_video_metadata(video_id)

    # Print results
    print("\nMetadata Results:")
    print(json.dumps(metadata, indent=2))

    # Validate results
    if not metadata:
        print("\nFailed to fetch metadata!")
    elif "title" in metadata and metadata["title"]:
        print(f"\nSuccess! Video title: {metadata['title']}")
    else:
        print("\nMetadata returned but title is missing or empty")


if __name__ == "__main__":
    # Check if a URL was provided as a command-line argument
    if len(sys.argv) > 1:
        test_youtube_metadata(sys.argv[1])
    else:
        # Run test with default URL
        test_youtube_metadata()

        # Also try a few other URL formats
        test_youtube_metadata("https://youtu.be/dQw4w9WgXcQ")
        test_youtube_metadata("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s")
