import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import s from './WikipediaPreview.module.css';

const WikipediaPreview = ({ slug }) => {
  // Format the slug for Wikipedia URL (replace underscores with spaces for display)
  // and properly capitalize each word
  const articleTitle = slug
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // States for API data
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [articleExists, setArticleExists] = useState(true);
  
  // Fetch data on component mount
  useEffect(() => {
    fetchWikipediaSummary();
  }, [slug]);
  
  // Function to fetch data from Wikipedia API
  const fetchWikipediaSummary = async () => {
    setLoading(true);
    setArticleExists(true);
    
    try {
      // Using Wikipedia's REST API to fetch page summary
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`
      );
      
      if (!response.ok) {
        setArticleExists(false);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      setSummary(data.extract);
    } catch (err) {
      // Silently handle the error
      setArticleExists(false);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={s.container}>
      <h1 className={s.centeredTitle}>
        {articleExists ? (
          <a 
            href={`https://en.wikipedia.org/wiki/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
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
                href={`https://en.wikipedia.org/wiki/${slug}`} 
                target="_blank" 
                rel="noopener noreferrer"
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
  slug: PropTypes.string.isRequired
};

export default WikipediaPreview;