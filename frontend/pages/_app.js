import React, { useEffect } from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthContextProvider, AuthChangeRedirector } from '../auth';
import init from '../lib/init';
import '../index.css';

function MyApp({ Component, pageProps }) {
    // Initialize the authentication system
    useEffect(() => {
        init();
    }, []);

    return (
        <ThemeProvider>
            <AuthContextProvider>
                <AuthChangeRedirector />
                <Component {...pageProps} />
            </AuthContextProvider>
        </ThemeProvider>
    );
}

export default MyApp;