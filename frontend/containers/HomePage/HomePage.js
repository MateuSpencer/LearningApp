import React from 'react';
import { basePageWrap } from '../BasePage';
import { useRouter } from 'next/router';
import s from './HomePage.module.css';
import SearchBar from '../../components/SearchBar';
import Logo from '../../components/Logo';
import SiteName from '../../components/SiteName';

const HomePage = ({}) => {
    const router = useRouter();
    
    // Handle search form submission with exact match checking
    const handleSearch = async (searchQuery) => {
        try {
            // First check if there's an exact match for the query
            // Wikipedia is case-sensitive, so we're preserving case but replacing spaces with underscores
            const formattedQuery = searchQuery.replace(/\s+/g, '_');
            const response = await fetch(
                `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(formattedQuery)}`
            );
            
            if (response.ok) {
                // Get the canonical title from Wikipedia's API response
                const data = await response.json();
                // Use the canonical title from Wikipedia which has the correct case
                const canonicalSlug = data.title.replace(/\s+/g, '_');
                
                // Direct match found, navigate directly to the wiki article page with correct case
                router.push(`/wiki/${canonicalSlug}`);
                return;
            }
        } catch (err) {
            console.error('Error checking for exact page match:', err);
            // Continue with normal search if API check fails
        }
        
        // No exact match found, go to search results page
        router.push({
            pathname: '/wiki',
            query: { q: searchQuery }
        });
    };
    
    return (
        <div className={s.Container}>
            <div className={s.LogoContainer}>
                <Logo size="large" />
                <SiteName size="large" />
            </div>
            
            <div className={s.SearchContainer}>
                <SearchBar onSearch={handleSearch} />
            </div>
        </div>
    );
};

export default basePageWrap(HomePage);