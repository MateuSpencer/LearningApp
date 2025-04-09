/* global module */

import React from 'react';
import WikipediaPreview from './WikipediaPreview';
import data from './WikipediaPreview.data';

const WikipediaPreviewStory = {
    title: 'Components/WikipediaPreview',
    component: WikipediaPreview,
};
export default WikipediaPreviewStory;

export const WikipediaPreviewWithData = () => <WikipediaPreview {...data} />;
export const WikipediaPreviewWithoutData = () => <WikipediaPreview />;
