import React from 'react';
import PropTypes from 'prop-types';
import { basePageWrap } from '../BasePage';
import WikipediaPreview from '../../components/WikipediaPreview';
import s from './WikiArticlePage.module.css';

const WikiArticlePage = ({ title, articleSlug }) => {
  return (
    <div className={s.container}>
      <WikipediaPreview slug={articleSlug} />
    </div>
  );
};

WikiArticlePage.defaultProps = {
  title: '',
  articleSlug: ''
};

WikiArticlePage.propTypes = {
  title: PropTypes.string,
  articleSlug: PropTypes.string
};

export default basePageWrap(WikiArticlePage);