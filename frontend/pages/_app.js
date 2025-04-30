import React from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import '../index.css';

function MyApp({ Component, pageProps }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Component {...pageProps} />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default MyApp;