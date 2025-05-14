import React from 'react';
import dynamic from 'next/dynamic';

// Import CommunityPostsIndexPage component dynamically
const CommunityPostsIndexPage = dynamic(() => import('../containers/CommunityPostsIndexPage'), {
  loading: () => <p>Loading community posts...</p>,
});

// Create default SEO object
const defaultProps = {
  componentProps: {
    seo: {
      seoHtmlTitle: 'Community Posts | LearningApp',
      seoMetaDescription: 'Browse and discover posts shared by our community members',
      seoOgTitle: 'Community Posts',
      seoOgDescription: 'Browse and discover posts shared by our community members',
      seoMetaRobots: {
        index: true,
        follow: true,
        value: 'index,follow'
      }
    }
  }
};

export default function CommunityPostsPage() {
  return <CommunityPostsIndexPage {...defaultProps.componentProps} />;
}
