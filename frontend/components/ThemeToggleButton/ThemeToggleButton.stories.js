/* global module */

import React from 'react';
import ThemeToggleButton from './ThemeToggleButton';
import data from './ThemeToggleButton.data';

const ThemeToggleButtonStory = {
    title: 'Components/ThemeToggleButton',
    component: ThemeToggleButton,
};
export default ThemeToggleButtonStory;

export const ThemeToggleButtonWithData = () => <ThemeToggleButton {...data} />;
export const ThemeToggleButtonWithoutData = () => <ThemeToggleButton />;
