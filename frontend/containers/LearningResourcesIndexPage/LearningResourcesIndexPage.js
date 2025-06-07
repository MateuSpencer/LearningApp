import React from 'react';
import PropTypes from 'prop-types';
import { basePageWrap } from '../BasePage';
import LearningResourcesList from '../../components/LearningResourcesList/LearningResourcesList';
import { useTranslation } from '../../hooks/useTranslation';
import s from './LearningResourcesIndexPage.module.css';

const LearningResourcesIndexPage = () => {
  const { t } = useTranslation();
  
  return (
    <div className={s.container}>
      <div className={s.centeredHeader}>
        <h1 className={s.title}>
          {t('learningResourcesPage.title')}
        </h1>
      </div>
      
      {/* Use the LearningResourcesList component with built-in filtering and sorting */}
      <LearningResourcesList 
        showAll={true} 
        allowedFilters={['type', 'difficulty', 'search']}
        allowedSortFields={['quality_score', 'created_at', 'difficulty_score']} 
        showAddButton={false} // Disable the Add Resource button
      />
    </div>
  );
};

LearningResourcesIndexPage.propTypes = {
  // No specific props required
};

export default basePageWrap(LearningResourcesIndexPage);
