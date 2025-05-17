import React from 'react';
import { basePageWrap } from '../BasePage';
import PostsList from '../../components/PostsList';
import s from './MyPostsPage.module.css';

const MyPostsPage = () => {
  return (
    <div className={s.container}>
      <h1 className={s.title}>My Posts</h1>
      
      <div className={s.postsListContainer}>
        <PostsList 
          showOnlyMyPosts={true}
          allowedFilters={['status', 'timeframe', 'search']}
          allowedSortFields={['votes_score', 'created_at', 'updated_at', 'title', 'status']}
        />
      </div>
    </div>
  );
};

export default basePageWrap(MyPostsPage);
