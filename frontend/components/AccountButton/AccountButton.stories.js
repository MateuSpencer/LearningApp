/* global module */

import React from 'react';
import AccountButton from './AccountButton';
import data from './AccountButton.data';

const AccountButtonStory = {
    title: 'Components/AccountButton',
    component: AccountButton,
};
export default AccountButtonStory;

export const AccountButtonWithData = () => <AccountButton {...data} />;
export const AccountButtonWithoutData = () => <AccountButton />;
