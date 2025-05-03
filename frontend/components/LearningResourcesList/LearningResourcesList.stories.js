/* global module */

import React from 'react';
import LearningResourcesList from './LearningResourcesList';
import data from './LearningResourcesList.data';

const LearningResourcesListStory = {
    title: 'Components/LearningResourcesList',
    component: LearningResourcesList,
};
export default LearningResourcesListStory;

export const LearningResourcesListWithData = () => <LearningResourcesList {...data} />;
export const LearningResourcesListWithoutData = () => <LearningResourcesList />;
