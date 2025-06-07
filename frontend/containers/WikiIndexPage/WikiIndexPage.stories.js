/* global module */

import React from 'react';
import WikiIndexPage from './WikiIndexPage';
import data from './WikiIndexPage.data';

const WikiIndexPageStory = {
    title: 'Containers/WikiIndexPage',
    component: WikiIndexPage,
};
export default WikiIndexPageStory;

export const WikiIndexPageWithData = () => <WikiIndexPage {...data} />;
export const WikiIndexPageWithoutData = () => <WikiIndexPage />;
