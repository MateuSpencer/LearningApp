import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { basePageWrap } from '../BasePage';
import SearchBar from '../../components/SearchBar';
import WikiSearchResults from '../../components/WikiSearchResults';
import useWikiSearch from '../../hooks/useWikiSearch';
import { useRouter } from 'next/router';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import s from './WikiIndexPage.module.css';

const WikiIndexPage = ({ title }) => {
  const router = useRouter();
  const { language } = useLanguage();
  const { t } = useTranslation();
  
  // Custom hook for handling search
  const { query, setQuery, results, loading, error } = useWikiSearch();
  
  // Handle search input from SearchBar
  const handleSearchInput = useCallback((value) => {
    setQuery(value);
  }, [setQuery]);
  
  // Handle form submission with exact match checking
  const handleSearch = useCallback(async (searchQuery) => {
    try {
      // First check if there's an exact match for the query
      // Preserve case and special characters for Wikipedia's case-sensitive URLs
      const formattedQuery = searchQuery.replace(/\s+/g, '_');
      
      // Properly encode the query for API request
      const encodedQuery = encodeURIComponent(formattedQuery);
      
      const apiUrl = `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodedQuery}`;
      
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        // Get the canonical title from Wikipedia's API response
        const data = await response.json();
        // Use the canonical title from Wikipedia which has the correct case
        const canonicalSlug = data.title.replace(/\s+/g, '_');
        
        // Direct match found, navigate directly to the wiki article page
        // Use the "as" parameter to handle special characters properly
        const targetUrl = `/wiki/${canonicalSlug}`;
        
        router.push({
          pathname: '/wiki/[slug]',
          query: { slug: canonicalSlug },
        }, targetUrl);
        return;
      }
    } catch (err) {
      // Continue with normal search if API check fails
    }
    
    // No exact match found, update URL with the query parameter for search results
    router.push({
      pathname: '/wiki',
      query: { q: searchQuery }
    }, undefined, { shallow: true });
  }, [router, language]); // Add language to dependency array
  
  // Initialize from URL query parameter
  useEffect(() => {
    if (router.isReady && router.query.q) {
      setQuery(router.query.q);
    }
  }, [router.isReady, router.query.q, setQuery]);

  return (
    <div className={s.container}>
      <h1 className={s.title}>{t('wiki.searchWiki')}</h1>
      
      <div className={s.searchContainer}>
        <SearchBar 
          placeholder={t('wiki.searchPlaceholder')} 
          onInputChange={handleSearchInput}
          onSearch={handleSearch}
          initialQuery={query}
          enableSuggestions={false} // Disable suggestions in the Wiki Explorer page
        />
      </div>
      
      {/* Dynamic search results */}
      {(query || results.length > 0 || loading || error) && (
        <div className={s.resultsContainer}>
          <WikiSearchResults
            results={results}
            loading={loading}
            error={error}
            query={query}
          />
        </div>
      )}
      
      {/* Instructions when no search is active */}
      {!query && !results.length && !loading && !error && (
        <div className={s.instructions}>
          <h2>{t('wiki.searchWiki')}</h2>
          <p>{t('wiki.searchHint')}</p>
        </div>
      )}
    </div>
  );
};

WikiIndexPage.defaultProps = {
  title: '',
};

WikiIndexPage.propTypes = {
  title: PropTypes.string,
};

export default basePageWrap(WikiIndexPage);