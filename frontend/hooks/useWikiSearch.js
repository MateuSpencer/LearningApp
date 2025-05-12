import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to handle wiki search operations and results
 */
const useWikiSearch = (initialQuery = '') => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false); // Added notFound state
  
  // For debouncing search requests
  const searchDebounceRef = useRef(null);
  
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
      const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(searchTerm)}&srlimit=10&origin=*`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch wiki search results');
      }
      
      const data = await response.json();
      
      if (data.query && data.query.search && data.query.search.length > 0) { // Check if search array is not empty
        // Transform the results to include formatted title and snippet
        const formattedResults = data.query.search.map(item => ({
          id: item.pageid,
          title: item.title,
          // Preserve case for Wikipedia's case-sensitive URLs
          slug: item.title.replace(/\s+/g, '_'),
          snippet: item.snippet,
          // Add timestamp as timestamp or lastmodified based on what's available
          timestamp: item.timestamp
        }));
        
        setResults(formattedResults);
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
  }, []);
  
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
