import dynamic from 'next/dynamic';

// Use the loading option to provide a fallback while the component is loading
const loadingComponent = () => <div>Loading...</div>;

// Use ssr: false to disable server-side rendering which can help avoid SSR issues
const LazyContainers = {
    ArticlePage: dynamic(() => import('./ArticlePage'), { loading: loadingComponent, ssr: true }),
    BasePage: dynamic(() => import('./BasePage'), { loading: loadingComponent, ssr: true }),
    HomePage: dynamic(() => import('./HomePage'), { loading: loadingComponent, ssr: true }),
    NotFoundPage: dynamic(() => import('./NotFoundPage'), { loading: loadingComponent, ssr: true }),
    PasswordProtectedPage: dynamic(() => import('./PasswordProtectedPage'), { loading: loadingComponent, ssr: true }),
    PureHtmlPage: dynamic(() => import('./PureHtmlPage'), { loading: loadingComponent, ssr: true }),
    AboutPage: dynamic(() => import('./AboutPage'), { loading: loadingComponent, ssr: true }),
    // Wiki containers
    WikiIndexPage: dynamic(() => import('./WikiIndexPage'), { loading: loadingComponent, ssr: true }),
    WikiArticlePage: dynamic(() => import('./WikiArticlePage'), { loading: loadingComponent, ssr: true }),
    WikiSearchResults: dynamic(() => import('../components/WikiSearchResults/WikiSearchResults'), { loading: loadingComponent, ssr: true }),
    // Learning resources containers
    LearningResourcesIndexPage: dynamic(() => import('./LearningResourcesIndexPage'), { loading: loadingComponent, ssr: true }),
    LearningResourceDetailPage: dynamic(() => import('./LearningResourcePage'), { loading: loadingComponent, ssr: true }),
    // Posts containers
    PostsIndexPage: dynamic(() => import('./PostsIndexPage'), { loading: loadingComponent, ssr: true }),
    PostPage: dynamic(() => import('./PostPage'), { loading: loadingComponent, ssr: true }),
    MyPostsPage: dynamic(() => import('./MyPostsPage'), { loading: loadingComponent, ssr: true })
};

export default LazyContainers;
