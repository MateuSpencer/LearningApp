import React from 'react';
import PropTypes from 'prop-types';
import styles from './PostsFilter.module.css';

/**
 * Filter component for PostsList
 * Provides UI for filtering posts based on status, tags, or other criteria
 */
const PostsFilter = ({ 
  filters, 
  onFilterChange, 
  allowedFilters = ['status'],
  disabled = false 
}) => {
  const handleFilterChange = (filterName, value) => {
    onFilterChange(filterName, value);
  };

  return (
    <div className={styles.container}>
      {allowedFilters.includes('status') && (
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status:</label>
          <select
            className={styles.filterSelect}
            value={filters.status || 'all'}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            disabled={disabled}
          >
            <option value="all">All Posts</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      )}

      {allowedFilters.includes('timeframe') && (
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Time:</label>
          <select
            className={styles.filterSelect}
            value={filters.timeframe || 'anytime'}
            onChange={(e) => handleFilterChange('timeframe', e.target.value)}
            disabled={disabled}
          >
            <option value="anytime">Anytime</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
          </select>
        </div>
      )}

      {allowedFilters.includes('search') && (
        <div className={styles.filterGroup}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search posts..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            disabled={disabled}
          />
        </div>
      )}

      {/* We can add more filter types here as needed */}
      
      {Object.keys(filters).length > 0 && (
        <button 
          className={styles.clearButton}
          onClick={() => onFilterChange(null, null, true)}
          disabled={disabled}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};

PostsFilter.propTypes = {
  filters: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  allowedFilters: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool
};

export default PostsFilter;