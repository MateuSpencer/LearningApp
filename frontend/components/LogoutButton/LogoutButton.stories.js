/* global module */

import React from 'react';
import LogoutButton from './LogoutButton';
import data from './LogoutButton.data';

const LogoutButtonStory = {
    title: 'Components/LogoutButton',
    component: LogoutButton,
};
export default LogoutButtonStory;

export const LogoutButtonWithData = () => <LogoutButton {...data} />;
export const LogoutButtonWithoutData = () => <LogoutButton />;
