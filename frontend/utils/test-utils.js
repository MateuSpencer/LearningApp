// Test utilities for wrapping components with all necessary providers
import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '../context/ThemeContext';
import { CSRFTokenProvider } from '../context/CSRFTokenContext';

// Custom render function that wraps component with all necessary providers
export function renderWithProviders(ui, options = {}) {
  const Wrapper = ({ children }) => (
    <ThemeProvider>
      <CSRFTokenProvider>
        {children}
      </CSRFTokenProvider>
    </ThemeProvider>
  );
  
  return render(ui, { wrapper: Wrapper, ...options });
}

// Export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { renderWithProviders as render };