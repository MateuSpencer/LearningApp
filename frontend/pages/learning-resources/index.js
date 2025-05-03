import React from 'react';
import dynamic from 'next/dynamic';

// Create container for the Learning Resources index page
const LearningResourcesIndexPage = dynamic(() => import('../../containers/LearningResourcesIndexPage'), {
  loading: () => <p>Loading learning resources...</p>,
});

// Create default SEO object
const defaultProps = {
  componentProps: {
    seo: {
      seoHtmlTitle: 'Learning Resources | LearningApp',
      seoMetaDescription: 'Browse and discover learning resources for various topics',
      seoOgTitle: 'Learning Resources',
      seoOgDescription: 'Browse and discover learning resources for various topics',
      seoMetaRobots: {
        index: true,
        follow: true,
        value: 'index,follow'
      }
    }
  }
};

export default function LearningResourcesPage() {
  return <LearningResourcesIndexPage {...defaultProps.componentProps} />;
}