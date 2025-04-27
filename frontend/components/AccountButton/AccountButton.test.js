import { render, screen } from '@testing-library/react';
import AccountButton from './';
import { mockAuthData } from '../../utils/test-auth-utils';

describe('<AccountButton />', () => {
    it('Renders for authenticated user', () => {
        render(<AccountButton />, { 
            authState: mockAuthData.authenticated 
        });
        
        // Check that username is displayed
        expect(screen.getByText('testuser')).toBeInTheDocument();
        
        // Verify the link points to the password change screen for authenticated users
        const link = screen.getByRole('link', { name: /Account \(testuser\)/ });
        expect(link).toHaveAttribute('href', '/account/password/change');
    });

    it('Renders for unauthenticated user', () => {
        render(<AccountButton />, { 
            authState: mockAuthData.unauthenticated 
        });
        
        // Verify username is not displayed
        expect(screen.queryByText('testuser')).not.toBeInTheDocument();
        
        // Verify the link points to the login screen for unauthenticated users
        const link = screen.getByRole('link', { name: /Login/ });
        expect(link).toHaveAttribute('href', '/account/login');
    });
});
