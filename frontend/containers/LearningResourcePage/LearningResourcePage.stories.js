/* global module */

import React from 'react';
import LearningResourcePage from './LearningResourcePage';
import data from './LearningResourcePage.data';

const LearningResourcePageStory = {
    title: 'Containers/LearningResourcePage',
    component: LearningResourcePage,
};
export default LearningResourcePageStory;

export const LearningResourcePageWithData = () => <LearningResourcePage {...data} />;
export const LearningResourcePageWithoutData = () => <LearningResourcePage />;
