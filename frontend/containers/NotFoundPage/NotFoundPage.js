import React from 'react';
import Link from 'next/link';
import { useTranslation } from '../../hooks/useTranslation';
import s from './NotFoundPage.module.css';

const NotFoundPage = ({ exception, domain }) => {
    const { t } = useTranslation();
    
    return (
        <div className={s.Container}>
            <div className={s.Content}>
                <div className={s.ErrorCode}>404</div>
                
                <h1 className={s.Title}>{t('notFound.title')}</h1>
                
                <p className={s.Description}>
                    {exception || t('notFound.description')}
                </p>
                
                <div className={s.Actions}>
                    <Link href="/" className={s.PrimaryButton}>
                        {t('notFound.backToHomepage')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

NotFoundPage.propTypes = {};

export default NotFoundPage;
