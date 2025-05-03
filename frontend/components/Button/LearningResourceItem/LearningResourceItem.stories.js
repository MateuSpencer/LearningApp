/* global module */

import React from 'react';
import LearningResourceItem from './LearningResourceItem';
import data from './LearningResourceItem.data';

const LearningResourceItemStory = {
    title: 'Components/LearningResourceItem',
    component: LearningResourceItem,
};
export default LearningResourceItemStory;

export const LearningResourceItemWithData = () => <LearningResourceItem {...data} />;
export const LearningResourceItemWithoutData = () => <LearningResourceItem />;
