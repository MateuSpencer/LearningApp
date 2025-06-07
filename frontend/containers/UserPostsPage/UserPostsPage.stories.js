/* global module */

import React from 'react';
import UserPostsPage from './UserPostsPage';
import data from './UserPostsPage.data';

const UserPostsPageStory = {
    title: 'Containers/UserPostsPage',
    component: UserPostsPage,
};
export default UserPostsPageStory;

export const UserPostsPageWithData = () => <UserPostsPage {...data} />;
export const UserPostsPageWithoutData = () => <UserPostsPage />;
