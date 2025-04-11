import React from 'react';
import dynamic from 'next/dynamic';

// Import AccountPage component dynamically to match pattern used in other pages
const AccountPage = dynamic(() => import('../containers/AccountPage'), {
  loading: () => <p>Loading account page...</p>,
});

// Create default seo object to prevent the destructuring error
const defaultProps = {
  componentProps: {
    seo: {
      seoHtmlTitle: 'My Account | LearningApp',
      seoMetaDescription: 'Manage your LearningApp account',
      seoOgTitle: 'My Account',
      seoOgDescription: 'Manage your LearningApp account',
      seoMetaRobots: {
        index: true,
        follow: true,
        value: 'index,follow'
      }
    }
  }
};

export default function Account() {
  return <AccountPage {...defaultProps.componentProps} />;
}