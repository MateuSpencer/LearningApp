import React from 'react';
import Head from 'next/head';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';
import LeftSidebar from '../../components/LeftSidebar';
import s from './BasePage.module.css';

const WagtailUserbar = dynamic(() => import('../../components/WagtailUserbar'));

const BasePage = ({ children, seo, shouldRenderSeo, wagtailUserbar }) => {
    const {
        seoHtmlTitle,
        seoMetaDescription,
        seoOgTitle,
        seoOgDescription,
        seoOgUrl,
        seoOgImage,
        seoOgType,
        seoTwitterTitle,
        seoTwitterDescription,
        seoTwitterUrl,
        seoTwitterImage,
        seoMetaRobots,
        canonicalLink,
    } = seo;
    
    return (
        <>
            {shouldRenderSeo && (
                <Head>
                    <title>{seoHtmlTitle}</title>
                    {/* ...other meta tags */}
                </Head>
            )}
            <div className={s.pageLayout}>
                <div className={s.leftSidebar}>
                    <LeftSidebar items={[]} />
                </div>
                <main className={s.mainContent}>
                    {children}
                </main>
            </div>
            {!!wagtailUserbar && <WagtailUserbar {...wagtailUserbar} />}
        </>
    );
};

BasePage.defaultProps = {
    seo: {},
    shouldRenderSeo: true,
};

BasePage.propTypes = {
    children: PropTypes.node,
    seo: PropTypes.shape({
        seoHtmlTitle: PropTypes.string,
        seoMetaDescription: PropTypes.string,
        seoOgTitle: PropTypes.string,
        seoOgDescription: PropTypes.string,
        seoOgUrl: PropTypes.string,
        seoOgImage: PropTypes.string,
        seoOgType: PropTypes.string,
        seoTwitterTitle: PropTypes.string,
        seoTwitterDescription: PropTypes.string,
        seoTwitterUrl: PropTypes.string,
        seoTwitterImage: PropTypes.string,
        seoMetaRobots: PropTypes.shape({
            index: PropTypes.bool,
            follow: PropTypes.bool,
            value: PropTypes.string,
        }),
        canonicalLink: PropTypes.string,
    }),
    shouldRenderSeo: PropTypes.bool,
    wagtailUserbar: PropTypes.shape({
        html: PropTypes.string,
    }),
};

export default BasePage;