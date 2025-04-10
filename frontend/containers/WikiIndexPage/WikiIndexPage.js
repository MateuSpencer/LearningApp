import React from 'react';
import PropTypes from 'prop-types';
import { basePageWrap } from '../BasePage';
import SearchBar from '../../components/SearchBar';
import s from './WikiIndexPage.module.css';

const WikiIndexPage = ({ title }) => {
  return (
    <div className={s.container}>
      <h1 className={s.title}>Wiki Explorer</h1>
      <SearchBar placeholder="Search for articles..." />
      {/* Future content for search results will go here */}
    </div>
  );
};

WikiIndexPage.defaultProps = {
  title: '',
};

WikiIndexPage.propTypes = {
  title: PropTypes.string,
};

export default basePageWrap(WikiIndexPage);