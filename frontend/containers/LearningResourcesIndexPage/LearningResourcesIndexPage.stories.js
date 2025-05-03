/* global module */

import React from 'react';
import LearningResourcesIndexPage from './LearningResourcesIndexPage';
import data from './LearningResourcesIndexPage.data';

const LearningResourcesIndexPageStory = {
    title: 'Containers/LearningResourcesIndexPage',
    component: LearningResourcesIndexPage,
};
export default LearningResourcesIndexPageStory;

export const LearningResourcesIndexPageWithData = () => <LearningResourcesIndexPage {...data} />;
export const LearningResourcesIndexPageWithoutData = () => <LearningResourcesIndexPage />;
