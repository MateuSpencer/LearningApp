import React from 'react';
import PropTypes from 'prop-types';
import WikiLink from '../WikiLink';
import s from './WikiSearchResults.module.css';

/**
 * Display wiki search results with formatting similar to Wikipedia
 */
const WikiSearchResults = ({ results, loading, error, query }) => {
  if (loading) {
    return (
      <div className={s.searchResults}>
        <div className={s.loadingContainer}>
          <p className={s.loadingText}>Searching for "{query}"...</p>
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
            <p className={s.noResultsText}>No results found for "{query}"</p>
            <p className={s.helpText}>Try different keywords or check your spelling.</p>
          </div>
        </div>
      );
    }
    return null; // Don't show anything if no query or results
  }
  
  return (
    <div className={s.searchResults}>
      <h2 className={s.resultsHeading}>Search results for "{query}"</h2>
      <p className={s.resultCount}>{results.length} {results.length === 1 ? 'result' : 'results'} found</p>
      
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
          <p className={s.footerNote}>Showing {results.length} results. Try refining your search for more specific results.</p>
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
