import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './';
import * as allauth from '../../lib/allauth';
import { mockRouter, mockConfigData } from '../../utils/test-auth-utils';

// Mock the Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

// Mock allauth functions
jest.mock('../../lib/allauth', () => ({
  login: jest.fn(),
  getConfig: jest.fn().mockResolvedValue({ 
    status: 200, 
    data: { 
      account: { login_by_code_enabled: true },
      socialaccount: { providers: [] }
    }
  })
}));

describe('<Login />', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup Next.js router mock
    const useRouter = require('next/router').useRouter;
    useRouter.mockImplementation(() => mockRouter());
  });

  it('renders login form correctly', () => {
    render(<Login />);
    
    // Check for key elements
    expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByText(/No account\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign up here/i)).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    // Mock successful login response
    allauth.login.mockResolvedValue({ status: 200 });
    
    render(<Login />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Email/i), { 
      target: { value: 'test@example.com' } 
    });
    
    fireEvent.change(screen.getByLabelText(/Password:/i), { 
      target: { value: 'password123' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    
    // Verify login was called with correct parameters
    await waitFor(() => {
      expect(allauth.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('handles login errors', async () => {
    // Mock failed login response
    allauth.login.mockResolvedValue({ 
      status: 400, 
      errors: [{ message: 'Invalid credentials' }] 
    });
    
    render(<Login />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Email/i), { 
      target: { value: 'test@example.com' } 
    });
    
    fireEvent.change(screen.getByLabelText(/Password:/i), { 
      target: { value: 'wrong_password' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    
    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('displays login code option when enabled', async () => {
    render(<Login />);
    
    await waitFor(() => {
      expect(screen.getByText(/Send me a sign-in code/i)).toBeInTheDocument();
    });
  });
});