/* global module */

import React from 'react';
import PostsList from './PostsList';
import data from './PostsList.data';

const PostsListStory = {
    title: 'Components/PostsList',
    component: PostsList,
};
export default PostsListStory;

export const PostsListWithData = () => <PostsList {...data} />;
export const PostsListWithoutData = () => <PostsList />;
