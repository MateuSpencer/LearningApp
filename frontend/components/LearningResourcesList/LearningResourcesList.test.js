import { render } from '../../utils/test-utils';
import LearningResourcesList from './';
import { AuthProvider } from '../../context/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext';

// Mock the useLearningResources hook
jest.mock('../../hooks/useLearningResources', () => ({
  __esModule: true,
  default: () => ({
    resources: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 1,
    filters: {},
    sortBy: 'quality_vote_sum',
    sortDirection: 'desc',
    loading: false,
    error: null,
    fetchResources: jest.fn(),
    createAssociation: jest.fn(),
    upvoteAssociation: jest.fn(),
    downvoteAssociation: jest.fn(),
    updateFilter: jest.fn(),
    updateFilters: jest.fn(),
    clearFilters: jest.fn(),
    updateSort: jest.fn(),
    goToPage: jest.fn(),
  }),
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

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

describe('<LearningResourcesList />', () => {
    it('Renders an empty LearningResourcesList', () => {
        render(
          <AllProviders>
            <LearningResourcesList />
          </AllProviders>
        );
    });
});
