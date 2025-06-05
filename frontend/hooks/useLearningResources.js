import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import learningResources from '../api/learningResources';

const LOGIN_URL = '/accounts/login/';

/**
 * Custom hook for managing learning resources associated with a page
 * 
 * @param {Object} options Configuration options
 * @param {string} options.pageSlug The slug of the page to fetch resources for
 * @param {boolean} options.showAll Whether to show all resources (not filtered by page)
 * @param {Object} options.fixedFilters Filters that won't change (e.g., type for a specific resource type)
 * @param {Object} options.initialFilters Initial state of user-controllable filters
 * @param {string} options.initialSortBy Initial sort field
 * @param {string} options.initialSortDirection Initial sort direction ('asc' or 'desc')
 * @param {number} options.pageSize Number of items per page
 * @param {boolean} options.autoRefetch Whether to automatically refetch when options change
 * @returns {Object} Learning resource management methods and state
 */
export function useLearningResources({ 
  pageSlug = '', 
  showAll = false,
  fixedFilters = {},
  initialFilters = {},
  initialSortBy = 'quality_vote_sum',  // Updated to match backend field
  initialSortDirection = 'desc',
  pageSize = 10,
  autoRefetch = true 
} = {}) {
  // Router for navigation
  const router = useRouter();
  
  // Get authentication state from AuthContext
  const { isAuthenticated } = useAuth();
  
  // State for resources and request status
  const [resources, setResources] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  // State for filters and sorting
  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortDirection, setSortDirection] = useState(initialSortDirection);
  
  // Cache for previous results
  const cacheRef = useRef({});
  
  // Helper function to handle authentication errors
  const handleAuthError = (err) => {
    // Check if this is a 401 error (Unauthorized)
    if (err.response && err.response.status === 401) {
      // Redirect to login page
      router.push(LOGIN_URL);
      return new Error('Authentication required. Redirecting to login page...');
    }
    return err;
  };
  
  // Build the query params string for the API request
  const buildQueryString = useCallback(() => {
    const queryParams = new URLSearchParams();
    
    // Add page_slug parameter for wiki page context
    if (!showAll && pageSlug) {
      queryParams.append('page_slug', pageSlug);
    }
    
    // Add fixed filters (these don't change during component lifecycle)
    Object.entries(fixedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        queryParams.append(key, value);
      }
    });
    
    // Add user-controlled filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        // Map frontend filter names to backend field names if needed
        let backendKey = key;
        
        // Handle special filter mappings
        if (key === 'type') {
          backendKey = 'resource_type';
        } else if (key === 'difficulty') {
          backendKey = 'difficulty';
        } else if (key === 'search') {
          backendKey = 'search';
        }
        
        queryParams.append(backendKey, value);
      }
    });
    
    // Add pagination params
    queryParams.append('page', currentPage.toString());
    queryParams.append('page_size', pageSize.toString());
    
    // Add sorting params using Django's ordering format
    const orderingValue = (sortDirection === 'desc' ? '-' : '') + sortBy;
    queryParams.append('ordering', orderingValue);
    
    return queryParams.toString();
  }, [showAll, pageSlug, fixedFilters, filters, currentPage, pageSize, sortBy, sortDirection]);
  
  // Cache key for the current request - use consistent format for all contexts
  const getCacheKey = useCallback(() => {
    const queryString = buildQueryString();
    return `learning-resources-${queryString}`;
  }, [buildQueryString]);
  
  // Main fetch function
  const fetchResources = useCallback(async (options = {}) => {
    const { force = false } = options;
    
    // Skip if we need a page slug but don't have one (unless in showAll mode)
    if (!showAll && !pageSlug) {
      setResources([]);
      setTotalCount(0);
      return;
    }
    
    try {
      setError(null);
      
      const cacheKey = getCacheKey();
      
      // Check cache if not forcing a refresh
      if (!force && cacheRef.current[cacheKey]) {
        setResources(cacheRef.current[cacheKey].results);
        setTotalCount(cacheRef.current[cacheKey].count);
        return;
      }
      
      setLoading(true);
      
      // Always use the same endpoint for consistency
      // Build query string with all filters, sorting, and pagination
      const queryString = buildQueryString();
      const response = await learningResources.getAllResources(queryString);
      
      // Update state with the fetched data
      setResources(response.results || []);
      setTotalCount(response.count || 0);
      
      // Update cache
      cacheRef.current[cacheKey] = {
        results: response.results || [],
        count: response.count || 0,
        timestamp: Date.now()
      };
    } catch (err) {
      const enhancedError = handleAuthError(err);
      setError(enhancedError.message || 'Failed to fetch learning resources');
      console.error('Error fetching learning resources:', err);
    } finally {
      setLoading(false);
    }
  }, [showAll, pageSlug, getCacheKey, buildQueryString, handleAuthError]);
  
  // Create new association
  const createAssociation = useCallback(async (resourceId) => {
    if (!isAuthenticated) {
      router.push(LOGIN_URL);
      throw new Error('You must be logged in to add resources to a page.');
    }
    
    try {
      setLoading(true);
      const newAssociation = await learningResources.createAssociation(resourceId, pageSlug);
      
      // Invalidate cache
      delete cacheRef.current[getCacheKey()];
      
      // Refetch to get updated list
      await fetchResources({ force: true });
      
      return newAssociation;
    } catch (err) {
      const enhancedError = handleAuthError(err);
      setError(enhancedError.message || 'Failed to add resource to page');
      console.error('Error creating resource association:', err);
      throw enhancedError;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, pageSlug, getCacheKey, fetchResources, router]);
  
  // Upvote an association
  const upvoteAssociation = useCallback(async (associationId) => {
    if (!isAuthenticated) {
      router.push(LOGIN_URL);
      throw new Error('You must be logged in to vote on a resource.');
    }
    
    try {
      setLoading(true);
      await learningResources.upvoteAssociation(associationId);
      
      // Invalidate cache
      delete cacheRef.current[getCacheKey()];
      
      // Refetch to get updated list with new scores
      await fetchResources({ force: true });
    } catch (err) {
      const enhancedError = handleAuthError(err);
      setError(enhancedError.message || `Failed to upvote resource: ${associationId}`);
      console.error(`Error upvoting resource association: ${associationId}`, err);
      throw enhancedError;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getCacheKey, fetchResources, router]);
  
  // Downvote an association
  const downvoteAssociation = useCallback(async (associationId) => {
    if (!isAuthenticated) {
      router.push(LOGIN_URL);
      throw new Error('You must be logged in to vote on a resource.');
    }
    
    try {
      setLoading(true);
      await learningResources.downvoteAssociation(associationId);
      
      // Invalidate cache
      delete cacheRef.current[getCacheKey()];
      
      // Refetch to get updated list with new scores
      await fetchResources({ force: true });
    } catch (err) {
      const enhancedError = handleAuthError(err);
      setError(enhancedError.message || `Failed to downvote resource: ${associationId}`);
      console.error(`Error downvoting resource association: ${associationId}`, err);
      throw enhancedError;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getCacheKey, fetchResources, router]);

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
  
  // Track previous dependencies to detect changes
  const prevDepsRef = useRef({
    pageSlug: null,
    showAll: false,
    filters: {},
    currentPage: 1,
    sortBy: null,
    sortDirection: null
  });

  // Fetch resources when dependencies change  
  useEffect(() => {
    if (autoRefetch) {
      const prevDeps = prevDepsRef.current;
      const hasChanged = 
        prevDeps.pageSlug !== pageSlug ||
        prevDeps.showAll !== showAll ||
        JSON.stringify(prevDeps.filters) !== JSON.stringify(filters) ||
        prevDeps.currentPage !== currentPage ||
        prevDeps.sortBy !== sortBy ||
        prevDeps.sortDirection !== sortDirection;

      if (hasChanged) {
        fetchResources({ force: true });
      }

      // Update previous dependencies
      prevDepsRef.current = {
        pageSlug,
        showAll,
        filters: { ...filters },
        currentPage,
        sortBy,
        sortDirection
      };
    }
  }, [fetchResources, autoRefetch, pageSlug, showAll, filters, currentPage, sortBy, sortDirection]);
  
  // Clear specific cache entries older than 5 minutes
  useEffect(() => {
    const now = Date.now();
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    
    Object.keys(cacheRef.current).forEach(key => {
      if (now - cacheRef.current[key].timestamp > CACHE_TTL) {
        delete cacheRef.current[key];
      }
    });
  }, []);
  
  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    // Data
    resources,
    totalCount,
    currentPage,
    totalPages,
    pageSize,
    filters,
    sortBy,
    sortDirection,
    
    // Auth state
    isAuthenticated,
    
    // Status
    loading,
    error,
    
    // Methods
    fetchResources,
    createAssociation,
    upvoteAssociation,
    downvoteAssociation,
    updateFilter,
    updateFilters,
    clearFilters,
    updateSort,
    goToPage,
  };
}

export default useLearningResources;