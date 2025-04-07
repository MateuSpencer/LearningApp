/* global module */

import React from 'react';
import RightSidebar from './RightSidebar';
import data from './RightSidebar.data';

const RightSidebarStory = {
    title: 'Components/RightSidebar',
    component: RightSidebar,
};
export default RightSidebarStory;

export const RightSidebarWithData = () => <RightSidebar {...data} />;
export const RightSidebarWithoutData = () => <RightSidebar />;