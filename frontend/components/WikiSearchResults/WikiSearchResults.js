import React from 'react';
import PropTypes from 'prop-types';
import WikiLink from '../WikiLink';
import { useTranslation } from '../../hooks/useTranslation';
import s from './WikiSearchResults.module.css';

/**
 * Display wiki search results with formatting similar to Wikipedia
 */
const WikiSearchResults = ({ results, loading, error, query }) => {
  const { t } = useTranslation();
  
  if (loading) {
    return (
      <div className={s.searchResults}>
        <div className={s.loadingContainer}>
          <p className={s.loadingText}>{t('wiki.searchFor', { query })}</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={s.searchResults}>
        <div className={s.errorContainer}>
          <p className={s.errorText}>{error}</p>
        </div>
      </div>
    );
  }
  
  if (!results || results.length === 0) {
    if (query && query.length >= 2) {
      return (
        <div className={s.searchResults}>
          <div className={s.noResults}>
            <p className={s.noResultsText}>{t('wiki.searchFor', { query })}</p>
            <p className={s.helpText}>{t('wiki.tryAgain')}</p>
          </div>
        </div>
      );
    }
    return null; // Don't show anything if no query or results
  }
  
  return (
    <div className={s.searchResults}>
      <h2 className={s.resultsHeading}>{t('wiki.searchFor', { query })}</h2>
      <p className={s.resultCount}>{t('wiki.resultsFound', { count: results.length })}</p>
      
      <ul className={s.resultsList}>
        {results.map((result) => (
          <li key={result.id} className={s.resultItem}>
            <WikiLink slug={result.slug} className={s.resultLink}>
              <article className={s.resultArticle}>
                <h3 className={s.resultTitle}>
                  {result.title}
                </h3>
                <div 
                  className={s.resultSnippet} 
                  dangerouslySetInnerHTML={{ __html: result.snippet }}
                />
              </article>
            </WikiLink>
          </li>
        ))}
      </ul>
      
      {results.length > 5 && (
        <div className={s.resultFooter}>
          <p className={s.footerNote}>{t('wiki.resultsFound', { count: results.length })}. {t('wiki.tryAgain')}</p>
        </div>
      )}
    </div>
  );
};

WikiSearchResults.propTypes = {
  results: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      snippet: PropTypes.string.isRequired
    })
  ),
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  query: PropTypes.string.isRequired
};

export default WikiSearchResults;
