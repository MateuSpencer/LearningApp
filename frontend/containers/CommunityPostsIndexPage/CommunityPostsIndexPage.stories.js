/* global module */

import React from 'react';
import CommunityPostsIndexPage from './CommunityPostsIndexPage';
import data from './CommunityPostsIndexPage.data';

const CommunityPostsIndexPageStory = {
    title: 'Containers/CommunityPostsIndexPage',
    component: CommunityPostsIndexPage,
};
export default CommunityPostsIndexPageStory;

export const CommunityPostsIndexPageWithData = () => <CommunityPostsIndexPage {...data} />;
export const CommunityPostsIndexPageWithoutData = () => <CommunityPostsIndexPage />;
