import querystring from 'querystring';
import {
    getPage,
    getRedirect,
    getAllPages,
    WagtailApiResponseError,
} from '../api/wagtail';
import LazyContainers from '../containers/LazyContainers';

const isProd = process.env.NODE_ENV === 'production';

export default function CatchAllPage({ componentName, componentProps }) {
    const Component = LazyContainers[componentName];
    if (!Component) {
        return <h1>Component {componentName} not found</h1>;
    }
    return <Component {...componentProps} />;
}

// For SSR
export async function getServerSideProps({ req, params, res }) {
    let path = params?.path || [];
    path = path.join('/');
    
    // Skip processing for authentication paths
    if (path.startsWith('accounts/')) {
        return { notFound: true };  // This will make Next.js pass the request to the server
    }

    const { host } = req.headers;
    let queryParams = new URL(req.url, `https://${host}`).search;
    if (queryParams.indexOf('?') === 0) {
        queryParams = queryParams.substr(1);
    }
    queryParams = querystring.parse(queryParams);

    queryParams = {
        ...queryParams,
        host,
    };

    // Try to serve page
    try {
        const {
            json: { componentName, componentProps, redirect, customResponse },
            headers,
        } = await getPage(path, queryParams, {
            headers: {
                cookie: req.headers.cookie,
            },
        });

        // Forward any cookie we encounter
        const cookies = headers.get('set-cookie');
        if (cookies) {
            res.setHeader('Set-Cookie', cookies);
        }

        if (customResponse) {
            const { body, body64, contentType } = customResponse;
            res.setHeader('Content-Type', contentType);
            res.statusCode = 200;
            res.write(body64 ? Buffer.from(body64, 'base64') : body);
            res.end();

            return { props: {} };
        }

        if (redirect) {
            const { destination, isPermanent } = redirect;
            return {
                redirect: {
                    destination: destination,
                    permanent: isPermanent,
                },
            };
        }

        // Check if it's a WikiArticlePage and validate if it exists on Wikipedia
        if (componentName === 'WikiArticlePage') {
            // Extract the article slug, ensuring we use unencoded special characters
            const articleSlug = path.startsWith('wiki/') ? path.substring(5) : path;
            const pageTitleForApi = componentProps.title || articleSlug.replace(/_/g, ' ');
            
            try {
                // Use MediaWiki API to check if page exists
                // encodeURIComponent is only used for the API request, not for our internal URLs
                const mediaWikiApiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(pageTitleForApi)}&origin=*`;
                const wikiResponse = await fetch(mediaWikiApiUrl, {
                    headers: {
                        'User-Agent': 'LearningApp/1.0 (contact@yourapp.com)' 
                    }
                });

                if (wikiResponse.ok) {
                    const wikiData = await wikiResponse.json();
                    
                    // Check if page is missing
                    const pages = wikiData.query?.pages || {};
                    const pageIds = Object.keys(pages);
                    
                    // If pageId is negative or page has "missing" attribute, it doesn't exist
                    const pageNotExistInWikipedia = pageIds.length === 0 || 
                                                  (pageIds.length === 1 && (pageIds[0] === '-1' || pages[pageIds[0]].hasOwnProperty('missing')));
                    
                    // First, check if content indicates this is a disambiguation page
                    const summaryText = componentProps.summary || '';
                    const pageTitleFromProps = componentProps.title || '';
                    const isDisambiguationPage = 
                        (typeof summaryText === 'string' && summaryText.toLowerCase().includes(' may refer to:')) || 
                        pageTitleFromProps.toLowerCase().endsWith('(disambiguation)') ||
                        (componentProps.content && typeof componentProps.content === 'string' && 
                         componentProps.content.toLowerCase().includes(' may refer to:'));
                    
                    if (pageNotExistInWikipedia || isDisambiguationPage) {
                        const pageTitle = isDisambiguationPage 
                            ? `Content Disambiguation: ${pageTitleForApi}` 
                            : `Wiki Page Not Found: ${pageTitleForApi}`;
                            
                        const searchDescription = isDisambiguationPage
                            ? `The page titled "${pageTitleForApi}" may refer to multiple topics. Please clarify your search.`
                            : `The wiki page titled "${pageTitleForApi}" could not be found on Wikipedia.`;
                        
                        // Redirect to main wiki page with query parameter instead of showing a not found page
                        return {
                            redirect: {
                                destination: `/wiki?q=${encodeURIComponent(pageTitleForApi)}`,
                                permanent: false,
                            },
                        };
                    }
                } else {
                    // Log API errors but proceed with caution
                    // Removed console.warn
                }
            } catch (apiError) {
                // Removed console.error
                // Continue to render the page if there's an API error, but log it
            }
        }

        return { props: { componentName, componentProps } };
    } catch (err) {
        if (err instanceof WagtailApiResponseError) {
            if (err.response.status === 404) {
                // Hard 404 from API (our backend)
                // Define paths that should be treated as Wiki article paths
                const isLikelyWikiArticlePath =
                    (path.startsWith('wiki/') && path !== 'wiki/index') ||
                    // Don't treat certain paths as wiki paths
                    (!['community-posts', 'learning-resources', 'my-posts'].includes(path) &&
                     !path.includes('/') && path !== '' && !path.startsWith('accounts/')) || // check for top-level paths
                    (path.length <= 5 && !path.includes('/') && path !== '' &&
                     !['community-posts', 'learning-resources', 'my-posts'].includes(path)); // Short paths like 'cla' are likely attempts at wiki paths

                if (isLikelyWikiArticlePath) {
                    const attemptedTitle = (path.startsWith('wiki/') ? path.substring(5) : path).replace(/_/g, ' ');
                    
                    try {
                        // Double-check with Wikipedia API if this page exists
                        const mediaWikiApiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(attemptedTitle)}&origin=*`;
                        const wikiResponse = await fetch(mediaWikiApiUrl, {
                            headers: {
                                'User-Agent': 'LearningApp/1.0 (contact@yourapp.com)'
                            }
                        });
                        
                        if (wikiResponse.ok) {
                            const wikiData = await wikiResponse.json();
                            const pages = wikiData.query?.pages || {};
                            const pageIds = Object.keys(pages);
                            
                            // If pageId is negative or page has "missing" attribute, it doesn't exist
                            const pageNotExistInWikipedia = pageIds.length === 0 || 
                                                          (pageIds.length === 1 && (pageIds[0] === '-1' || pages[pageIds[0]].hasOwnProperty('missing')));
                            
                            // If the page exists on Wikipedia and is not a disambiguation page, redirect to the proper wiki path
                            if (!pageNotExistInWikipedia) {
                                // Try to get more info about the page to check if it's a disambiguation page
                                const pageMeta = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(attemptedTitle)}`, {
                                    headers: {
                                        'User-Agent': 'LearningApp/1.0 (contact@yourapp.com)'
                                    }
                                });
                                
                                if (pageMeta.ok) {
                                    const pageData = await pageMeta.json();
                                    const isDisambiguation = pageData.type === 'disambiguation' || 
                                                            (pageData.extract && pageData.extract.toLowerCase().includes('may refer to:'));
                                    
                                    if (!isDisambiguation) {
                                        return {
                                            redirect: {
                                                destination: `/wiki/${attemptedTitle.replace(/\s+/g, '_')}`,
                                                permanent: false,
                                            },
                                        };
                                    }
                                }
                            }
                        }
                    } catch (apiError) {
                        // Continue to show not found page if API fails
                    }
                    
                    // Redirect to main wiki page with query parameter instead of showing a not found page
                    return {
                        redirect: {
                            destination: `/wiki?q=${encodeURIComponent(attemptedTitle)}`,
                            permanent: false,
                        },
                    };
                }
                // For other 404s (e.g., non-wiki paths that 404 at the API level)
                return { notFound: true }; // Use Next.js default 404
            } else if (err.response.status >= 500) {
                // When in development, show django error page on error
                if (!isProd) {
                    const html = await err.response.text();
                    return {
                        props: {
                            componentName: 'PureHtmlPage',
                            componentProps: { html },
                        },
                    };
                }
                throw err; // Rethrow for production 500s to be handled by Next.js error page
            }
            // Other Wagtail API errors (e.g., 401, 403) - show generic not found
            return { notFound: true };
        } else {
            // Non-Wagtail API errors
            throw err;
        }
    }

    // Try to serve redirect
    try {
        const { json: redirect } = await getRedirect(path, queryParams, {
            headers: {
                cookie: req.headers.cookie,
            },
        });
        const { destination, isPermanent } = redirect;
        return {
            redirect: {
                destination: destination,
                permanent: isPermanent,
            },
        };
    } catch (err) {
        if (!(err instanceof WagtailApiResponseError)) {
            throw err;
        }

        if (err.response.status >= 500) {
            throw err;
        }
    }

    // Serve 404 page
    return { notFound: true };
}

// For SSG
/*
export async function getStaticProps({ params, preview, previewData }) {
    params = params || {};
    let path = params.path || [];
    path = path.join("/");

    const { json: pageData } = await getPage(path);
    return { props: pageData }
}

export async function getStaticPaths() {
    const { json: data } = await getAllPages();

    let htmlUrls = data.items.map(x => x.relativeUrl);
    htmlUrls = htmlUrls.filter(x => x);
    htmlUrls = htmlUrls.map(x => x.split("/"));
    htmlUrls = htmlUrls.map(x => x.filter(y => y))
    htmlUrls = htmlUrls.filter(x => x.length)

    const paths = htmlUrls.map(x => (
        { params: { path: x } }
    ));

    return {
        paths: paths,
        fallback: false,
    };
}
*/
