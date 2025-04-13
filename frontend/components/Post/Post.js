import React from 'react';
import PropTypes from 'prop-types';
import s from './Post.module.css';

const Post = ({ title, content, author, createdAt }) => {
    return (
        <div className={s.post}>
            <h3 className={s.title}>{title}</h3>
            <div className={s.content}>{content}</div>
            <div className={s.meta}>
                <span className={s.author}>By: {author}</span>
                <span className={s.date}>{new Date(createdAt).toLocaleDateString()}</span>
            </div>
        </div>
    );
};

Post.propTypes = {
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    author: PropTypes.string,
    createdAt: PropTypes.string
};

Post.defaultProps = {
    author: 'Anonymous',
    createdAt: new Date().toISOString()
};

export default Post;