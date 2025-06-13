import dynamic from 'next/dynamic';

// Use ssr: false to disable server-side rendering which can help avoid SSR issues
const LazyContainers = {
    ArticlePage: dynamic(() => import('./ArticlePage'), {ssr: true }),
    BasePage: dynamic(() => import('./BasePage'), {ssr: true }),
    HomePage: dynamic(() => import('./HomePage'), {ssr: true }),
    NotFoundPage: dynamic(() => import('./NotFoundPage'), {ssr: true }),
    PasswordProtectedPage: dynamic(() => import('./PasswordProtectedPage'), {ssr: true }),
    PureHtmlPage: dynamic(() => import('./PureHtmlPage'), {ssr: true }),
    AboutPage: dynamic(() => import('./AboutPage'), {ssr: true }),
    // Wiki containers
    WikiIndexPage: dynamic(() => import('./WikiIndexPage'), {ssr: true }),
    WikiArticlePage: dynamic(() => import('./WikiArticlePage'), {ssr: true }),
    WikiSearchResults: dynamic(() => import('../components/WikiSearchResults/WikiSearchResults'), {ssr: true }),
    // Learning resources containers
    LearningResourcesIndexPage: dynamic(() => import('./LearningResourcesIndexPage'), {ssr: true }),
    LearningResourceDetailPage: dynamic(() => import('./LearningResourcePage'), {ssr: true }),
    // Posts containers
    PostsIndexPage: dynamic(() => import('./PostsIndexPage'), {ssr: true }),
    PostPage: dynamic(() => import('./PostPage'), {ssr: true }),
    MyPostsPage: dynamic(() => import('./MyPostsPage'), {ssr: true })
};

export default LazyContainers;
