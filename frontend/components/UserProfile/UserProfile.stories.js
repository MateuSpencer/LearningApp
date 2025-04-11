/* global module */

import React from 'react';
import UserProfile from './UserProfile';
import data from './UserProfile.data';

const UserProfileStory = {
    title: 'Components/UserProfile',
    component: UserProfile,
};
export default UserProfileStory;

export const UserProfileWithData = () => <UserProfile {...data} />;
export const UserProfileWithoutData = () => <UserProfile />;
