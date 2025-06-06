import React from 'react';
import Link from 'next/link';
import s from './NotFoundPage.module.css';

const NotFoundPage = ({ exception }) => {
    return (
        <div className={s.Container}>
            <div className={s.Content}>
                <div className={s.ErrorCode}>404</div>
                
                <h1 className={s.Title}>Page Not Found</h1>
                
                <p className={s.Description}>
                    {exception || "Sorry, the page you are looking for doesn't exist or has been moved."}
                </p>
                
                <div className={s.Actions}>
                    <Link href="/" className={s.PrimaryButton}>
                        ← Back to Homepage
                    </Link>
                </div>
            </div>
        </div>
    );
};

NotFoundPage.propTypes = {};

export default NotFoundPage;
