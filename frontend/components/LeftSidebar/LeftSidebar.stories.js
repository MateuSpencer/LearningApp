/* global module */

import React from 'react';
import LeftSidebar from './LeftSidebar';
import data from './LeftSidebar.data';

const LeftSidebarStory = {
    title: 'Components/LeftSidebar',
    component: LeftSidebar,
};
export default LeftSidebarStory;

export const LeftSidebarWithData = () => <LeftSidebar {...data} />;
export const LeftSidebarWithoutData = () => <LeftSidebar />;
