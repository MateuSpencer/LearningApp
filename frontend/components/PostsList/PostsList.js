import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import Post from '../Post';
import EditPostForm from '../EditPostForm';
import { PostsFilter, PostsSort, PostsPagination } from '../PostsControls';
import ConfirmationModal from '../ConfirmationModal';
import usePosts from '../../hooks/usePosts';
import { useUser } from '../../auth/hooks'; // Add this import
import s from './PostsList.module.css';

/**
 * PostsList component - displays a list of posts with filtering, sorting, and pagination
 * 
 * @param {Object} props Component props
 * @param {string} props.pageSlug Filter posts by this page slug (for wiki pages)
 * @param {Function} props.onNewPost Callback for creating a new post
 * @param {boolean} props.showOnlyMyPosts Show only the current user's posts
 * @param {Array} props.allowedFilters Array of allowed filter types
 * @param {Array} props.allowedSortFields Array of allowed sort fields
 * @param {Object} props.fixedFilters Filters that cannot be changed by the user
 */
const PostsList = ({ 
  pageSlug, 
  onNewPost, 
  showOnlyMyPosts = false,
  allowedFilters = ['status', 'timeframe', 'search'],
  allowedSortFields = ['votes_score', 'created_at', 'updated_at', 'status'],
  fixedFilters = {}
}) => {
  // Track changes to dependencies 
  const prevDepsRef = useRef({ currentUser: null, showOnlyMyPosts: false });
  
  // Track which post is being edited
  const [editingPostId, setEditingPostId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // State for delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  // State for filter and sort toggles
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  
  // State for search value
  const [searchValue, setSearchValue] = useState('');
  const searchTimeoutRef = useRef(null);
  
  
  // Set up fixed filters based on props
  const computedFixedFilters = useMemo(() => {
    const filters = { ...fixedFilters };
    
    // If pageSlug is provided, add it to fixed filters
    if (pageSlug) {
      filters.page_slug = pageSlug;
    }
    
    // If showOnlyMyPosts is true, add author filter
    if (showOnlyMyPosts && currentUser) {
      filters.author = currentUser;
    }
    
    return filters;
  }, [fixedFilters, pageSlug, showOnlyMyPosts, currentUser]);
  
  // Use our custom hook for posts data and operations
  const {
    posts,
    totalCount,
    currentPage,
    totalPages,
    filters,
    sortBy,
    sortDirection,
    loading,
    error,
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
    updateFilter,
    updateFilters,
    clearFilters,
    updateSort,
    goToPage,
    upvotePost,      // Include upvote functionality
    downvotePost     // Include downvote functionality
  } = usePosts({
    fixedFilters: computedFixedFilters,
    initialSortBy: 'votes_score',  // Default to sorting by vote score
    initialSortDirection: 'desc',
    pageSize: 10
  });
  
  // Create stable reference to fetchPosts
  const fetchPostsRef = useRef(fetchPosts);
  useEffect(() => {
    fetchPostsRef.current = fetchPosts;
  }, [fetchPosts]);
  
  // Create stable function for fetching posts
  const stableFetchPosts = useCallback((options) => {
    return fetchPostsRef.current(options);
  }, []);
  
  // Get the current user from allauth
  const user = useUser();
  
  // Update currentUser when allauth user changes
  useEffect(() => {
    if (user) {
      setCurrentUser(user.username || user.email);
    } else {
      setCurrentUser(null);
    }
  }, [user]);
  
  // Store previous dependencies for comparison
  useEffect(() => {
    prevDepsRef.current = { 
      currentUser, 
      showOnlyMyPosts, 
      fetchPosts: fetchPostsRef.current 
    };
  }, [currentUser, showOnlyMyPosts, fetchPosts]);
  
  // Refetch posts when currentUser changes and we're using showOnlyMyPosts
  useEffect(() => {
    // Only fetch if we have a user and either the user or showOnlyMyPosts flag changed
    if (showOnlyMyPosts && currentUser && 
        (prevDepsRef.current.currentUser !== currentUser || 
         prevDepsRef.current.showOnlyMyPosts !== showOnlyMyPosts)) {
      stableFetchPosts({ force: true });
    }
  }, [showOnlyMyPosts, currentUser, stableFetchPosts]);
  
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
        
        // Clear the old timeframe filter if it exists
        delete newFilters.timeframe;
        delete newFilters.created_today;
        delete newFilters.created_this_week;
        delete newFilters.created_this_month;
        
        updateFilters(newFilters);
      } else if (filterName === 'timeframe') {
        // For backward compatibility with the old timeframe filter
        const timeframeFilters = {
          today: { created_today: true },
          this_week: { created_this_week: true },
          this_month: { created_this_month: true },
          anytime: {}
        };
        
        // Clear any previous timeframe filters and date range filters
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
  
  // Handle post editing
  const handleEdit = (postId) => {
    setEditingPostId(postId);
  };
  
  // Handle saving edits
  const handleSaveEdit = async (updatedPostData) => {
    try {
      await updatePost(updatedPostData.id, updatedPostData);
      setEditingPostId(null);
    } catch (err) {
      // Error is already handled by the hook
      console.error('Failed to save edited post:', err);
    }
  };
  
  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingPostId(null);
  };
  
  // Open confirmation modal for post deletion
  const handleDeleteClick = (postId) => {
    setPostToDelete(postId);
    setDeleteModalOpen(true);
  };
  
  // Handle actual post deletion after confirmation
  const handleConfirmDelete = async () => {
    try {
      await deletePost(postToDelete);
      setDeleteModalOpen(false);
      setPostToDelete(null);
    } catch (err) {
      // Error is already handled by the hook
      setDeleteModalOpen(false);
      setPostToDelete(null);
    }
  };
  
  // Handle cancellation of delete
  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setPostToDelete(null);
  };

  // Handle upvoting a post
  const handleUpvote = async (postId) => {
    if (!currentUser) {
      // If user is not logged in, redirect to login or show a message
      alert('Please log in to vote on posts');
      return;
    }
    
    try {
      await upvotePost(postId);
    } catch (err) {
      console.error('Failed to upvote post:', err);
    }
  };
  
  // Handle downvoting a post
  const handleDownvote = async (postId) => {
    if (!currentUser) {
      // If user is not logged in, redirect to login or show a message
      alert('Please log in to vote on posts');
      return;
    }
    
    try {
      await downvotePost(postId);
    } catch (err) {
      console.error('Failed to downvote post:', err);
    }
  };

  // Are controls disabled?
  const controlsDisabled = loading || !!error;
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

  return (
    <div className={s.container}>
      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
      
      <div className={s.controlsWrapper}>
        <div className={s.controlsBar}>
          <div className={s.controlsLeft}>
            {/* Filter toggle button */}
            <button 
              className={`${s.iconButton} ${showFilters ? s.active : ''}`}
              onClick={toggleFilters}
              disabled={controlsDisabled}
              aria-label="Toggle filters"
              title="Toggle filters"
            >
              <span className={s.icon}><FilterIcon /></span>
              <span className={s.iconText}>Filter</span>
            </button>
            
            {/* Sort toggle button */}
            <button 
              className={`${s.iconButton} ${showSort ? s.active : ''}`}
              onClick={toggleSort}
              disabled={controlsDisabled}
              aria-label="Toggle sort options"
              title="Toggle sort options"
            >
              <span className={s.icon}><SortIcon /></span>
              <span className={s.iconText}>Sort</span>
            </button>
            
            {/* Search input - always visible */}
            <div className={s.searchContainer}>
              <input
                type="text"
                className={s.searchInput}
                placeholder="Search posts..."
                value={searchValue}
                onChange={handleSearchChange}
                disabled={controlsDisabled}
              />
              {searchValue && (
                <button 
                  className={s.clearSearchButton}
                  onClick={() => {
                    setSearchValue('');
                    updateFilter('search', '');
                  }}
                  disabled={controlsDisabled}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
              {!searchValue && (
                <span className={s.searchIconWrapper}>
                  <SearchIcon />
                </span>
              )}
            </div>
          </div>
          
          <div className={s.controlsRight}>
            {/* Add New Post button */}
            {onNewPost && !showOnlyMyPosts && (
              <button 
                className={s.newPostButton}
                onClick={onNewPost}
                disabled={tokenLoading || !!tokenError}
              >
                Add New Post
              </button>
            )}
          </div>
        </div>
        
        {/* Collapsible filter panel */}
        {showFilters && (
          <div className={s.filterPanel}>
            <PostsFilter 
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
            <PostsSort 
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
              allowedSortFields={allowedSortFields}
              disabled={controlsDisabled}
            />
          </div>
        )}
      </div>
      
      {/* Show post loading and errors */}
      {loading && <p className={s.loading}>Loading posts...</p>}
      {error && <p className={s.error}>{error}</p>}
      
      {!loading && !error && posts.length === 0 && (
        <p className={s.emptyMessage}>
          {showOnlyMyPosts 
            ? "You haven't created any posts yet."
            : "No posts yet. Be the first to contribute!"}
        </p>
      )}
      
      {/* Display the posts */}
      <div className={s.postsList}>
        {posts.map(post => {
          if (editingPostId === post.id) {
            return (
              <EditPostForm
                key={post.id}
                post={post}
                onSave={handleSaveEdit}
                onCancel={handleCancelEdit}
              />
            );
          }
          return (
            <Post
              key={post.id}
              id={post.id}
              content={post.content}
              resource_url={post.resource_url}
              author={post.author_username}
              createdAt={post.created_at}
              currentUser={currentUser}
              slug={pageSlug}
              primary_slug={post.primary_slug}
              page_slug={post.page_slug}
              status={post.status}
              upvotes_count={post.upvotes_count}
              downvotes_count={post.downvotes_count}
              votes_score={post.votes_score}
              user_vote={post.user_vote}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onUpvote={handleUpvote}
              onDownvote={handleDownvote}
              canModify={!!currentUser && post.author_username === currentUser}
              canVote={!!currentUser}
            />
          );
        })}
      </div>
      
      {/* Pagination controls */}
      <PostsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        disabled={controlsDisabled}
      />
    </div>
  );
};

PostsList.propTypes = {
  pageSlug: PropTypes.string,
  onNewPost: PropTypes.func,
  showOnlyMyPosts: PropTypes.bool,
  allowedFilters: PropTypes.arrayOf(PropTypes.string),
  allowedSortFields: PropTypes.arrayOf(PropTypes.string),
  fixedFilters: PropTypes.object
};

PostsList.defaultProps = {
  pageSlug: '',
  onNewPost: null,
  showOnlyMyPosts: false,
  allowedFilters: ['status', 'timeframe', 'search'],
  allowedSortFields: ['votes_score', 'created_at', 'updated_at', 'status'],
  fixedFilters: {}
};

export default PostsList;