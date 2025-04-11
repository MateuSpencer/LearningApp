/* global module */

import React from 'react';
import AccountPage from './AccountPage';
import data from './AccountPage.data';

const AccountPageStory = {
    title: 'Containers/AccountPage',
    component: AccountPage,
};
export default AccountPageStory;

export const AccountPageWithData = () => <AccountPage {...data} />;
export const AccountPageWithoutData = () => <AccountPage />;
