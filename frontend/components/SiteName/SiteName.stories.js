/* global module */

import React from 'react';
import SiteName from './SiteName';
import data from './SiteName.data';

const SiteNameStory = {
    title: 'Components/SiteName',
    component: SiteName,
};
export default SiteNameStory;

export const SiteNameWithData = () => <SiteName {...data} />;
export const SiteNameWithoutData = () => <SiteName />;
