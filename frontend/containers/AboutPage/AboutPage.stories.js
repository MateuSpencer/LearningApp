/* global module */

import React from 'react';
import AboutPage from './AboutPage';
import data from './AboutPage.data';

const AboutPageStory = {
    title: 'Containers/AboutPage',
    component: AboutPage,
};
export default AboutPageStory;

export const AboutPageWithData = () => <AboutPage {...data} />;
export const AboutPageWithoutData = () => <AboutPage />;
