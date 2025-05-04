import { render } from '@testing-library/react';
import WikiArticlePage from './';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { slug: 'test-page' },
    isReady: true,
    push: jest.fn(),
  }),
}));

// Mock the fetch function used by WikipediaPreview component
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ extract: 'Test Wikipedia extract' }),
  })
);

// Mock child components to simplify testing
jest.mock('../../components/WikipediaPreview', () => () => <div data-testid="wikipedia-preview" />);
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
    it('Renders an empty WikiArticlePage', () => {
        render(
          <AllProviders>
            <WikiArticlePage articleSlug="test-article" />
          </AllProviders>
        );
    });
});
