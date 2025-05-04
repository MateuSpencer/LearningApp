import { render, /* screen */ } from '@testing-library/react';
import LearningResourcePage from './';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
// import data from './LearningResourcePage.data';

// Wrapper component with all required providers
const AllProviders = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
};

describe('<LearningResourcePage />', () => {
    it('Renders an empty LearningResourcePage', () => {
        render(
          <AllProviders>
            <LearningResourcePage />
          </AllProviders>
        );
    });

    // it('Renders LearningResourcePage with data', () => {
    //     const { container } = render(<LearningResourcePage {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});
