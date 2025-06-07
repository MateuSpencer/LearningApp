// A simple test file to validate a YouTube URL and auto-populate metadata
// Save this file in a temporary location and execute in the browser console
// or run it with Node.js if you have the environment set up

// Mock function to simulate the validateUrl API call
async function mockValidateUrl(url) {
  console.log(`Validating URL: ${url}`);
  
  // Simulate API response for a YouTube URL
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    // Extract video ID - simplified version for testing
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('youtube.com/watch?v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }
    
    console.log(`Extracted YouTube video ID: ${videoId}`);
    
    // Mock response
    return {
      status: 'success',
      original_url: url,
      normalized_url: `https://www.youtube.com/watch?v=${videoId}`,
      recommended_url: `https://www.youtube.com/watch?v=${videoId}`,
      message: 'YouTube URL has been normalized',
      url_type: 'youtube',
      exists: true,
      modified: true,
      youtube_video_id: videoId,
      metadata: {
        title: `Test YouTube Video Title for ID: ${videoId}`,
        author: 'Test Author',
        provider: 'YouTube',
        thumbnail: `https://img.youtube.com/vi/${videoId}/default.jpg`
      }
    };
  }
  
  // For non-YouTube URLs
  return {
    status: 'success',
    original_url: url,
    normalized_url: url.startsWith('http') ? url : `https://${url}`,
    recommended_url: url.startsWith('http') ? url : `https://${url}`,
    message: 'URL is valid',
    url_type: 'other',
    exists: true,
    modified: !url.startsWith('http')
  };
}

// Function to test YouTube URL validation and auto-population
async function testYouTubeUrlValidation() {
  const testUrls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
    'https://example.com' // Non-YouTube URL for comparison
  ];
  
  console.log('Starting YouTube URL validation test...\n');
  
  for (const url of testUrls) {
    console.log(`\nTesting URL: ${url}`);
    
    try {
      // Simulate the validation request
      const result = await mockValidateUrl(url);
      
      console.log('Validation result:', result);
      
      // Simulate form state update
      if (result.status === 'success') {
        console.log('URL validation successful');
        
        if (result.url_type === 'youtube') {
          console.log('Resource type set to: youtube');
          
          if (result.metadata && result.metadata.title) {
            console.log(`Title auto-populated with: "${result.metadata.title}"`);
          } else {
            console.log('No title metadata available');
          }
        } else {
          console.log(`Resource type remains: website (not a YouTube URL)`);
        }
      } else {
        console.log(`URL validation failed: ${result.message}`);
      }
    } catch (err) {
      console.error('Error during validation:', err);
    }
    
    console.log('-'.repeat(50));
  }
  
  console.log('\nYouTube URL validation test completed');
}

// Run the test
testYouTubeUrlValidation();
