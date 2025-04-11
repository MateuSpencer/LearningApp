/* global module */

import React from 'react';
import LoginForm from './LoginForm';
import data from './LoginForm.data';

const LoginFormStory = {
    title: 'Components/LoginForm',
    component: LoginForm,
};
export default LoginFormStory;

export const LoginFormWithData = () => <LoginForm {...data} />;
export const LoginFormWithoutData = () => <LoginForm />;
