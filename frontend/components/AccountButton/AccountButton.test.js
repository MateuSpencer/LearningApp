import React from 'react';
import { render, screen } from '@testing-library/react';
import AccountButton from './';
import AuthContext from '../../context/AuthContext';

// Mock authentication data
const mockAuthData = {
  authenticated: {
    isAuthenticated: true,
    user: {
      username: 'testuser'
    },
    isLoading: false,
    error: null,
    refreshAuth: jest.fn()
  },
  unauthenticated: {
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
    refreshAuth: jest.fn()
  }
};

// Custom render with auth context
const renderWithAuth = (ui, authState) => {
  return render(
    <AuthContext.Provider value={authState}>
      {ui}
    </AuthContext.Provider>
  );
};

describe('<AccountButton />', () => {
  it('Renders for authenticated user', () => {
    const { container } = renderWithAuth(<AccountButton />, mockAuthData.authenticated);
    
    // Verify the correct icon is displayed
    expect(screen.getByText('👤')).toBeTruthy();
    
    // Verify it's a link
    const link = container.querySelector('a');
    expect(link).toBeTruthy();
  });

  it('Renders for unauthenticated user', () => {
    const { container } = renderWithAuth(<AccountButton />, mockAuthData.unauthenticated);
    
    // Verify the correct icon is displayed
    expect(screen.getByText('🔑')).toBeTruthy();
    
    // Verify it's a link
    const link = container.querySelector('a');
    expect(link).toBeTruthy();
  });
});
