import React, { useState } from 'react';
import { basePageWrap } from '../BasePage';
import PostsList from '../../components/PostsList';
import s from './UserPostsPage.module.css';

const UserPostsPage = () => {
  const [sortBy, setSortBy] = useState('newest');
  const [filterType, setFilterType] = useState('all');

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
  };

  return (
    <div className={s.container}>
      <h1 className={s.title}>My Posts</h1>
      
      <div className={s.controlPanel}>
        <div className={s.filterContainer}>
          <label className={s.filterLabel}>Filter by:</label>
          <select 
            className={s.filterSelect} 
            value={filterType} 
            onChange={handleFilterChange}
          >
            <option value="all">All Posts</option>
            <option value="published">Published</option>
            <option value="drafts">Drafts</option>
          </select>
        </div>
        
        <div className={s.sortContainer}>
          <label className={s.sortLabel}>Sort by:</label>
          <select 
            className={s.sortSelect} 
            value={sortBy} 
            onChange={handleSortChange}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
      </div>
      
      <div className={s.postsListContainer}>
        <PostsList 
          showOnlyMyPosts={true} 
          sortBy={sortBy}
          filterType={filterType}
        />
      </div>
    </div>
  );
};

export default basePageWrap(UserPostsPage);