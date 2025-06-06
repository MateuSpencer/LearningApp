import { useState, useEffect } from 'react';
import { getPublicViewData } from '../api/wagtail';
import LazyContainers from '../containers/LazyContainers';
import { basePageWrap } from '../containers/BasePage';
import NotFoundPage from '../containers/NotFoundPage';

function DynamicNotFoundPage() {
    // 404 does not support getServerSideProps, must fetch client side data
    // https://github.com/vercel/next.js/blob/master/errors/404-get-initial-props.md
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        async function fetchData() {
            try {
                const { json: pageData } = await getPublicViewData('404');
                setData(pageData);
            } catch (error) {
                console.error('Failed to load 404 page data:', error);
                // If we can't load the dynamic data, we'll show the fallback UI
                setData(null);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // Show loading state briefly
    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '50vh',
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
                <div>Loading...</div>
            </div>
        );
    }

    // If we have dynamic data, use it
    if (data && data.componentName) {
        const Component = LazyContainers[data.componentName];
        if (Component) {
            try {
                return <Component {...data.componentProps} />;
            } catch (error) {
                console.error(`Error rendering 404 component ${data.componentName}:`, error);
                // Fall through to default NotFoundPage
            }
        } else {
            console.error(`Component ${data.componentName} not found in LazyContainers`);
        }
    }

    // Fallback to our NotFoundPage component
    return <NotFoundPage />;
}

// Wrap the component with basePageWrap to inherit the base page structure
export default basePageWrap(DynamicNotFoundPage);

/*
// For static routing
export async function getStaticProps({ params, preview, previewData }) {
  const pageData = await getViewData('404');
  return { props: pageData }
}
*/
