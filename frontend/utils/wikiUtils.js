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
 * Retrieves the Wikipedia article summary and checks if it's a disambiguation page.
 * Returns an object with summary data, disambiguation status, and error info.
 * 
 * @param {string} slug The article slug to check
 * @returns {Promise<Object>} An object like { summaryData: Object|null, isDisambiguation: boolean, error: string|null }
 */
export const fetchWikipediaArticle = async (slug) => {
  if (!slug) return { summaryData: null, isDisambiguation: false, error: 'Slug is required' };

  const formattedSlug = formatWikiSlug(slug);
  let summaryData = null;
  let isDisambiguation = false;
  let error = null;

  try {
    // 1. Fetch summary
    const summaryResponse = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(formattedSlug)}`
    );

    if (!summaryResponse.ok) {
      if (summaryResponse.status === 404) {
        error = 'Article not found';
      } else {
        error = `Error fetching summary: ${summaryResponse.statusText}`;
      }
      return { summaryData: null, isDisambiguation: false, error };
    }
    summaryData = await summaryResponse.json();

    // 2. Fetch categories to check for disambiguation
    // Ensure a different user-agent or API key if making many requests, as per Wikipedia API etiquette.
    // Using origin=* for typical browser-based client-side requests.
    const categoriesResponse = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&prop=categories&titles=${encodeURIComponent(formattedSlug)}&format=json&origin=*&cllimit=max`
    );

    if (!categoriesResponse.ok) {
      console.warn(`Could not fetch categories for ${formattedSlug}: ${categoriesResponse.statusText}`);
      // Proceed with summary data, but cannot confirm disambiguation status via categories
      return { summaryData, isDisambiguation: false, error: 'Could not fetch categories' };
    }

    const categoriesData = await categoriesResponse.json();
    const pages = categoriesData.query?.pages;
    if (pages) {
      const pageId = Object.keys(pages)[0];
      const page = pages[pageId];
      if (page && page.categories) {
        const disambiguationCategories = [
          "Category:All disambiguation pages",
          "Category:Disambiguation pages",
          "Category:All article disambiguation pages", // Added based on your previous finding
          "Category:Redirects from ambiguous terms",
          "Category:Redirects from other capitalisations",
          "Category:Unprintworthy redirects",
          // Add other known disambiguation category titles if necessary
        ];
        isDisambiguation = page.categories.some(cat => disambiguationCategories.includes(cat.title));
      }
    }
  } catch (err) {
    console.error('Error in fetchWikipediaArticle:', err);
    error = err.message || 'An unexpected error occurred';
    // If summary was fetched before error, return it, otherwise null
    return { summaryData, isDisambiguation: false, error };
  }

  return { summaryData, isDisambiguation, error };
};
