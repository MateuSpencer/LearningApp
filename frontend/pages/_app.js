import React from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import '../index.css';

function MyApp({ Component, pageProps }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <LanguageProvider>
                    <Component {...pageProps} />
                </LanguageProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default MyApp;