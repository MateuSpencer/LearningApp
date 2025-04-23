import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
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
  // Add state for managing the search input independently
  const [searchValue, setSearchValue] = useState(filters.search || '');
  // Reference to store the timeout ID for debouncing
  const searchTimeoutRef = useRef(null);
  
  // Update searchValue when filters.search changes from outside this component
  useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);

  const handleFilterChange = (filterName, value) => {
    onFilterChange(filterName, value);
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
      onFilterChange('search', value);
    }, 400); // 400ms delay
  };
  
  // Clear timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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
          <label className={styles.filterLabel}>Date Range:</label>
          <div className={styles.dateRangeContainer}>
            <div className={styles.dateInputWrapper}>
              <label className={styles.dateLabel}>From:</label>
              <DatePicker
                selected={filters.created_after ? new Date(filters.created_after) : null}
                onChange={(date) => handleFilterChange('created_after_date', date)}
                className={styles.dateInput}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select start date"
                disabled={disabled}
                isClearable
              />
            </div>
            <div className={styles.dateInputWrapper}>
              <label className={styles.dateLabel}>To:</label>
              <DatePicker
                selected={filters.created_before ? new Date(filters.created_before) : null}
                onChange={(date) => handleFilterChange('created_before_date', date)}
                className={styles.dateInput}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select end date"
                disabled={disabled}
                isClearable
              />
            </div>
          </div>
        </div>
      )}

      {allowedFilters.includes('search') && (
        <div className={styles.filterGroup}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search posts..."
            value={searchValue}
            onChange={handleSearchChange}
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