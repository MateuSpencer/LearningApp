import React from 'react';

// Mock implementation of ReactMarkdown for testing
const ReactMarkdown = ({ children, components = {} }) => {
  // Simple mock that renders the markdown as plain text in a div
  // In real tests, you might want to handle specific components if needed
  return React.createElement('div', { 'data-testid': 'react-markdown' }, children);
};

export default ReactMarkdown;
