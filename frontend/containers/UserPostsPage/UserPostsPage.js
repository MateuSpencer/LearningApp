import React from 'react';
import { basePageWrap } from '../BasePage';
import PostsList from '../../components/PostsList';
import { useTranslation } from '../../hooks/useTranslation';
import s from './UserPostsPage.module.css';

const UserPostsPage = () => {
  const { t } = useTranslation();
  
  return (
    <div className={s.container}>
      <h1 className={s.title}>{t('posts.myPosts')}</h1>
      
      <div className={s.postsListContainer}>
        <PostsList 
          showOnlyMyPosts={true}
          allowedFilters={['status', 'timeframe', 'search', 'language']}
          allowedSortFields={['votes_score', 'created_at', 'updated_at', 'title', 'status']}
        />
      </div>
    </div>
  );
};

export default basePageWrap(UserPostsPage);