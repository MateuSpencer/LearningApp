import React from 'react';
import { render } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

// Custom render function that wraps components with all necessary providers
const customRender = (ui, options = {}) => {
  const AllProviders = ({ children }) => {
    return (
      <AuthProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AuthProvider>
    );
  };
  
  return render(ui, { wrapper: AllProviders, ...options });
};

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override the render method
export { customRender as render };