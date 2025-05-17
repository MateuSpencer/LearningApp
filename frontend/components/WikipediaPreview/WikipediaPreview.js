import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import s from './WikipediaPreview.module.css';

const WikipediaPreview = ({ slug = '', onArticleNotFound }) => {
  // slug always a string now
  const articleTitle = slug
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // States for API data
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [articleExists, setArticleExists] = useState(true);
  
  // Function to fetch data from Wikipedia API
  const fetchWikipediaSummary = useCallback(async () => {
    if (!slug) return;
    
    setLoading(true);
    setArticleExists(true);
    
    try {
      // Using Wikipedia's REST API to fetch page summary
      const encodedSlug = encodeURIComponent(slug);
      
      const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedSlug}`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        setArticleExists(false);
        setLoading(false);
        
        // Notify parent component that article doesn't exist
        if (onArticleNotFound && typeof onArticleNotFound === 'function') {
          onArticleNotFound(slug);
        }
        return;
      }
      
      const data = await response.json();
      setSummary(data.extract);
    } catch (err) {
      // Silently handle the error
      setArticleExists(false);
      
      // Notify parent component that article doesn't exist
      if (onArticleNotFound && typeof onArticleNotFound === 'function') {
        onArticleNotFound(slug);
      }
    } finally {
      setLoading(false);
    }
  }, [slug, onArticleNotFound]);
  
  // Fetch data on component mount or when slug changes
  useEffect(() => {
    fetchWikipediaSummary();
  }, [slug, fetchWikipediaSummary]);
  
  return (
    <div className={s.container}>
      <h1 className={s.centeredTitle}>
        {articleExists ? (
          <a 
            href={`https://en.wikipedia.org/wiki/${encodeURIComponent(slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            data-special-chars="preserved"
          >
            {articleTitle}
          </a>
        ) : (
          articleTitle
        )}
      </h1>
      
      <div className={s.content}>
        {loading && <p className={s.loadingText}>Loading article summary...</p>}
        {!loading && !articleExists && (
          <p className={s.noContentText}>
            This article doesn't exist on Wikipedia and thus doesn't exist here.
          </p>
        )}
        {!loading && articleExists && summary && (
          <>
            <p className={s.articleText}>{summary}</p>
            <div className={s.readMoreLink}>
              <a 
                href={`https://en.wikipedia.org/wiki/${encodeURIComponent(slug)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                data-special-chars="preserved"
              >
                Read full article on Wikipedia →
              </a>
            </div>
          </>
        )}
        {!loading && articleExists && !summary && (
          <p className={s.noContentText}>No summary available for this article.</p>
        )}
      </div>
    </div>
  );
};

WikipediaPreview.propTypes = {
  slug: PropTypes.string,
  onArticleNotFound: PropTypes.func
};

export default WikipediaPreview;