/* global module */

import React from 'react';
import NewPostForm from './NewPostForm';
import data from './NewPostForm.data';

const NewPostFormStory = {
    title: 'Components/NewPostForm',
    component: NewPostForm,
};
export default NewPostFormStory;

export const NewPostFormWithData = () => <NewPostForm {...data} />;
export const NewPostFormWithoutData = () => <NewPostForm />;
