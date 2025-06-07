/* global module */

import React from 'react';
import WikiArticlePage from './WikiArticlePage';
import data from './WikiArticlePage.data';

const WikiArticlePageStory = {
    title: 'Containers/WikiArticlePage',
    component: WikiArticlePage,
};
export default WikiArticlePageStory;

export const WikiArticlePageWithData = () => <WikiArticlePage {...data} />;
export const WikiArticlePageWithoutData = () => <WikiArticlePage />;
