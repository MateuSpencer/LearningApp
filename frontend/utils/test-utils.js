// Test utilities for wrapping components with all necessary providers
import React from 'react';
import { render } from '@testing-library/react';
import { MockAuthProvider, mockAuthData, mockConfigData } from './test-auth-utils';

/**
 * Custom render function that includes auth context
 * @param {React.ReactNode} ui - Component to render
 * @param {Object} options - Render options
 * @param {Object} options.authState - Auth state to use in context
 * @param {Object} options.configState - Config state to use in context
 * @param {Object} options.renderOptions - Additional render options
 * @returns {Object} Rendered component
 */
const customRender = (
  ui,
  {
    authState = mockAuthData.authenticated,
    configState = mockConfigData,
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => (
    <MockAuthProvider authState={authState} configState={configState}>
      {children}
    </MockAuthProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override render method with our custom implementation
export { customRender as render };