/* global module */

import React from 'react';
import RegistrationForm from './RegistrationForm';
import data from './RegistrationForm.data';

const RegistrationFormStory = {
    title: 'Components/RegistrationForm',
    component: RegistrationForm,
};
export default RegistrationFormStory;

export const RegistrationFormWithData = () => <RegistrationForm {...data} />;
export const RegistrationFormWithoutData = () => <RegistrationForm />;
