import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { basePageWrap } from '../BasePage';
import WikipediaPreview from '../../components/WikipediaPreview';
import RightSidebar from '../../components/RightSidebar';
import s from './WikiArticlePage.module.css';

const WikiArticlePage = ({ title, articleSlug }) => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  
  const handleSidebarToggle = (expanded) => {
    setIsSidebarExpanded(expanded);
  };

  return (
    <div className={s.pageLayout}>
      <div className={`${s.mainContent} ${isSidebarExpanded ? s.withExpandedSidebar : ''}`}>
        <WikipediaPreview slug={articleSlug} />
      </div>
      <div className={`${s.rightSidebarContainer} ${isSidebarExpanded ? s.expanded : ''}`}>
        <RightSidebar onToggle={handleSidebarToggle} />
      </div>
    </div>
  );
};

WikiArticlePage.defaultProps = {
  title: '',
  articleSlug: ''
};

WikiArticlePage.propTypes = {
  title: PropTypes.string,
  articleSlug: PropTypes.string
};

export default basePageWrap(WikiArticlePage);