import React from 'react';
import dynamic from 'next/dynamic';
import { withAuthProtection } from '../utils/withAuth';

// Import UserPostsPage component dynamically to match pattern used in other pages
const UserPostsPage = dynamic(() => import('../containers/UserPostsPage'), {
  loading: () => <p>Loading my posts...</p>,
});

// Create default seo object
const defaultProps = {
  componentProps: {
    seo: {
      seoHtmlTitle: 'My Posts | LearningApp',
      seoMetaDescription: 'View and manage your posts on LearningApp',
      seoOgTitle: 'My Posts',
      seoOgDescription: 'View and manage your posts on LearningApp',
      seoMetaRobots: {
        index: true,
        follow: true,
        value: 'index,follow'
      }
    }
  }
};

export const getServerSideProps = withAuthProtection();

export default function MyPosts() {
  return <UserPostsPage {...defaultProps.componentProps} />;
}