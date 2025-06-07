import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext'; // Import useLanguage

// Define DISAMBIGUATION_CATEGORIES outside the hook to ensure stable reference
const DISAMBIGUATION_CATEGORIES = [
  "Category:All disambiguation pages",
  "Category:Disambiguation pages",
  "Category:All article disambiguation pages",
  "Category:Redirects from ambiguous terms",
  "Category:Redirects from other capitalisations",
  "Category:Unprintworthy redirects",
];

/**
 * Custom hook to handle wiki search operations and results
 */
const useWikiSearch = (initialQuery = '') => {
  const { language } = useLanguage(); // Get language from context
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false); // Added notFound state
  
  // For debouncing search requests
  const searchDebounceRef = useRef(null);

  /**
   * Checks if a Wikipedia page is a disambiguation page based on its categories.
   * @param {string} title The title of the Wikipedia page.
   * @returns {Promise<boolean>} True if it's a disambiguation page, false otherwise.
   */
  const isDisambiguationPage = useCallback(async (title) => {
    try {
      const response = await fetch(
        `https://${language}.wikipedia.org/w/api.php?action=query&prop=categories&titles=${encodeURIComponent(title)}&format=json&origin=*&cllimit=max` // Use language in API URL
      );
      if (!response.ok) {
        console.warn(`Could not fetch categories for ${title}: ${response.statusText}`);
        return false; // Assume not disambiguation if categories can't be fetched
      }
      const data = await response.json();
      const pages = data.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];
        if (page && page.categories) {
          return page.categories.some(cat => DISAMBIGUATION_CATEGORIES.includes(cat.title));
        }
      }
      return false;
    } catch (err) {
      console.error(`Error checking disambiguation status for ${title}:`, err);
      return false; // Assume not disambiguation on error
    }
  }, [language]); // Add language to dependency array

  /**
   * Search for wiki articles using Wikipedia API
   */
  const searchWiki = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResults([]);
      setNotFound(false); // Reset notFound
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setNotFound(false); // Reset notFound
      
      // Use Wikipedia API for search results
      // Use srlimit=10 to limit results and avoid oversized lists with scrolling
      // Add srlang=${language} to filter by language
      const response = await fetch(
        `https://${language}.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(searchTerm)}&srlimit=10&origin=*&srlang=${language}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch wiki search results');
      }
      
      const data = await response.json();
      
      if (data.query && data.query.search && data.query.search.length > 0) {
        const initialResults = data.query.search.map(item => ({
          id: item.pageid,
          title: item.title,
          slug: item.title.replace(/\s+/g, '_'),
          snippet: item.snippet,
          timestamp: item.timestamp
        }));

        // Filter out disambiguation pages
        const filteredResults = [];
        for (const item of initialResults) {
          // No need to pass language here, isDisambiguationPage uses it from context
          const isDisambig = await isDisambiguationPage(item.title);
          if (!isDisambig) {
            filteredResults.push(item);
          }
        }

        if (filteredResults.length > 0) {
          setResults(filteredResults);
        } else {
          setResults([]);
          setNotFound(true); // Set notFound if all results were disambiguation pages or no non-disambig results
        }
      } else {
        setResults([]);
        setNotFound(true); // Set notFound if search array is empty
      }
    } catch (err) {
      console.error('Error searching wiki:', err);
      setError('An error occurred while searching. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [isDisambiguationPage, language]); // Add language to dependency array
  
  // Debounced search when query changes
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    if (query) {
      searchDebounceRef.current = setTimeout(() => {
        searchWiki(query);
      }, 500); // 500ms debounce
    } else {
      setResults([]);
    }
    
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [query, searchWiki]);
  
  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setNotFound(false); // Reset notFound
  }, []);
  
  return {
    query,
    setQuery,
    results,
    loading,
    error,
    notFound, // Expose notFound
    clearSearch
  };
};

export default useWikiSearch;
