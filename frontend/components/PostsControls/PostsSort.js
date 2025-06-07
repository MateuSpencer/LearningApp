import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './PostsSort.module.css';

/**
 * Sort component for PostsList
 * Provides UI for sorting posts by newest or oldest only
 */
const PostsSort = ({ 
  order = 'newest',
  onSortChange,
  disabled = false 
}) => {
  const { t } = useTranslation();
  
  const handleSortChange = (e) => {
    const value = e.target.value;
    onSortChange(value);
  };

  return (
    <div className={styles.container}>
      <label className={styles.sortLabel}>{t('posts.sortBy')}:</label>
      <select
        className={styles.sortSelect}
        value={order}
        onChange={handleSortChange}
        disabled={disabled}
      >
        <option value="newest">{t('posts.newestFirst')}</option>
        <option value="oldest">{t('posts.oldestFirst')}</option>
      </select>
    </div>
  );
};

PostsSort.propTypes = {
  order: PropTypes.string,
  onSortChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default PostsSort;