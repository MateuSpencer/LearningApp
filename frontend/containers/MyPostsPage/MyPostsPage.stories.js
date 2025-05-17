/* global module */

import React from 'react';
import MyPostsPage from './MyPostsPage';
import data from './MyPostsPage.data';

const MyPostsPageStory = {
    title: 'Containers/MyPostsPage',
    component: MyPostsPage,
};
export default MyPostsPageStory;

export const MyPostsPageWithData = () => <MyPostsPage {...data} />;
export const MyPostsPageWithoutData = () => <MyPostsPage />;
