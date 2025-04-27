import React from 'react';
import { render } from '@testing-library/react';
import { AuthContext } from '../auth/AuthContext';

// Mock authenticated state
export const mockAuthenticatedState = (userData = {}) => ({
  auth: {
    status: 200,
    data: {
      user: {
        id: 1,
        email: 'user@example.com',
        username: 'testuser',
        ...userData
      },
      flows: []
    },
    meta: {
      is_authenticated: true
    }
  },
  config: {
    status: 200,
    data: {
      account: {
        login_by_code_enabled: true,
        email_verification_required: true
      },
      socialaccount: {
        providers: []
      }
    }
  }
});

// Mock unauthenticated state
export const mockUnauthenticatedState = () => ({
  auth: {
    status: 401,
    data: {
      flows: [
        { id: 'login', is_pending: false }
      ]
    },
    meta: {
      is_authenticated: false
    }
  },
  config: {
    status: 200,
    data: {
      account: {
        login_by_code_enabled: true,
        email_verification_required: true
      },
      socialaccount: {
        providers: []
      }
    }
  }
});

// Mock configuration data
export const mockConfigData = (overrides = {}) => ({
  status: 200,
  data: {
    account: {
      login_by_code_enabled: true,
      email_verification_required: true,
      ...overrides.account
    },
    socialaccount: {
      providers: [],
      ...overrides.socialaccount
    },
    ...overrides.data
  }
});

// Mock Next.js router
export const mockRouter = (props = {}) => ({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  reload: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  ...props
});

// Wrapper component with auth context for testing
export const renderWithAuth = (ui, { authState = mockAuthenticatedState(), ...options } = {}) => {
  const Wrapper = ({ children }) => (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// Wrapper component with unauthenticated context for testing
export const renderWithoutAuth = (ui, options = {}) => {
  return renderWithAuth(ui, { authState: mockUnauthenticatedState(), ...options });
};

// Helper to create a pending flow state
export const createPendingFlowState = (flowId, flowData = {}) => {
  const authState = mockUnauthenticatedState();
  authState.auth.data.flows = [
    { id: flowId, is_pending: true, ...flowData }
  ];
  return authState;
};