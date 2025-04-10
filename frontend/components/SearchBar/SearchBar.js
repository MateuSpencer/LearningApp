import React, { useState } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { useRouter } from 'next/router';
import s from './SearchBar.module.css';

const SearchBar = ({ placeholder = "What do you want to learn?" }) => {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [error, setError] = useState(null);
    const maxLength = 100;
    
    const validateQuery = (input) => {
        // Basic validation rules
        if (input.length > maxLength) {
            return 'Search query is too long';
        }
        
        // More comprehensive regex for detecting potential XSS
        // But still not a complete solution - see sanitizeQuery function
        const suspiciousPatterns = /<[^>]*>|javascript:|data:|vbscript:|on\w+\s*=|xmlns\s*=|formaction|@import|expression\s*\(|url\s*\(/i;
        if (suspiciousPatterns.test(input)) {
            return 'Invalid search query';
        }
        
        return null;
    };
    
    const sanitizeQuery = (input) => {
        // Use DOMPurify for proper sanitization
        const sanitized = DOMPurify.sanitize(input.trim(), {
            ALLOWED_TAGS: [], // No HTML tags allowed
            ALLOWED_ATTR: [] // No attributes allowed
        });
        
        return sanitized;
    };
    
    const onSearch = (searchQuery) => {
        // Convert to lowercase and replace spaces with underscores for Wikipedia-style URLs
        const formattedQuery = searchQuery.toLowerCase().replace(/\s+/g, '_');
        
        // Navigate to the wiki page for this query
        router.push(`/wiki/${formattedQuery}`);
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate and sanitize the input
        const validationError = validateQuery(query);
        if (validationError) {
            setError(validationError);
            return;
        }
        
        const sanitizedQuery = sanitizeQuery(query);
        setError(null);
        onSearch(sanitizedQuery);
    };

    const handleChange = (e) => {
        setQuery(e.target.value);
        if (error) setError(null);
    };

    return (
        <div className={s.SearchBar}>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={query}
                    onChange={handleChange}
                    className={s.Input}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    aria-invalid={!!error}
                />
                <button type="submit" className={s.Button}>Search</button>
                {error && <div className={s.Error}>{error}</div>}
            </form>
        </div>
    );
};

SearchBar.propTypes = {
    placeholder: PropTypes.string
};

export default SearchBar;