import React from 'react';
import PropTypes from 'prop-types';
import s from './WikipediaPreview.module.css';

const WikipediaPreview = ({ slug }) => {
  // Format the slug for Wikipedia URL (replace underscores with spaces for display)
  const articleTitle = slug.replace(/_/g, ' ');
  
  return (
    <div className={s.previewContainer}>
      <div className={s.previewHeader}>
        <img 
          src="/wikipedia-logo.svg" 
          alt="Wikipedia" 
          className={s.wikiLogo} 
        />
        <span>Wikipedia: {articleTitle}</span>
      </div>
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
  );
};

WikipediaPreview.propTypes = {
  slug: PropTypes.string.isRequired
};

export default WikipediaPreview;