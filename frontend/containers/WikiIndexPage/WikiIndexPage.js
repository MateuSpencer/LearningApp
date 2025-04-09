import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { basePageWrap } from '../BasePage';
import s from './WikiIndexPage.module.css';
import { useRouter } from 'next/router';

const WikiIndexPage = ({ title }) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert spaces to underscores for Wikipedia-style URLs
    const formattedQuery = searchQuery.trim().replace(/\s+/g, '_');
    
    if (formattedQuery) {
      router.push(`/wiki/${formattedQuery}`);
    }
  };

  return (
    <div className={s.container}>
      <h1 className={s.title}>Wiki Explorer</h1>
      
      <div className={s.searchContainer}>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Wikipedia topics..."
            className={s.searchInput}
          />
          <button type="submit" className={s.searchButton}>
            Explore
          </button>
        </form>
      </div>
      
      <div className={s.instructions}>
        <h2>How to use:</h2>
        <p>Enter a Wikipedia article name above or navigate directly to:</p>
        <code>/wiki/Article_Name</code>
        <p>For example: <a href="/wiki/Neural_network">/wiki/Neural_network</a></p>
      </div>
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