
/**
 * Formats a string into a Wikipedia-compatible slug while preserving case and special characters
 * 
 * Wikipedia URLs are case-sensitive, so we need to preserve the case
 * while replacing spaces with underscores. Also preserves special characters
 * without encoding them to ensure consistent URL formatting.
 * 
 * @param {string} text The text to format into a slug
 * @returns {string} The formatted slug with preserved case and special characters
 */
export const formatWikiSlug = (text) => {
  if (!text) return '';
  
  // If the text is already URL-encoded, decode it first
  let decodedText = text;
  try {
    // Check if this text contains percent encoding
    if (text.includes('%')) {
      decodedText = decodeURIComponent(text);
    }
  } catch (e) {
    console.error('Error decoding text:', e);
  }
  
  // Replace spaces with underscores but preserve case and special characters
  return decodedText.replace(/\s+/g, '_');
};

/**
 * Retrieves the Wikipedia article using the REST API
 * Returns the response data if successful, or null if article doesn't exist
 * 
 * @param {string} slug The article slug to check
 * @returns {Promise<Object|null>} The article data or null if not found
 */
export const fetchWikipediaArticle = async (slug) => {
  if (!slug) return null;
  
  // Format the slug properly before calling the API
  const formattedSlug = formatWikiSlug(slug);
  
  try {
    // We only use encodeURIComponent for the API request, not for our internal URLs
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(formattedSlug)}`
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // Store the unencoded canonical title in the response for our usage
    if (data && data.title) {
      data.canonicalSlug = data.title.replace(/\s+/g, '_');
    }
    
    return data;
  } catch (err) {
    console.error('Error fetching Wikipedia article:', err);
    return null;
  }
};
