import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import ContentLanguageSelector from '../ContentLanguageSelector';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './PostsFilter.module.css';

/**
 * Filter component for PostsList
 * Provides UI for filtering posts based on status, language, etc.
 */
const PostsFilter = ({ 
  filters, 
  onFilterChange, 
  allowedFilters = ['status'],
  disabled = false 
}) => {
  const { t } = useTranslation();
  
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
          <label className={styles.filterLabel}>{t('posts.filterByStatus')}:</label>
          <select
            className={styles.filterSelect}
            value={filters.status || 'all'}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            disabled={disabled}
          >
            <option value="all">{t('posts.allPosts')}</option>
            <option value="published">{t('posts.statusPublished')}</option>
            <option value="draft">{t('posts.statusDraft')}</option>
            <option value="archived">{t('posts.statusArchived')}</option>
          </select>
        </div>
      )}

      {allowedFilters.includes('language') && (
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>{t('posts.filterByLanguage')}:</label>
          <ContentLanguageSelector
            value={filters.language || ''}
            onChange={(value) => handleFilterChange('language', value)}
            disabled={disabled}
            showAllOption={true}
            allOptionLabel={t('posts.allLanguages')}
            className={styles.filterSelect}
          />
        </div>
      )}

      {allowedFilters.includes('search') && (
        <div className={styles.filterGroup}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={t('posts.searchPlaceholder')}
            value={searchValue}
            onChange={handleSearchChange}
            disabled={disabled}
          />
        </div>
      )}

      {allowedFilters.includes('author') && (
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>{t('posts.filterByAuthor')}:</label>
          <input
            type="text"
            className={styles.filterInput}
            placeholder={t('posts.authorPlaceholder')}
            value={filters.author || ''}
            onChange={(e) => handleFilterChange('author', e.target.value)}
            disabled={disabled}
          />
        </div>
      )}

      {allowedFilters.includes('timeframe') && (
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>{t('posts.dateRange')}:</label>
          <div className={styles.dateRangeContainer}>
            <div className={styles.dateInputWrapper}>
              <label className={styles.dateLabel}>{t('posts.from')}:</label>
              <DatePicker
                selected={filters.created_after ? new Date(filters.created_after) : null}
                onChange={(date) => handleFilterChange('created_after_date', date)}
                className={styles.dateInput}
                dateFormat="yyyy-MM-dd"
                placeholderText={t('posts.selectStartDate')}
                disabled={disabled}
                isClearable
              />
            </div>
            <div className={styles.dateInputWrapper}>
              <label className={styles.dateLabel}>{t('posts.to')}:</label>
              <DatePicker
                selected={filters.created_before ? new Date(filters.created_before) : null}
                onChange={(date) => handleFilterChange('created_before_date', date)}
                className={styles.dateInput}
                dateFormat="yyyy-MM-dd"
                placeholderText={t('posts.selectEndDate')}
                disabled={disabled}
                isClearable
              />
            </div>
          </div>
        </div>
      )}
      
      {Object.keys(filters).length > 0 && (
        <button 
          className={styles.clearButton}
          onClick={() => onFilterChange(null, null, true)}
          disabled={disabled}
        >
          {t('posts.clearFilters')}
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