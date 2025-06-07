import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from '../../hooks/useTranslation';
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
  const { t } = useTranslation();
  
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
      <label className={styles.sortLabel}>{t('learningResourcesPage.sortBy')}:</label>
      <select
        className={styles.sortSelect}
        value={currentValue}
        onChange={handleSortChange}
        disabled={disabled}
      >
        {/* Add quality score sorting options */}
        {allowedSortFields.includes('quality_vote_sum') && (
          <>
            <option value="quality_vote_sum:desc">{t('learningResourcesPage.sortHighestQuality')}</option>
            <option value="quality_vote_sum:asc">{t('learningResourcesPage.sortLowestQuality')}</option>
          </>
        )}
        
        {allowedSortFields.includes('quality_vote_count') && (
          <>
            <option value="quality_vote_count:desc">{t('learningResourcesPage.sortMostVoted')}</option>
            <option value="quality_vote_count:asc">{t('learningResourcesPage.sortLeastVoted')}</option>
          </>
        )}
        
        {allowedSortFields.includes('created_at') && (
          <>
            <option value="created_at:desc">{t('learningResourcesPage.sortNewest')}</option>
            <option value="created_at:asc">{t('learningResourcesPage.sortOldest')}</option>
          </>
        )}
        
        {allowedSortFields.includes('updated_at') && (
          <>
            <option value="updated_at:desc">{t('learningResourcesPage.sortRecentlyUpdated')}</option>
            <option value="updated_at:asc">{t('learningResourcesPage.sortLeastRecentlyUpdated')}</option>
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