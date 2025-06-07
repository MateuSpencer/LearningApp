/* global module */

import React from 'react';
import AIResourceSummaryButton from './AIResourceSummaryButton';
import data from './AIResourceSummaryButton.data';

const AIResourceSummaryButtonStory = {
    title: 'Components/AIResourceSummaryButton',
    component: AIResourceSummaryButton,
};
export default AIResourceSummaryButtonStory;

export const AIResourceSummaryButtonWithData = () => <AIResourceSummaryButton {...data} />;
export const AIResourceSummaryButtonWithoutData = () => <AIResourceSummaryButton />;
