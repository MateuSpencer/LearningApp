/* global module */

import React from 'react';
import EditPostForm from './EditPostForm';
import data from './EditPostForm.data';

const EditPostFormStory = {
    title: 'Components/EditPostForm',
    component: EditPostForm,
};
export default EditPostFormStory;

export const EditPostFormWithData = () => <EditPostForm {...data} />;
export const EditPostFormWithoutData = () => <EditPostForm />;
