import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import ContentLanguageSelector from '../ContentLanguageSelector';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './LearningResourcesFilter.module.css';

/**
 * Filter component for LearningResourcesList
 * Provides UI for filtering learning resources based on type, difficulty, language, date range, or other criteria
 */
const LearningResourcesFilter = ({ 
  filters, 
  onFilterChange, 
  allowedFilters = ['type'],
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
      {allowedFilters.includes('type') && (
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>{t('learningResourcesPage.filterByType')}:</label>
          <select
            className={styles.filterSelect}
            value={filters.type || 'all'}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            disabled={disabled}
          >
      <option value="all">{t('learningResourcesPage.allTypes')}</option>
      <option value="youtube">{t('learningResourcesPage.typeYoutube')}</option>
      <option value="video">{t('learningResourcesPage.typeVideo')}</option>
      <option value="pdf">{t('learningResourcesPage.typePdf')}</option>
      <option value="image">{t('learningResourcesPage.typeImage')}</option>
      <option value="website">{t('learningResourcesPage.typeWebsite')}</option>
      <option value="article">{t('learningResourcesPage.typeArticle')}</option>
      <option value="book">{t('learningResourcesPage.typeBook')}</option>
      <option value="course">{t('learningResourcesPage.typeCourse')}</option>
      <option value="documentation">{t('learningResourcesPage.typeDocumentation')}</option>
      <option value="tutorial">{t('learningResourcesPage.typeTutorial')}</option>
      <option value="tool">{t('learningResourcesPage.typeTool')}</option>
          </select>
        </div>
      )}

      {allowedFilters.includes('difficulty') && (
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>{t('learningResourcesPage.filterByDifficulty')}:</label>
          <select
            className={styles.filterSelect}
            value={filters.difficulty || 'all'}
            onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            disabled={disabled}
          >
            <option value="all">{t('learningResourcesPage.allLevels')}</option>
            <option value="beginner">{t('learningResourcesPage.difficultyBeginner')}</option>
            <option value="moderate">{t('learningResourcesPage.difficultyModerate')}</option>
            <option value="advanced">{t('learningResourcesPage.difficultyAdvanced')}</option>
          </select>
        </div>
      )}

      {allowedFilters.includes('language') && (
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>{t('learningResourcesPage.filterByLanguage')}:</label>
          <ContentLanguageSelector
            value={filters.language || ''}
            onChange={(value) => handleFilterChange('language', value)}
            disabled={disabled}
            showAllOption={true}
            allOptionLabel={t('learningResourcesPage.allLanguages')}
            className={styles.filterSelect}
          />
        </div>
      )}

      {allowedFilters.includes('category') && (
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>{t('learningResourcesPage.filterByCategory')}:</label>
          <select
            className={styles.filterSelect}
            value={filters.resource_category || 'all'}
            onChange={(e) => handleFilterChange('resource_category', e.target.value)}
            disabled={disabled}
          >
            <option value="all">{t('learningResourcesPage.allCategories')}</option>
            <option value="video">{t('learningResourcesPage.categoryVideos')}</option>
            <option value="document">{t('learningResourcesPage.categoryDocuments')}</option>
            <option value="website">{t('learningResourcesPage.categoryWebsites')}</option>
            <option value="course">{t('learningResourcesPage.categoryCourses')}</option>
            <option value="image">{t('learningResourcesPage.categoryImages')}</option>
          </select>
        </div>
      )}

      {allowedFilters.includes('timeframe') && (
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>{t('learningResourcesPage.dateRange')}:</label>
          <div className={styles.dateRangeContainer}>
            <div className={styles.dateInputWrapper}>
              <label className={styles.dateLabel}>{t('learningResourcesPage.from')}:</label>
              <DatePicker
                selected={filters.created_after ? new Date(filters.created_after) : null}
                onChange={(date) => handleFilterChange('created_after_date', date)}
                className={styles.dateInput}
                dateFormat="yyyy-MM-dd"
                placeholderText={t('learningResourcesPage.selectStartDate')}
                disabled={disabled}
                isClearable
              />
            </div>
            <div className={styles.dateInputWrapper}>
              <label className={styles.dateLabel}>{t('learningResourcesPage.to')}:</label>
              <DatePicker
                selected={filters.created_before ? new Date(filters.created_before) : null}
                onChange={(date) => handleFilterChange('created_before_date', date)}
                className={styles.dateInput}
                dateFormat="yyyy-MM-dd"
                placeholderText={t('learningResourcesPage.selectEndDate')}
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
            placeholder={t('learningResourcesPage.searchPlaceholder')}
            value={searchValue}
            onChange={handleSearchChange}
            disabled={disabled}
          />
        </div>
      )}
      
      {Object.keys(filters).length > 0 && (
        <button 
          className={styles.clearButton}
          onClick={() => onFilterChange(null, null, true)}
          disabled={disabled}
        >
          {t('learningResourcesPage.clearFilters')}
        </button>
      )}
    </div>
  );
};

LearningResourcesFilter.propTypes = {
  filters: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  allowedFilters: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool
};

export default LearningResourcesFilter;