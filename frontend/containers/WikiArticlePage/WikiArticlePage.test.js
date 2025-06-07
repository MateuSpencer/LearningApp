import { render, waitFor } from '../../utils/test-utils';
import WikiArticlePage from './';

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

// Mock the fetchWikipediaArticle function
jest.mock('../../utils/wikiUtils', () => ({
  fetchWikipediaArticle: jest.fn(),
}));

// Mock child components to simplify testing
jest.mock('../../components/WikipediaPreview', () => {
  const actual = jest.requireActual('../../components/WikipediaPreview');
  return actual.default; // Use the actual component to test the onArticleNotFound callback
});
jest.mock('../../components/RightSidebar', () => ({ onToggle }) => <div data-testid="right-sidebar" />);
jest.mock('../../components/PostsList', () => ({ pageSlug }) => <div data-testid="posts-list" />);
jest.mock('../../components/LearningResourcesList', () => ({ pageSlug }) => <div data-testid="resources-list" />);

describe('<WikiArticlePage />', () => {
    let mockFetchWikipediaArticle;

    beforeEach(() => {
        // Get the mock function
        mockFetchWikipediaArticle = require('../../utils/wikiUtils').fetchWikipediaArticle;
        mockRouterPush.mockClear();
        mockFetchWikipediaArticle.mockClear();
    });

    it('Renders an empty WikiArticlePage', () => {
        // Mock successful article fetch
        mockFetchWikipediaArticle.mockResolvedValue({
            summaryData: { extract: 'Test content' },
            isDisambiguation: false,
            error: null
        });

        render(<WikiArticlePage articleSlug="test-article" />);
    });

    it('Redirects to main wiki page with query when article does not exist', async () => {
        // Mock article not found
        mockFetchWikipediaArticle.mockResolvedValue({
            summaryData: null,
            isDisambiguation: false,
            error: 'Article not found'
        });
        
        render(<WikiArticlePage articleSlug="non-existent-article" />);

        // Wait for the redirect to happen
        await waitFor(() => {
            expect(mockRouterPush).toHaveBeenCalledWith({
                pathname: '/wiki',
                query: { q: 'non-existent-article' }
            });
        });
    });
});
