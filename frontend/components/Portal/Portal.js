import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Portal component for rendering content outside the normal DOM hierarchy
 * Useful for dropdowns, modals, tooltips that need to appear above other content
 */
const Portal = ({ children, rootId = 'portal-root' }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Only run in browser environment
    setMounted(true);
    
    // Check if portal root exists, if not create it
    let portalRoot = document.getElementById(rootId);
    if (!portalRoot) {
      portalRoot = document.createElement('div');
      portalRoot.id = rootId;
      portalRoot.style.position = 'fixed';
      portalRoot.style.zIndex = '10000';
      portalRoot.style.top = '0';
      portalRoot.style.left = '0';
      portalRoot.style.width = '0';
      portalRoot.style.height = '0';
      document.body.appendChild(portalRoot);
    }
    
    return () => {
      // If we created this portalRoot and there are no other portals using it,
      // we can clean it up when this component unmounts
      if (portalRoot && portalRoot.childElementCount <= 1) {
        document.body.removeChild(portalRoot);
      }
    };
  }, [rootId]);
  
  // Don't render anything on the server
  if (!mounted) return null;
  
  // On the client, create a portal to the target element
  return createPortal(
    children,
    document.getElementById(rootId)
  );
};

export default Portal;
