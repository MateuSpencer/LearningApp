import { useState, useEffect, useCallback, useRef } from 'react';
import { useCSRFToken } from '../context/CSRFTokenContext';
import { httpGet, httpPost, httpPut, httpDelete } from '../utils/Http';

const API_BASE_URL = '/api/posts';

/**
 * Custom hook for managing posts with advanced filtering, sorting, and pagination
 * 
 * @param {Object} options Configuration options
 * @param {Object} options.fixedFilters Filters that won't change (e.g., page_slug for a specific page)
 * @param {Object} options.initialFilters Initial state of user-controllable filters
 * @param {string} options.initialSortBy Initial sort field
 * @param {string} options.initialSortDirection Initial sort direction ('asc' or 'desc')
 * @param {number} options.pageSize Number of items per page
 * @param {boolean} options.autoRefetch Whether to automatically refetch when filters change
 * @returns {Object} Post management methods and state
 */
export function usePosts({
  fixedFilters = {},
  initialFilters = {},
  initialSortBy = 'created_at',
  initialSortDirection = 'desc',
  pageSize = 10,
  autoRefetch = true
} = {}) {
  // State for posts, pagination, and request status
  const [posts, setPosts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // State for filters and sorting
  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortDirection, setSortDirection] = useState(initialSortDirection);
  
  // Use the CSRF token from context for authenticated requests
  const { token: csrfToken, loading: tokenLoading, error: tokenError } = useCSRFToken();
  
  // Cache previous results to avoid unnecessary refetches
  const cacheRef = useRef({});
  
  // Build the query params string for the API request
  const buildQueryString = useCallback(() => {
    const queryParams = new URLSearchParams();
    
    // Add fixed filters (these don't change during component lifecycle)
    Object.entries(fixedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    // Add user-controlled filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    // Add pagination params
    queryParams.append('page', currentPage);
    queryParams.append('page_size', pageSize);
    
    // Add sorting params
    const orderingValue = (sortDirection === 'desc' ? '-' : '') + sortBy;
    queryParams.append('ordering', orderingValue);
    
    return queryParams.toString();
  }, [fixedFilters, filters, currentPage, pageSize, sortBy, sortDirection]);
  
  // Main fetch function
  const fetchPosts = useCallback(async (options = {}) => {
    const { force = false } = options;
    
    try {
      setError(null);
      
      // Build the query string
      const queryString = buildQueryString();
      const url = `${API_BASE_URL}/?${queryString}`;
      
      // Check cache if not forcing a refresh
      if (!force && cacheRef.current[url]) {
        setPosts(cacheRef.current[url].results);
        setTotalCount(cacheRef.current[url].count);
        return;
      }
      
      setLoading(true);
      
      const response = await httpGet(url);
      
      // Update state with the fetched data
      setPosts(response.results || []);
      setTotalCount(response.count || 0);
      
      // Update cache
      cacheRef.current[url] = {
        results: response.results || [],
        count: response.count || 0,
        timestamp: Date.now()
      };
    } catch (err) {
      setError(err.message || 'Failed to fetch posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);
  
  // Create a new post
  const createPost = useCallback(async (postData) => {
    if (!csrfToken) {
      throw new Error('CSRF token not available. Please try again later.');
    }
    
    try {
      setLoading(true);
      const newPost = await httpPost(API_BASE_URL + '/', postData, csrfToken);
      
      // Invalidate cache for current query
      const queryString = buildQueryString();
      delete cacheRef.current[`${API_BASE_URL}/?${queryString}`];
      
      // Update local posts array (optimistic update)
      setPosts(prevPosts => [newPost, ...prevPosts]);
      setTotalCount(prev => prev + 1);
      
      return newPost;
    } catch (err) {
      setError(err.message || 'Failed to create post');
      console.error('Error creating post:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [csrfToken, buildQueryString]);
  
  // Update an existing post
  const updatePost = useCallback(async (id, postData) => {
    if (!csrfToken) {
      throw new Error('CSRF token not available. Please try again later.');
    }
    
    try {
      setLoading(true);
      const updatedPost = await httpPut(`${API_BASE_URL}/${id}/`, postData, csrfToken);
      
      // Invalidate cache for current query
      const queryString = buildQueryString();
      delete cacheRef.current[`${API_BASE_URL}/?${queryString}`];
      
      // Update local posts array (optimistic update)
      setPosts(prevPosts => 
        prevPosts.map(post => post.id === id ? updatedPost : post)
      );
      
      return updatedPost;
    } catch (err) {
      setError(err.message || `Failed to update post: ${id}`);
      console.error(`Error updating post: ${id}`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [csrfToken, buildQueryString]);
  
  // Delete a post
  const deletePost = useCallback(async (id) => {
    if (!csrfToken) {
      throw new Error('CSRF token not available. Please try again later.');
    }
    
    try {
      setLoading(true);
      await httpDelete(`${API_BASE_URL}/${id}/`, csrfToken);
      
      // Invalidate cache for current query
      const queryString = buildQueryString();
      delete cacheRef.current[`${API_BASE_URL}/?${queryString}`];
      
      // Update local posts array (optimistic update)
      setPosts(prevPosts => prevPosts.filter(post => post.id !== id));
      setTotalCount(prev => prev - 1);
      
      return true;
    } catch (err) {
      setError(err.message || `Failed to delete post: ${id}`);
      console.error(`Error deleting post: ${id}`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [csrfToken, buildQueryString]);
  
  // Update a specific filter
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    // Reset to first page when filters change
    setCurrentPage(1);
  }, []);
  
  // Update multiple filters at once
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    // Reset to first page when filters change
    setCurrentPage(1);
  }, []);
  
  // Clear all filters (but keep fixed filters)
  const clearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);
  
  // Update sorting
  const updateSort = useCallback((newSortBy, newSortDirection = 'desc') => {
    setSortBy(newSortBy);
    setSortDirection(newSortDirection);
    // Reset to first page when sorting changes
    setCurrentPage(1);
  }, []);
  
  // Go to a specific page
  const goToPage = useCallback((page) => {
    setCurrentPage(page);
  }, []);
  
  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);
  
  // Fetch posts when deps change
  useEffect(() => {
    if (autoRefetch) {
      fetchPosts();
    }
  }, [fetchPosts, autoRefetch]);
  
  // Clear specific cache entries older than 5 minutes
  useEffect(() => {
    const now = Date.now();
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    
    Object.keys(cacheRef.current).forEach(key => {
      if (now - cacheRef.current[key].timestamp > CACHE_TTL) {
        delete cacheRef.current[key];
      }
    });
  }, [fetchPosts]);
  
  return {
    // Data
    posts,
    totalCount,
    currentPage,
    totalPages,
    pageSize,
    filters,
    sortBy,
    sortDirection,
    
    // Status
    loading: loading || tokenLoading,
    error: error || tokenError,
    
    // Methods
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
    updateFilter,
    updateFilters,
    clearFilters,
    updateSort,
    goToPage,
  };
}

export default usePosts;