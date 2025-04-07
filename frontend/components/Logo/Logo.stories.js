/* global module */

import React from 'react';
import Logo from './Logo';
import data from './Logo.data';

const LogoStory = {
    title: 'Components/Logo',
    component: Logo,
};
export default LogoStory;

export const LogoWithData = () => <Logo {...data} />;
export const LogoWithoutData = () => <Logo />;
