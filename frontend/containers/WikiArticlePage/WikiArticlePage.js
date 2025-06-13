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
import { fetchWikipediaArticle } from '../../utils/wikiUtils';

const WikiArticlePage = ({ title, articleSlug }) => {
  const router = useRouter();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [refreshPosts, setRefreshPosts] = useState(0);
  
  const [articleExists, setArticleExists] = useState(false); // Remains false until positive confirmation
  const [isValidating, setIsValidating] = useState(true);
  const validationTimeoutRef = useRef(null);

  useEffect(() => {
    if (!router.isReady || !articleSlug) {
      setIsValidating(false); // Stop validating if no slug or router not ready
      return;
    }

    setIsValidating(true);
    setArticleExists(false); // Reset article existence state on new slug

    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    const validateArticle = async () => {
      try {
        const { summaryData, isDisambiguation, error } = await fetchWikipediaArticle(articleSlug);

        if (!router.isReady) return; // Prevent state updates if component unmounted or router changed

        if (error && error === 'Article not found') {
          // Use the proper router push method with query parameters
          router.push({
            pathname: '/wiki',
            query: { q: articleSlug }
          });
          return;
        }
        
        if (isDisambiguation) {
          // Use the proper router push method with query parameters
          router.push({
            pathname: '/wiki',
            query: { q: articleSlug }
          });
          return;
        }

        if (error) {
          // Optionally, still redirect or show an error message on other errors
          // For now, we'll assume it doesn't exist if there's an error and no summary
          if (!summaryData) {
            // router.push(`/wiki/?q=${encodeURIComponent(articleSlug)}`);
            // return;
          }
        }

        if (summaryData) {
          setArticleExists(true);
        } else {
          // If no summary data and not already redirected, treat as not existing.
          // This case might be hit if there was an error but not 'Article not found' or disambiguation.
          // Depending on desired behavior, could also redirect here.
          setArticleExists(false);
        }
      } catch (e) {
        // Catch any unexpected errors from fetchWikipediaArticle or within this async block
        if (router.isReady) {
          // router.push(`/wiki/?q=${encodeURIComponent(articleSlug)}`);
        }
      } finally {
        if (router.isReady) {
          setIsValidating(false);
        }
      }
    };

    validateArticle();

    validationTimeoutRef.current = setTimeout(() => {
      if (isValidating && router.isReady) {
        setIsValidating(false);
        // Fallback: if validation times out, consider it not found or problematic
        // router.push(`/wiki/?q=${encodeURIComponent(articleSlug)}`);
      }
    }, 15000); // 15 seconds timeout

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [articleSlug, router]); // router.isReady is implicitly handled by router object dependency

  const handleSidebarToggle = (expanded) => {
    setIsSidebarExpanded(expanded);
  };

  const handleNewPostSubmit = (post) => {
    setShowNewPostForm(false);
    setRefreshPosts(prev => prev + 1);
  };

  // This callback is likely no longer directly needed by WikipediaPreview 
  // if all redirection logic is in useEffect.
  // However, WikipediaPreview might still call it if it has its own internal fetch.
  // For now, let's assume it might still be called, but its role is diminished.
  const handleArticleNotFound = useCallback(() => {
    // Redirection is handled by useEffect
    // if (router.isReady) {
    //   router.push(`/wiki/?q=${encodeURIComponent(articleSlug)}`);
    // }
  }, [articleSlug, router]);

  // Don't render anything while validating or if article doesn't exist
  // This prevents the brief flash of loading/error content
  if (isValidating || !articleExists) {
    return null;
  }

  return (
    <div className={s.pageLayout}>
      <div className={`${s.mainContent} ${isSidebarExpanded ? s.withExpandedSidebar : ''}`}>
        <div className={s.introSection}>
          <WikipediaPreview 
            slug={articleSlug} 
            onArticleNotFound={handleArticleNotFound}
          />
        </div>
        
        {/* Content sections are now primarily controlled by articleExists */}
        {articleExists && (
          <>
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
                allowedFilters={['status', 'author', 'timeframe', 'search', 'language']}
              />
            </div>
          </>
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