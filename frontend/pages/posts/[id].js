import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

// Import PostPage dynamically
const PostPage = dynamic(() => import('../../containers/PostPage'), {
  loading: () => <p>Loading post...</p>,
});

// Create default SEO object
const defaultProps = {
  componentProps: {
    seo: {
      seoHtmlTitle: 'Post | LearningApp',
      seoMetaDescription: 'View and interact with a post on LearningApp',
      seoOgTitle: 'Post',
      seoOgDescription: 'View and interact with a post on LearningApp',
      seoMetaRobots: {
        index: true,
        follow: true,
        value: 'index,follow'
      }
    }
  }
};

export default function SinglePostPage() {
  const router = useRouter();
  const { id } = router.query;
  
  return <PostPage postId={id} {...defaultProps.componentProps} />;
}
