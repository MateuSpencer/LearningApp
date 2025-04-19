import React from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { CSRFTokenProvider } from '../context/CSRFTokenContext';
import '../index.css';

function MyApp({ Component, pageProps }) {
    return (
        <ThemeProvider>
            <CSRFTokenProvider>
                <Component {...pageProps} />
            </CSRFTokenProvider>
        </ThemeProvider>
    );
}

export default MyApp;