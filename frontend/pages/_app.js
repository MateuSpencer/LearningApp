import React, { useEffect } from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthContextProvider } from '../auth';
import '../index.css';
import { init } from './init'

function MyApp({ Component, pageProps }) {
    useEffect(() => {
        init();
    }, []);
    
    return (
        <ThemeProvider>
            <AuthContextProvider>
                <Component {...pageProps} />
            </AuthContextProvider>
        </ThemeProvider>
    );
}

export default MyApp;