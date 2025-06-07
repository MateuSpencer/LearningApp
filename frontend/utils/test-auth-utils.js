import React from 'react';
import { render } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

// Mock authentication data for testing
export const mockAuthData = {
  authenticated: {
    isAuthenticated: true,
    user: {
      username: 'testuser',
      email: 'test@example.com',
    },
    isLoading: false,
    error: null,
    refreshAuth: () => {},
  },
  unauthenticated: {
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
    refreshAuth: () => {},
  },
  loading: {
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
    refreshAuth: () => {},
  },
  error: {
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: 'Authentication error',
    refreshAuth: () => {},
  }
};

// Custom render function with authentication state
const renderWithAuth = (ui, { authState = mockAuthData.unauthenticated, ...options } = {}) => {
  const MockAuthProvider = ({ children }) => {
    return (
      <AuthProvider value={authState}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AuthProvider>
    );
  };
  
  return render(ui, { wrapper: MockAuthProvider, ...options });
};

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override the render method
export { renderWithAuth as render };