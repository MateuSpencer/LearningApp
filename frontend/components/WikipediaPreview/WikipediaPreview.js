import React, { useState } from 'react';
import PropTypes from 'prop-types';
import s from './WikipediaPreview.module.css';

const WikipediaPreview = ({ slug }) => {
  // Format the slug for Wikipedia URL (replace underscores with spaces for display)
  const articleTitle = slug.replace(/_/g, ' ');
  // State to track if content is expanded or collapsed
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Toggle expanded state
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className={s.toggleContainer}>
      <h1 
        className={`${s.articleTitle} ${s.toggleHeader}`}
        onClick={toggleExpand}
      >
        <span className={`${s.toggleIcon} ${isExpanded ? s.expanded : ''}`}>
          {isExpanded ? '▼' : '►'}
        </span>
        <a 
          href={`https://en.wikipedia.org/wiki/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {articleTitle}
        </a>
      </h1>
      
      {isExpanded && (
        <div className={s.previewContainer}>
          <iframe 
            src={`https://en.wikipedia.org/wiki/${slug}?printable=yes`}
            className={s.previewFrame}
            title={`Wikipedia article: ${articleTitle}`}
            loading="lazy"
          />
          <div className={s.previewFooter}>
            <a 
              href={`https://en.wikipedia.org/wiki/${slug}`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Open in Wikipedia →
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

WikipediaPreview.propTypes = {
  slug: PropTypes.string.isRequired
};

export default WikipediaPreview;