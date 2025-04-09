/* global module */

import React from 'react';
import AboutButton from './AboutButton';
import data from './AboutButton.data';

const AboutButtonStory = {
    title: 'Components/AboutButton',
    component: AboutButton,
};
export default AboutButtonStory;

export const AboutButtonWithData = () => <AboutButton {...data} />;
export const AboutButtonWithoutData = () => <AboutButton />;
