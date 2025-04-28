import React from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import '../index.css';

function MyApp({ Component, pageProps }) {
    return (
        <ThemeProvider>
            <Component {...pageProps} />
        </ThemeProvider>
    );
}

export default MyApp;