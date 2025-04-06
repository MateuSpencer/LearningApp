/* global module */

import React from 'react';
import SearchBar from './SearchBar';
import data from './SearchBar.data';

const SearchBarStory = {
    title: 'Components/SearchBar',
    component: SearchBar,
};
export default SearchBarStory;

export const SearchBarWithData = () => <SearchBar {...data} />;
export const SearchBarWithoutData = () => <SearchBar />;
