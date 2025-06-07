/* global module */

import React from 'react';
import PostsIndexPage from './PostsIndexPage';
import data from './PostsIndexPage.data';

const PostsIndexPageStory = {
    title: 'Containers/PostsIndexPage',
    component: PostsIndexPage,
};
export default PostsIndexPageStory;

export const PostsIndexPageWithData = () => <PostsIndexPage {...data} />;
export const PostsIndexPageWithoutData = () => <PostsIndexPage />;
