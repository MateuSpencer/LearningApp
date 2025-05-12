import React from 'react';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import { formatWikiSlug } from '../../utils/wikiUtils';

/**
 * Custom link component for direct navigation to wiki pages
 * Works around middleware issues with Next.js dynamic routes
 */
const WikiLink = ({ slug, className, children }) => {
  const router = useRouter();
  
  const handleClick = (e) => {
    e.preventDefault();
    
    // Format the slug properly and navigate directly
    const formattedSlug = formatWikiSlug(slug);
    
    // Use the push method to navigate to the wiki page
    // Do NOT encode the URL to preserve special characters in the path
    router.push(`/wiki/${formattedSlug}`);
  };
  
  return (
    <a 
      href={`/wiki/${formatWikiSlug(slug)}`} 
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
};

WikiLink.propTypes = {
  slug: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

export default WikiLink;
