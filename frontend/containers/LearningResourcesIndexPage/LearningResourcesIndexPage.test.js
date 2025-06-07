import { render, /* screen */ } from '../../utils/test-utils';
import LearningResourcesIndexPage from './';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
// import data from './LearningResourcesIndexPage.data';

// Wrapper component that provides all required providers
const AllProviders = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
};

describe('<LearningResourcesIndexPage />', () => {
    it('Renders an empty LearningResourcesIndexPage', () => {
        render(
          <AllProviders>
            <LearningResourcesIndexPage />
          </AllProviders>
        );
    });

    // it('Renders LearningResourcesIndexPage with data', () => {
    //     const { container } = render(<LearningResourcesIndexPage {...data} />);
    //     expect(container).toMatchSnapshot();
    // });
});
