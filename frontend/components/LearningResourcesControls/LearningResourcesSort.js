import React from 'react';
import PropTypes from 'prop-types';
import styles from './LearningResourcesSort.module.css';

/**
 * Sort component for LearningResourcesList
 * Provides UI for sorting learning resources by different criteria
 */
const LearningResourcesSort = ({ 
  sortBy, 
  sortDirection, 
  onSortChange,
  allowedSortFields = ['quality_vote_sum', 'created_at', 'updated_at', 'quality_vote_count'],
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
        {/* Add quality score sorting options */}
        {allowedSortFields.includes('quality_vote_sum') && (
          <>
            <option value="quality_vote_sum:desc">Highest Quality First</option>
            <option value="quality_vote_sum:asc">Lowest Quality First</option>
          </>
        )}
        
        {allowedSortFields.includes('quality_vote_count') && (
          <>
            <option value="quality_vote_count:desc">Most Rated First</option>
            <option value="quality_vote_count:asc">Least Rated First</option>
          </>
        )}
        
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
      </select>
    </div>
  );
};

LearningResourcesSort.propTypes = {
  sortBy: PropTypes.string.isRequired,
  sortDirection: PropTypes.string.isRequired,
  onSortChange: PropTypes.func.isRequired,
  allowedSortFields: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool
};

export default LearningResourcesSort;