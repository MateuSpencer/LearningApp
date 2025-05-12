import { render, waitFor } from '@testing-library/react';
import WikiArticlePage from './';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';

// Mock push function to test redirects
const mockRouterPush = jest.fn();

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { slug: 'test-page' },
    isReady: true,
    push: mockRouterPush,
  }),
}));

// Variable to control mock fetch response
let mockFetchOk = true;

// Mock the fetch function used by WikipediaPreview component
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: mockFetchOk,
    json: () => Promise.resolve({ extract: 'Test Wikipedia extract' }),
  })
);

// Mock child components to simplify testing
jest.mock('../../components/WikipediaPreview', () => {
  const actual = jest.requireActual('../../components/WikipediaPreview');
  return actual.default; // Use the actual component to test the onArticleNotFound callback
});
jest.mock('../../components/RightSidebar', () => ({ onToggle }) => <div data-testid="right-sidebar" />);
jest.mock('../../components/PostsList', () => ({ pageSlug }) => <div data-testid="posts-list" />);
jest.mock('../../components/LearningResourcesList', () => ({ pageSlug }) => <div data-testid="resources-list" />);

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

describe('<WikiArticlePage />', () => {
    beforeEach(() => {
        mockFetchOk = true;
        mockRouterPush.mockClear();
    });

    it('Renders an empty WikiArticlePage', () => {
        render(
          <AllProviders>
            <WikiArticlePage articleSlug="test-article" />
          </AllProviders>
        );
    });

    it('Redirects to main wiki page with query when article does not exist', async () => {
        // Set the mock fetch to return not ok
        mockFetchOk = false;
        
        render(
          <AllProviders>
            <WikiArticlePage articleSlug="non-existent-article" />
          </AllProviders>
        );

        // Wait for the redirect to happen
        await waitFor(() => {
            expect(mockRouterPush).toHaveBeenCalledWith({
                pathname: '/wiki',
                query: { q: 'non-existent-article' }
            });
        });
    });
});
