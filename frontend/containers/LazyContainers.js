import dynamic from 'next/dynamic';

export default {
    ArticlePage: dynamic(() => import('./ArticlePage')),
    BasePage: dynamic(() => import('./BasePage')),
    HomePage: dynamic(() => import('./HomePage')),
    NotFoundPage: dynamic(() => import('./NotFoundPage')),
    PasswordProtectedPage: dynamic(() => import('./PasswordProtectedPage')),
    PureHtmlPage: dynamic(() => import('./PureHtmlPage')),
    AboutPage: dynamic(() => import('./AboutPage')),
    // Wiki containers
    WikiIndexPage: dynamic(() => import('./WikiIndexPage')),
    WikiArticlePage: dynamic(() => import('./WikiArticlePage')),
    // User content containers
    UserPostsPage: dynamic(() => import('./UserPostsPage'))
};
