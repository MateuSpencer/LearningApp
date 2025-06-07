'use client';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    getPasswordProtectedPage,
    WagtailApiResponseError,
} from '../../api/wagtail';
import { useTranslation } from '../../hooks/useTranslation';
import LazyContainers from '../LazyContainers';

const PasswordProtectedPage = ({ restrictionId, pageId, csrfToken }) => {
    const { t } = useTranslation();
    const [values, setValues] = useState({ password: '' });
    const [error, setError] = useState(null);
    const [pageData, setPageData] = useState(null);

    const handleFormChange = async (e) => {
        e.preventDefault();

        try {
            const { json } = await getPasswordProtectedPage(
                restrictionId,
                pageId,
                {
                    ...values,
                },
                {
                    headers: {
                        'X-CSRFToken': csrfToken,
                    },
                }
            );

            setPageData(json);
        } catch (e) {
            if (!(e instanceof WagtailApiResponseError)) {
                throw e;
            }

            switch (e.response.status) {
                case 403:
                    setError(t('passwordProtectedPage.forbidden'));
                    break;
                case 401:
                    setError(t('passwordProtectedPage.invalidPassword'));
                    break;
                default:
                    setError(t('passwordProtectedPage.technicalIssues'));
                    break;
            }
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setValues({ ...values, [name]: value });
    };

    if (pageData) {
        const { componentName, componentProps } = pageData;
        const Component = LazyContainers[componentName];
        if (!Component) {
            return <h1>{t('passwordProtectedPage.componentNotFound', { componentName })}</h1>;
        }
        return <Component {...componentProps} />;
    }

    return (
        <div>
            <h1>{t('passwordProtectedPage.title')}</h1>
            <p>{t('passwordProtectedPage.description')}</p>

            {!!error && <p>{error}</p>}
            <p>
                <input
                    type="password"
                    name="password"
                    onChange={handlePasswordChange}
                    placeholder={t('passwordProtectedPage.passwordPlaceholder')}
                />
            </p>
            <button onClick={handleFormChange}>{t('passwordProtectedPage.continue')}</button>
        </div>
    );
};

PasswordProtectedPage.propTypes = {
    restrictionId: PropTypes.number.isRequired,
    pageId: PropTypes.number.isRequired,
    csrfToken: PropTypes.string.isRequired,
};

export default PasswordProtectedPage;
