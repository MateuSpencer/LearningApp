import React, { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { basePageWrap } from '../BasePage';
import WikipediaPreview from '../../components/WikipediaPreview';
import RightSidebar from '../../components/RightSidebar';
import PostsList from '../../components/PostsList';
import NewPostForm from '../../components/NewPostForm';
import LearningResourcesList from '../../components/LearningResourcesList';
import s from './WikiArticlePage.module.css';

const WikiArticlePage = ({ title, articleSlug }) => {
  const router = useRouter();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [refreshPosts, setRefreshPosts] = useState(0);
  
  // New state for article validation
  const [articleExists, setArticleExists] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const validationTimeoutRef = useRef(null);
  
  const handleSidebarToggle = (expanded) => {
    setIsSidebarExpanded(expanded);
  };

  const handleNewPostSubmit = (post) => {
    setShowNewPostForm(false);
    // Trigger a refresh of the posts list
    setRefreshPosts(prev => prev + 1);
  };

  // Handle article validation results
  const handleArticleValidated = useCallback((exists) => {
    setArticleExists(exists);
    setIsValidating(false);
    
    // If after 1 second we still think the article exists, allow the components to render
    // This prevents flashing content before redirect on non-existent pages
    if (exists) {
      validationTimeoutRef.current = setTimeout(() => {
        setArticleExists(true);
      }, 1000);
    }
  }, []);

  // Handle wiki page not found redirect when article doesn't exist
  const handleArticleNotFound = useCallback((slug) => {    
    // Set article as non-existent to prevent rendering content
    handleArticleValidated(false);
    
    // Redirect to the main wiki page with the attempted title as a query parameter
    router.push({
      pathname: '/wiki',
      query: { q: slug }
    });
  }, [router, handleArticleValidated]);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);
  
  // Directly validate article via Wikipedia API on component mount
  useEffect(() => {
    const validateArticle = async () => {
      if (!articleSlug) return;
      
      try {
        const response = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articleSlug)}`
        );
        
        if (response.ok) {
          handleArticleValidated(true);
        } else {
          handleArticleNotFound(articleSlug);
        }
      } catch (error) {
        console.error('Error validating article:', error);
        handleArticleNotFound(articleSlug);
      }
    };
    
    setIsValidating(true);
    validateArticle();
  }, [articleSlug, handleArticleValidated, handleArticleNotFound]);

  return (
    <div className={s.pageLayout}>
      <div className={`${s.mainContent} ${isSidebarExpanded ? s.withExpandedSidebar : ''}`}>
        <div className={s.introSection}>
          <WikipediaPreview 
            slug={articleSlug} 
            onArticleNotFound={handleArticleNotFound}
          />
        </div>
        
        {/* Only show the content sections if we've verified the article exists */}
        {articleExists && (
          <>
            {/* Learning Resources section */}
            <div className={s.resourcesSection}>
              <LearningResourcesList 
                pageSlug={articleSlug} 
                key={`resources-list-${articleSlug}`}
              />
            </div>
            
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
                key={`posts-list-${refreshPosts}`}
                allowedFilters={['timeframe', 'search']}
              />
            </div>
          </>
        )}
        
        {isValidating && (
          <div className={s.loadingSection}>
            <p>Validating article existence...</p>
          </div>
        )}
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