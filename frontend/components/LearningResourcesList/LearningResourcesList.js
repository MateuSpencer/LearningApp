import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import useLearningResources from '../../hooks/useLearningResources';
import LearningResourceItem from '../LearningResourceItem/LearningResourceItem';
import NewLearningResourceForm from '../NewLearningResourceForm/NewLearningResourceForm';
import { LearningResourcesFilter, LearningResourcesSort, LearningResourcesPagination } from '../LearningResourcesControls';
import AIResourceFinderButton from '../AIResourceFinderButton/AIResourceFinderButton';
import AIResourcesDisplay from '../AIResourcesDisplay/AIResourcesDisplay';
import { getPersistentSuggestionsForPage, addSuggestionToResources, deletePersistentSuggestion } from '../../api/aiResources';
import s from './LearningResourcesList.module.css';

/**
 * LearningResourcesList component - displays a list of learning resources with filtering, sorting, and pagination
 * 
 * @param {Object} props Component props
 * @param {string} props.pageSlug Filter resources by this page slug (for wiki pages)
 * @param {boolean} props.showAll Show all resources, not filtered by page
 * @param {Function} props.onAddResource Callback for adding a new resource
 * @param {boolean} props.showAddButton Whether to show the "Add Resource" button
 * @param {Array} props.allowedFilters Array of allowed filter types
 * @param {Array} props.allowedSortFields Array of allowed sort fields
 * @param {Object} props.fixedFilters Filters that cannot be changed by the user
 */
const LearningResourcesList = ({ 
  pageSlug = '', 
  showAll = false,
  onAddResource,
  showAddButton = true,
  allowedFilters = ['type', 'difficulty', 'search'],
  allowedSortFields = ['quality_vote_sum', 'created_at', 'updated_at', 'quality_vote_count'],
  fixedFilters = {}
}) => {
  const router = useRouter();
  const LOGIN_URL = '/accounts/login/';
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({}); // State for pre-filled form data
  
  // Track changes to dependencies for proper refetching
  const prevDepsRef = useRef({ 
    pageSlug: null, 
    showAll: false, 
    username: null, 
    isAuthenticated: false
  });
  
  // AI resources state
  const [aiResources, setAiResources] = useState(null);
  const [showAiResources, setShowAiResources] = useState(true); // Default to showing when available
  const [aiResourcesCollapsed, setAiResourcesCollapsed] = useState(false);
  const [loadingPersistentSuggestions, setLoadingPersistentSuggestions] = useState(false);
  const [persistentSuggestions, setPersistentSuggestions] = useState([]);
  const [persistentSuggestionsError, setPersistentSuggestionsError] = useState(null);
  
  // State for filter and sort toggles
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  
  // State for search value
  const [searchValue, setSearchValue] = useState('');
  const searchTimeoutRef = useRef(null);
  
  // Use the centralized auth context
  const { isAuthenticated, user, isLoading: authLoading, error: authError, refreshAuth } = useAuth();
  
  // Set up fixed filters based on props
  const computedFixedFilters = useMemo(() => {
    const filters = { ...fixedFilters };
    
    // If pageSlug is provided and not showing all, add it to fixed filters
    if (pageSlug && !showAll) {
      filters.page_slug = pageSlug;
    }
    
    return filters;
  }, [fixedFilters, pageSlug, showAll]);
  
  // Use our custom hook for learning resources data and operations
  const { 
    resources,
    totalCount,
    currentPage,
    totalPages,
    filters,
    sortBy,
    sortDirection,
    loading,
    error,
    fetchResources,
    createAssociation,
    upvoteAssociation,
    downvoteAssociation,
    updateFilter,
    updateFilters,
    clearFilters,
    updateSort,
    goToPage
  } = useLearningResources({
    pageSlug,
    showAll,
    fixedFilters: computedFixedFilters,
    initialSortBy: 'quality_vote_sum',
    initialSortDirection: 'desc',
    pageSize: 10,
    autoRefetch: true
  });
  
  // Create stable reference to fetchResources
  const fetchResourcesRef = useRef(fetchResources);
  useEffect(() => {
    fetchResourcesRef.current = fetchResources;
  }, [fetchResources]);
  
  // Create stable function for fetching resources
  const stableFetchResources = useCallback((options) => {
    return fetchResourcesRef.current(options);
  }, []);
  
  // Load persistent AI suggestions for this page
  const loadPersistentSuggestions = useCallback(async () => {
    if (!pageSlug || showAll) return; // Only load for specific pages
    
    try {
      setLoadingPersistentSuggestions(true);
      setPersistentSuggestionsError(null);
      
      const suggestions = await getPersistentSuggestionsForPage(pageSlug, {
        filterExisting: true,
        onlyNotAdded: true
      });
      
      setPersistentSuggestions(suggestions || []);
      
      // Show AI resources if we have persistent suggestions
      if (suggestions && suggestions.length > 0) {
        // Transform suggestions to match the expected format
        const transformedSuggestions = suggestions.map(suggestion => ({
          id: suggestion.id,
          title: suggestion.title,
          url: suggestion.url,
          description: suggestion.description,
          resourceType: suggestion.resource_type,
          isPersistent: true
        }));
        
        setAiResources(transformedSuggestions);
        setShowAiResources(true);
        setAiResourcesCollapsed(false);
      }
    } catch (error) {
      console.error('Error loading persistent suggestions:', error);
      setPersistentSuggestionsError('Failed to load AI suggestions');
    } finally {
      setLoadingPersistentSuggestions(false);
    }
  }, [pageSlug, showAll]);
  
  // Store previous dependencies for comparison
  useEffect(() => {
    prevDepsRef.current = { 
      pageSlug,
      showAll,
      username: user?.username, 
      isAuthenticated
    };
  }, [pageSlug, showAll, user?.username, isAuthenticated]);

  // Load persistent suggestions when component mounts or pageSlug changes
  useEffect(() => {
    if (isAuthenticated && pageSlug && !showAll) {
      loadPersistentSuggestions();
    }
  }, [isAuthenticated, pageSlug, showAll, loadPersistentSuggestions]);

  // Refetch resources when key dependencies change
  useEffect(() => {
    const prevDeps = prevDepsRef.current;
    
    // Check if any critical dependency has changed
    const hasPageContextChanged = 
      prevDeps.pageSlug !== pageSlug ||
      prevDeps.showAll !== showAll;
      
    const hasAuthChanged = 
      prevDeps.username !== user?.username ||
      prevDeps.isAuthenticated !== isAuthenticated;
    
    // Always fetch on initial load or when page context changes
    // Also fetch when auth changes and we're showing user-specific content
    if (hasPageContextChanged || (hasAuthChanged && isAuthenticated)) {
      stableFetchResources({ force: true });
    }
  }, [pageSlug, showAll, user?.username, isAuthenticated, stableFetchResources]);
  
  // Handler for authentication-required actions
  const requireAuth = useCallback(() => {
    if (!isAuthenticated) {
      router.push(LOGIN_URL);
      return false;
    }
    return true;
  }, [isAuthenticated, router]);
  
  // Handle adding a new resource
  const handleAddResource = () => {
    if (!requireAuth()) return;
    
    if (onAddResource) {
      onAddResource();
    } else {
      setFormData({}); // Clear any pre-filled data for manual add
      setShowForm(true);
    }
  };
  
  // Handle showing the add form with pre-filled data from AI resources
  const handleShowAddForm = (data) => {
    if (!requireAuth()) return;
    
    setFormData(data); // Set pre-filled data
    setShowForm(true);
  };
  
  // Handler for toggling AI resources collapsed state
  const toggleAiResourcesCollapsed = () => {
    setAiResourcesCollapsed(!aiResourcesCollapsed);
  };

  // Handler for when AI resources are found
  const handleAiResourcesFound = (resources) => {
    setAiResources(resources);
    setShowAiResources(true);
    setAiResourcesCollapsed(false); // Expand when new resources are found
  };
  
  // Handler for when a persistent suggestion is added to resources
  const handleSuggestionAdded = async (suggestion, result) => {
    try {
      // Refresh resources list
      await stableFetchResources({ force: true });
      
      // Remove the suggestion from the list
      if (persistentSuggestions && persistentSuggestions.length > 0) {
        setPersistentSuggestions(prev => 
          prev.filter(s => s.id !== suggestion.id)
        );
        
        // Update the displayed AI resources
        if (aiResources && aiResources.length > 0) {
          setAiResources(prev => 
            prev.filter(r => r.id !== suggestion.id)
          );
          
          // Hide AI resources section if no more resources to display
          if (aiResources.length <= 1) {
            setShowAiResources(false);
          }
        }
      }
    } catch (error) {
      console.error('Error after adding suggestion:', error);
    }
  };

  // Handler for when a persistent suggestion is dismissed
  const handleSuggestionDismissed = async (suggestion) => {
    try {
      // Remove the suggestion from the list
      if (persistentSuggestions && persistentSuggestions.length > 0) {
        setPersistentSuggestions(prev => 
          prev.filter(s => s.id !== suggestion.id)
        );
        
        // Update the displayed AI resources
        if (aiResources && aiResources.length > 0) {
          setAiResources(prev => 
            prev.filter(r => r.id !== suggestion.id)
          );
          
          // Hide AI resources section if no more resources to display
          if (aiResources.length <= 1) {
            setShowAiResources(false);
          }
        }
      }
    } catch (error) {
      console.error('Error after dismissing suggestion:', error);
    }
  };

  // Handler for showing existing AI suggestions
  const handleShowAiSuggestions = () => {
    setShowAiResources(true);
    setAiResourcesCollapsed(false);
  };
  
  // Handle form submission success
  const handleResourceAdded = () => {
    setShowForm(false);
    setFormData({}); // Clear form data
    // Refresh the list with the newly added resource
    stableFetchResources({ force: true });
  };
  
  // Handle form cancellation
  const handleCancelForm = () => {
    setShowForm(false);
    setFormData({}); // Clear form data
  };
  
  // Handle voting on resources
  const handleUpvote = async (associationId) => {
    if (!requireAuth()) return;
    
    try {
      await upvoteAssociation(associationId);
    } catch (err) {
      console.error('Failed to upvote resource:', err);
      
      // Handle 401 unauthorized errors (session expired)
      if (err.response && err.response.status === 401) {
        refreshAuth(); // Try to refresh authentication state
        router.push(LOGIN_URL);
      }
    }
  };
  
  const handleDownvote = async (associationId) => {
    if (!requireAuth()) return;
    
    try {
      await downvoteAssociation(associationId);
    } catch (err) {
      console.error('Failed to downvote resource:', err);
      
      // Handle 401 unauthorized errors (session expired)
      if (err.response && err.response.status === 401) {
        refreshAuth(); // Try to refresh authentication state
        router.push(LOGIN_URL);
      }
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (filterName, value, clearAll = false) => {
    if (clearAll) {
      clearFilters();
      setSearchValue('');
    } else {
      if (filterName === 'created_after_date' || filterName === 'created_before_date') {
        // Handle date range filter
        const newFilters = { ...filters };
        
        if (filterName === 'created_after_date') {
          if (value) {
            // Set the time to 00:00:00 for the start date
            const startDate = new Date(value);
            startDate.setHours(0, 0, 0, 0);
            newFilters.created_after = startDate.toISOString();
            newFilters.created_after_date = value;
          } else {
            // If date is cleared, remove the filter
            delete newFilters.created_after;
            delete newFilters.created_after_date;
          }
        } else if (filterName === 'created_before_date') {
          if (value) {
            // Set the time to 23:59:59 for the end date to include the entire day
            const endDate = new Date(value);
            endDate.setHours(23, 59, 59, 999);
            newFilters.created_before = endDate.toISOString();
            newFilters.created_before_date = value;
          } else {
            // If date is cleared, remove the filter
            delete newFilters.created_before;
            delete newFilters.created_before_date;
          }
        }
        
        // Clear any timeframe filters that might exist
        delete newFilters.timeframe;
        
        updateFilters(newFilters);
      } else if (filterName === 'timeframe') {
        // For backward compatibility with the timeframe filter
        const timeframeFilters = {
          today: { created_today: true },
          this_week: { created_this_week: true },
          this_month: { created_this_month: true },
          anytime: {}
        };
        
        // Clear any date range filters and previous timeframe filters
        const newFilters = { ...filters };
        delete newFilters.created_today;
        delete newFilters.created_this_week;
        delete newFilters.created_this_month;
        delete newFilters.created_after;
        delete newFilters.created_before;
        delete newFilters.created_after_date;
        delete newFilters.created_before_date;
        
        // Apply the new timeframe filter if it's not "anytime"
        if (value !== 'anytime') {
          updateFilters({
            ...newFilters,
            timeframe: value,
            ...timeframeFilters[value]
          });
        } else {
          // Clear timeframe selection
          const { timeframe, ...restFilters } = newFilters;
          updateFilters(restFilters);
        }
      } else {
        updateFilter(filterName, value === 'all' ? '' : value);
        if (filterName === 'search') {
          setSearchValue(value);
        }
      }
    }
  };
  
  // Handle search input changes with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // Clear any existing timeout to implement debouncing
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set a new timeout to delay the search execution
    searchTimeoutRef.current = setTimeout(() => {
      updateFilter('search', value);
    }, 400); // 400ms delay
  };
  
  // Clean up search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
  // Update searchValue when filters.search changes from outside
  useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);
  
  // Toggle filter visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
    // Hide sort when showing filters
    if (showSort && !showFilters) {
      setShowSort(false);
    }
  };
  
  // Toggle sort visibility
  const toggleSort = () => {
    setShowSort(!showSort);
    // Hide filters when showing sort
    if (showFilters && !showSort) {
      setShowFilters(false);
    }
  };
  
  // Handle sort changes
  const handleSortChange = (field, direction) => {
    updateSort(field, direction);
  };
  
  // Handle page changes
  const handlePageChange = (page) => {
    goToPage(page);
  };
  
  // Are controls disabled?
  const controlsDisabled = loading || !!error || authLoading || !!authError;
  
  // SVG Icons for buttons
  const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z"/>
    </svg>
  );

  const SortIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M3.5 3.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 12.293V3.5zm4 .5a.5.5 0 0 1 0-1h1a.5.5 0 0 1 0 1h-1zm0 3a.5.5 0 0 1 0-1h3a.5.5 0 0 1 0 1h-3zm0 3a.5.5 0 0 1 0-1h5a.5.5 0 0 1 0 1h-5zM7 12.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 0-1h-7a.5.5 0 0 0-.5.5z"/>
    </svg>
  );

  const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className={s.searchIcon} viewBox="0 0 16 16">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    </svg>
  );

  // Determine if we have AI suggestions to show
  const hasSuggestions = useMemo(() => {
    return aiResources && aiResources.length > 0;
  }, [aiResources]);
  
  // Determine if we have persistent suggestions that could be shown
  const hasPersistentSuggestions = useMemo(() => {
    return persistentSuggestions && persistentSuggestions.length > 0;
  }, [persistentSuggestions]);

  return (
    <div className={s.container}>
      {/* Header with title and top action buttons */}
      <div className={s.header}>
        <h2 className={s.title}>Learning Resources</h2>
        
        <div className={s.topActions}>
          {/* Add Resource button */}
          {showAddButton && (
            <button
              className={s.addResourceButton}
              onClick={handleAddResource}
              disabled={showForm || controlsDisabled}
            >
              Add Resource
            </button>
          )}
          
          {/* AI Resource Finder button - only on wiki pages (with pageSlug) and for authenticated users */}
          {pageSlug && !showAll && isAuthenticated && (
            <AIResourceFinderButton 
              title={pageSlug}
              pageSlug={pageSlug}
              onResourcesFound={handleAiResourcesFound}
              onShowSuggestions={handleShowAiSuggestions}
              compact={true}
              hasPersistentSuggestions={hasPersistentSuggestions}
              buttonMode={
                // Show 'show' mode if we have persistent suggestions but they're not visible
                (hasPersistentSuggestions && (!showAiResources || aiResourcesCollapsed)) 
                  ? 'show' 
                  // Show 'more' mode if we already have suggestions and they're visible
                  : (showAiResources && !aiResourcesCollapsed && hasSuggestions) 
                    ? 'more' 
                    // Default to 'find' mode
                    : 'find'
              }
              onClick={requireAuth}
            />
          )}
        </div>
      </div>
      
      {/* Form for adding new resources */}
      {showForm && (
        <NewLearningResourceForm 
          pageSlug={pageSlug}
          onSuccess={handleResourceAdded}
          onCancel={handleCancelForm}
          initialUrl={formData.url || ''}
          initialTitle={formData.title || ''}
          initialResourceType={formData.resourceType || 'website'}
          initialDescription={formData.description || ''}
        />
      )}
      
      {/* Show AI-generated resources if available */}
      {showAiResources && hasSuggestions && (
        <div className={s.resourcesList}>
          <div className={s.aiResourcesHeader} onClick={toggleAiResourcesCollapsed}>
            <h3 className={s.aiResourcesTitle}>
              AI-Recommended Learning Resources ✨
            </h3>
            <button 
              className={s.toggleButton}
              onClick={(e) => {
                e.stopPropagation();
                toggleAiResourcesCollapsed();
              }}
              aria-label={aiResourcesCollapsed ? "Expand AI resources" : "Collapse AI resources"}
            >
              {aiResourcesCollapsed ? "Show" : "Hide"}
            </button>
          </div>
          
          {!aiResourcesCollapsed && (
            <AIResourcesDisplay 
              resources={aiResources} 
              onAddResource={handleResourceAdded} 
              onShowAddForm={handleShowAddForm}
              onClose={() => setShowAiResources(false)}
              onSuggestionAdded={handleSuggestionAdded}
              onSuggestionDismissed={handleSuggestionDismissed}
              pageSlug={pageSlug}
              existingResources={resources}
            />
          )}
        </div>
      )}
      
      {/* Controls for user resources - placed right after AI resources */}
      <div className={s.controlsWrapper}>
        <div className={s.controlsBar}>
          <div className={s.controlsLeft}>
            {/* Filter button */}
            <button
              className={`${s.iconButton} ${showFilters ? s.active : ''}`}
              onClick={toggleFilters}
              disabled={controlsDisabled}
              aria-label="Show filters"
            >
              <span className={s.icon}><FilterIcon /></span>
              <span className={s.iconText}>Filter</span>
            </button>
            
            {/* Sort button */}
            <button
              className={`${s.iconButton} ${showSort ? s.active : ''}`}
              onClick={toggleSort}
              disabled={controlsDisabled}
              aria-label="Show sort options"
            >
              <span className={s.icon}><SortIcon /></span>
              <span className={s.iconText}>Sort</span>
            </button>
          </div>
          
          {/* Search input on the right */}
          <div className={s.searchContainer}>
            <input
              type="text"
              className={s.searchInput}
              placeholder="Search resources..."
              value={searchValue}
              onChange={handleSearchChange}
              disabled={controlsDisabled}
            />
            <div className={s.searchIconWrapper}>
              <SearchIcon />
            </div>
            {searchValue && (
              <button 
                className={s.clearSearchButton} 
                onClick={() => {
                  setSearchValue('');
                  updateFilter('search', '');
                }}
                disabled={!searchValue || controlsDisabled}
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
          </div>
        </div>
        
        {/* Collapsible filter panel */}
        {showFilters && (
          <div className={s.filterPanel}>
            <LearningResourcesFilter 
              filters={filters}
              onFilterChange={handleFilterChange}
              allowedFilters={allowedFilters.filter(f => f !== 'search')} // Exclude search as we handle it separately
              disabled={controlsDisabled}
            />
          </div>
        )}
        
        {/* Collapsible sort panel */}
        {showSort && (
          <div className={s.sortPanel}>
            <LearningResourcesSort 
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
              allowedSortFields={allowedSortFields}
              disabled={controlsDisabled}
            />
          </div>
        )}
      </div>
      
      {/* Show authentication-related errors */}
      {authLoading && <p className={s.loading}>Checking authentication...</p>}
      {authError && (
        <div className={s.errorContainer}>
          <p className={s.error}>Authentication error: {authError}</p>
        </div>
      )}
      
      {/* Show resource loading and errors */}
      {loading && !resources.length && <p className={s.loading}>Loading resources...</p>}
      {error && <p className={s.error}>{error}</p>}
      
      {/* Empty state */}
      {!loading && !error && resources.length === 0 && (
        <div className={s.emptyMessage}>
          <p>{showAll ? 'No learning resources have been added yet.' : 'No learning resources have been added to this page yet.'}</p>
          {showAddButton && <p>Click "Add Resource" to be the first!</p>}
        </div>
      )}
      
      {/* Resources list */}
      {resources.length > 0 && (
        <div className={s.resourcesList}>
          {resources.map((item) => {
            // Standardized approach to handling resources:
            // We always create a consistent structure with separate resource and association objects
            
            // For nested structure (item.resource exists)
            if (item.resource) {
              return (
                <LearningResourceItem 
                  key={item.id}
                  resource={item.resource}
                  association={item}
                  onUpvote={handleUpvote}
                  onDownvote={handleDownvote}
                  canVote={isAuthenticated}
                  showPageLinks={showAll}
                  showVoting={!showAll} // Hide voting on index page (showAll=true)
                />
              );
            }
            
            // For flat structure (from index pages), we extract resource properties and association properties
            // This ensures consistent handling across all pages
            const resourceProps = {
              id: item.id,
              title: item.title,
              resource_type: item.resource_type, 
              primary_url: item.primary_url,
              urls: item.urls,
              // Add missing quality and difficulty properties
              quality_vote_sum: item.quality_vote_sum,
              quality_vote_count: item.quality_vote_count,
              average_quality_rating: item.average_quality_rating,
              dominant_difficulty_level: item.dominant_difficulty_level
            };
            
            // All other properties belong to the association
            const associationProps = {
              id: item.association_id || item.id, // Use association_id when available, fallback to resource id
              appropriateness_upvotes: item.appropriateness_upvotes,
              appropriateness_downvotes: item.appropriateness_downvotes,
              user_vote: item.user_vote,
              page_slug: item.page_slug
            };
            
            return (
              <LearningResourceItem 
                key={item.id}
                resource={resourceProps}
                association={associationProps}
                onUpvote={handleUpvote}
                onDownvote={handleDownvote}
                canVote={isAuthenticated}
                showPageLinks={showAll}
                showVoting={!showAll} // Hide voting on index page (showAll=true)
              />
            );
          })}
        </div>
      )}
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <LearningResourcesPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          disabled={controlsDisabled}
        />
      )}
    </div>
  );
};

LearningResourcesList.propTypes = {
  pageSlug: PropTypes.string,
  showAll: PropTypes.bool,
  onAddResource: PropTypes.func,
  showAddButton: PropTypes.bool,
  allowedFilters: PropTypes.arrayOf(PropTypes.string),
  allowedSortFields: PropTypes.arrayOf(PropTypes.string),
  fixedFilters: PropTypes.object
};

LearningResourcesList.defaultProps = {
  pageSlug: '',
  showAll: false,
  onAddResource: null,
  showAddButton: true,
  allowedFilters: ['type', 'difficulty', 'search'],
  allowedSortFields: ['quality_vote_sum', 'created_at', 'updated_at', 'quality_vote_count'],
  fixedFilters: {}
};

/**
 * AI Learning Resources Persistence Feature
 * 
 * This implementation allows AI-suggested learning resources to be stored persistently
 * in the database and displayed to users on wiki article pages. The feature includes:
 * 
 * 1. Loading persistent suggestions from the backend when a page loads
 * 2. Showing suggestions with different button states:
 *    - 'find': No suggestions yet, clicking will find new ones
 *    - 'show': Has suggestions but they're not visible, clicking will show them
 *    - 'more': Already showing suggestions, clicking will find more
 * 3. Adding persistent suggestions to real resources
 * 4. Dismissing suggestions that aren't relevant
 * 
 * The feature helps improve content quality by saving valuable AI suggestions
 * and making them available to users without requiring repeated API calls.
 */

export default LearningResourcesList;
