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
    
    // Check if the slug contains problematic characters
    const problematicChars = ['\u2013', '\u2014', '\u2018', '\u2019', '\u201C', '\u201D', '\u201E', '\u00AB', '\u00BB'];
    const hasProblematicChars = problematicChars.some(char => slug.includes(char));
    
    // Special check for en dash which seems to be causing issues
    if (slug.includes('–')) {
      // Try a direct replacement of the en dash in the slug
      const fixedSlug = slug.split('–').join('-');
    }
    
    // Format the slug properly and navigate directly
    const formattedSlug = formatWikiSlug(slug);
    
    // Check if the formatted slug still contains an en dash
    if (formattedSlug.includes('–')) {
      
      // Try a direct replacement of the en dash as a last resort
      const fixedSlug = formattedSlug.split('–').join('-');
      
      const targetUrl = `/wiki/${fixedSlug}`;
      
      router.push({
        pathname: '/wiki/[slug]',
        query: { slug: fixedSlug },
      }, targetUrl);
      
      return; // Exit early to avoid double navigation
    }
    
    
    // Use the push method to navigate to the wiki page
    // We need to use router.push with "as" parameter to preserve special characters
    // First parameter is the internal route pattern, second is the URL displayed to the user
    const targetUrl = `/wiki/${formattedSlug}`;
    
    // Using the "as" parameter to handle special characters properly
    // Using the object syntax for better handling of special characters
    router.push({
      pathname: '/wiki/[slug]',
      query: { slug: formattedSlug },
    }, targetUrl);
  };
  
  return (
    <a 
      href={`/wiki/${formatWikiSlug(slug)}`} 
      onClick={handleClick}
      className={className}
      data-special-chars="preserved"
      data-original-slug={slug}
      data-has-en-dash={slug.includes('–') ? 'true' : 'false'}
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
