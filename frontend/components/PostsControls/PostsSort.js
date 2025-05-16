import React from 'react';
import PropTypes from 'prop-types';
import styles from './PostsSort.module.css';

/**
 * Sort component for PostsList
 * Provides UI for sorting posts by different criteria
 */
const PostsSort = ({ 
  sortBy, 
  sortDirection, 
  onSortChange,
  allowedSortFields = ['created_at', 'title', 'updated_at'],
  disabled = false 
}) => {
  const handleSortChange = (e) => {
    const value = e.target.value;
    // Extract field and direction from value (e.g., "created_at:desc")
    const [field, direction] = value.split(':');
    onSortChange(field, direction);
  };

  // Convert current sort state to a single value for the select
  const currentValue = `${sortBy}:${sortDirection}`;

  return (
    <div className={styles.container}>
      <label className={styles.sortLabel}>Sort by:</label>
      <select
        className={styles.sortSelect}
        value={currentValue}
        onChange={handleSortChange}
        disabled={disabled}
      >
        {/* Add date sorting options */}
        {allowedSortFields.includes('created_at') && (
          <>
            <option value="created_at:desc">Newest First</option>
            <option value="created_at:asc">Oldest First</option>
          </>
        )}
        
        {allowedSortFields.includes('updated_at') && (
          <>
            <option value="updated_at:desc">Recently Updated</option>
            <option value="updated_at:asc">Least Recently Updated</option>
          </>
        )}
        
        {allowedSortFields.includes('title') && (
          <>
            <option value="title:asc">Title (A-Z)</option>
            <option value="title:desc">Title (Z-A)</option>
          </>
        )}
        
        {allowedSortFields.includes('status') && (
          <>
            <option value="status:asc">Status (A-Z)</option>
            <option value="status:desc">Status (Z-A)</option>
          </>
        )}
      </select>
    </div>
  );
};

PostsSort.propTypes = {
  sortBy: PropTypes.string.isRequired,
  sortDirection: PropTypes.string.isRequired,
  onSortChange: PropTypes.func.isRequired,
  allowedSortFields: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool
};

export default PostsSort;