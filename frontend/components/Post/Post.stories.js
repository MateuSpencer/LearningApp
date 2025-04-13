/* global module */

import React from 'react';
import Post from './Post';
import data from './Post.data';

const PostStory = {
    title: 'Components/Post',
    component: Post,
};
export default PostStory;

export const PostWithData = () => <Post {...data} />;
export const PostWithoutData = () => <Post />;
