import React from 'react';
import { ThemeProvider } from '../../context/ThemeContext';

export const withThemeProvider = (Story) => (
    <ThemeProvider>
        <Story />
    </ThemeProvider>
);