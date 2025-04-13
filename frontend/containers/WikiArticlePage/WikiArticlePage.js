import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { basePageWrap } from '../BasePage';
import WikipediaPreview from '../../components/WikipediaPreview';
import RightSidebar from '../../components/RightSidebar';
import PostsList from '../../components/PostsList';
import NewPostForm from '../../components/NewPostForm';
import s from './WikiArticlePage.module.css';

const WikiArticlePage = ({ title, articleSlug }) => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [refreshPosts, setRefreshPosts] = useState(0);
  
  const handleSidebarToggle = (expanded) => {
    setIsSidebarExpanded(expanded);
  };

  const handleNewPostSubmit = (post) => {
    setShowNewPostForm(false);
    // Trigger a refresh of the posts list
    setRefreshPosts(prev => prev + 1);
  };

  return (
    <div className={s.pageLayout}>
      <div className={`${s.mainContent} ${isSidebarExpanded ? s.withExpandedSidebar : ''}`}>
        <WikipediaPreview slug={articleSlug} />
        
        <div className={s.postsSection}>
          {showNewPostForm ? (
            <NewPostForm 
              pageSlug={articleSlug}
              onSubmit={handleNewPostSubmit}
              onCancel={() => setShowNewPostForm(false)}
            />
          ) : null}
          
          <PostsList 
            pageSlug={articleSlug}
            onNewPost={() => setShowNewPostForm(true)}
            key={`posts-list-${refreshPosts}`} // Force refresh when posts change
          />
        </div>
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