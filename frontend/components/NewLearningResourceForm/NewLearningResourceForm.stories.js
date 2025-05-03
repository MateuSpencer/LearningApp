/* global module */

import React from 'react';
import NewLearningResourceForm from './NewLearningResourceForm';
import data from './NewLearningResourceForm.data';

const NewLearningResourceFormStory = {
    title: 'Components/NewLearningResourceForm',
    component: NewLearningResourceForm,
};
export default NewLearningResourceFormStory;

export const NewLearningResourceFormWithData = () => <NewLearningResourceForm {...data} />;
export const NewLearningResourceFormWithoutData = () => <NewLearningResourceForm />;
