import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import Post from '../Post';
import EditPostForm from '../EditPostForm';
import { PostsFilter, PostsSort, PostsPagination } from '../PostsControls';
import { useCSRFToken } from '../../context/CSRFTokenContext';
import usePosts from '../../hooks/usePosts';
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
  allowedSortFields = ['created_at', 'updated_at', 'status'],
  fixedFilters = {}
}) => {
  // Track changes to dependencies 
  const prevDepsRef = useRef({ currentUser: null, showOnlyMyPosts: false });
  
  // Track which post is being edited
  const [editingPostId, setEditingPostId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Get CSRF token
  const { token: csrfToken, loading: tokenLoading, error: tokenError } = useCSRFToken();
  
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
    goToPage
  } = usePosts({
    fixedFilters: computedFixedFilters,
    initialSortBy: 'created_at',
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
  
  // Fetch the current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/user/');
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.username);
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };
    
    fetchCurrentUser();
  }, []);
  
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
    } else {
      updateFilter(filterName, value === 'all' ? '' : value);
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
  
  // Handle post deletion
  const handleDelete = async (postId) => {
    try {
      await deletePost(postId);
    } catch (err) {
      // Error is already handled by the hook
    }
  };

  // Determine the header title
  const headerTitle = showOnlyMyPosts ? "My Posts" : "Posts";
  
  // Are controls disabled?
  const controlsDisabled = loading || !!error || tokenLoading || !!tokenError;

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h2 className={s.title}>{headerTitle}</h2>
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
      
      <div className={s.controls}>
        {/* Filter and Sort controls */}
        <div className={s.filtersRow}>
          <PostsFilter 
            filters={filters}
            onFilterChange={handleFilterChange}
            allowedFilters={allowedFilters}
            disabled={controlsDisabled}
          />
          
          <PostsSort 
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            allowedSortFields={allowedSortFields}
            disabled={controlsDisabled}
          />
        </div>
      </div>
      
      {/* Show token-related errors */}
      {tokenLoading && <p className={s.loading}>Loading security token...</p>}
      {tokenError && (
        <div className={s.errorContainer}>
          <p className={s.error}>Failed to load security token: {tokenError.message}</p>
        </div>
      )}
      
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
              author={post.author_username}
              createdAt={post.created_at}
              currentUser={currentUser}
              slug={pageSlug}
              primary_slug={post.primary_slug}
              page_slug={post.page_slug}
              status={post.status}
              onEdit={handleEdit}
              onDelete={handleDelete}
              // Disable edit/delete if token is not available
              canModify={!!csrfToken && !tokenLoading && !tokenError}
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
  allowedSortFields: ['created_at', 'updated_at', 'status'],
  fixedFilters: {}
};

export default PostsList;