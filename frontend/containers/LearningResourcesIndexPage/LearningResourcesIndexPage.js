import React from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { basePageWrap } from '../BasePage';
import LearningResourcesList from '../../components/LearningResourcesList/LearningResourcesList';
import s from './LearningResourcesIndexPage.module.css';

const LearningResourcesIndexPage = () => {
  const router = useRouter();
  const { query } = router;
  
  // Check if we have a page to associate resources with
  const associateWithPage = query.add_to || '';
  
  return (
    <div className={s.container}>
      <div className={s.header}>
        <h1 className={s.title}>
          {associateWithPage ? 'Select a Learning Resource' : 'Learning Resources'}
        </h1>
        
        {associateWithPage && (
          <p className={s.subtitle}>
            Adding a resource to: <span className={s.pageName}>{associateWithPage.replace(/_/g, ' ')}</span>
          </p>
        )}
        
        {/* Removed "Create New Resource" button since the page it links to doesn't exist */}
      </div>
      
      {/* Use the LearningResourcesList component with built-in filtering and sorting */}
      <LearningResourcesList 
        showAll={true} 
        associateWithPage={associateWithPage}
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
