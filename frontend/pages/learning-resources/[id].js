import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

// Import LearningResourcePage dynamically
const LearningResourcePage = dynamic(() => import('../../containers/LearningResourcePage'), {
  loading: () => <p>Loading resource...</p>,
});

// Create default SEO object
const defaultProps = {
  componentProps: {
    seo: {
      seoHtmlTitle: 'Learning Resource | LearningApp',
      seoMetaDescription: 'View and interact with a learning resource on LearningApp',
      seoOgTitle: 'Learning Resource',
      seoOgDescription: 'View and interact with a learning resource on LearningApp',
      seoMetaRobots: {
        index: true,
        follow: true,
        value: 'index,follow'
      }
    }
  }
};

export default function ResourcePage() {
  const router = useRouter();
  const { id } = router.query;
  
  return <LearningResourcePage resourceId={id} {...defaultProps.componentProps} />;
}