import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { useRouter } from 'next/router';
import s from './SearchBar.module.css';

const SearchBar = ({ 
    placeholder = "What do you want to learn?",
    initialQuery = '',
    onInputChange = null,
    onSearch = null, // Added onSearch prop
    enableSuggestions = true // Control whether to show suggestions
}) => {
    let router;
    try {
        router = useRouter();
    } catch {
        router = { push: () => {} };
    }
    const [query, setQuery] = useState(initialQuery);
    const [error, setError] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    const searchRef = useRef(null);
    const debounceRef = useRef(null);
    const maxLength = 100;
    
    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    // Clean up debounceRef on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    // Effect to update internal query state when initialQuery prop changes
    useEffect(() => {
        setQuery(initialQuery);
    }, [initialQuery]);
    
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
    
    // Get search suggestions from Wikipedia API
    const fetchSuggestions = async (searchQuery) => {
        if (!searchQuery || searchQuery.length < 2) {
            setSuggestions([]);
            return;
        }
        
        setLoading(true);
        try {
            // Use the MediaWiki action API for opensearch - limit to 5 results to avoid scrollbar
            const response = await fetch(
                `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${encodeURIComponent(searchQuery)}&limit=5&origin=*`
            );
            
            if (!response.ok) throw new Error('Failed to fetch suggestions');
            
            const data = await response.json();
            // The response format is [query, [titles], [descriptions], [urls]]
            const titles = data[1] || [];
            // Get descriptions for tooltip content
            const descriptions = data[2] || [];
            
            // Create an array of suggestion objects with title and description
            const enhancedSuggestions = titles.map((title, i) => ({
                title,
                description: descriptions[i] || ''
            }));
            
            setSuggestions(enhancedSuggestions);
        } catch (err) {
            // Silently handle errors
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };
    
    // Check if the page exists in Wikipedia and navigate accordingly
    const checkPageExists = async (searchQuery) => {
        try {
            // Preserve case for Wikipedia's case-sensitive URLs
            const formattedQuery = searchQuery.replace(/\s+/g, '_');
            
            // Use encodeURIComponent for API request but keep original for navigation
            const encodedQuery = encodeURIComponent(formattedQuery);
            
            const response = await fetch(
                `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedQuery}`
            );
            
            if (response.ok) {
                // Get the canonical title from Wikipedia's API response
                const data = await response.json();
                // Use the canonical title from Wikipedia which has the correct case
                const canonicalSlug = data.title.replace(/\s+/g, '_');
                
                // Direct match found, navigate directly to the wiki article page
                // Use router.push with object syntax to better handle special characters
                
                router.push({
                    pathname: '/wiki/[slug]',
                    query: { slug: canonicalSlug },
                }, `/wiki/${canonicalSlug}`);
                
                return true;
            } else {
                // No direct match, go to main wiki page with search query
                router.push({
                    pathname: '/wiki',
                    query: { q: searchQuery }
                });
                return false;
            }
        } catch (err) {
            // On error, go to main wiki page with search query
            router.push({
                pathname: '/wiki',
                query: { q: searchQuery }
            });
            return false;
        }
    };
    
    const onSearchDefault = (searchQuery) => {
        if (!searchQuery) return;
        
        // First check if this page exists in Wikipedia
        checkPageExists(searchQuery);
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const currentLocalQuery = query; // Use the internal state 'query'

        const validationError = validateQuery(currentLocalQuery);
        if (validationError) {
            setError(validationError);
            return;
        }

        const sanitizedQuery = sanitizeQuery(currentLocalQuery);

        if (!sanitizedQuery.trim()) {
            setError("Search query cannot be empty.");
            return;
        }
        setError(null); // Clear previous errors
        
        // First check if this exactly matches a Wikipedia article
        try {
            // Use our formatWikiSlug utility to properly handle special characters
            // Import the formatWikiSlug function at the top of the file if it's not already imported
            const formattedQuery = sanitizedQuery.replace(/\s+/g, '_');
            
            // Check for problematic characters
            const problematicChars = {
              '\u2013': '-', // en dash to regular hyphen (U+2013)
              '\u2014': '-', // em dash to regular hyphen (U+2014)
              '\u2018': "'", // fancy single quotes (U+2018)
              '\u2019': "'", // fancy single quotes (U+2019)
              '\u201C': '"', // fancy double quotes (U+201C)
              '\u201D': '"', // fancy double quotes (U+201D)
              '\u201E': '"', // fancy double quotes (U+201E)
              '\u00AB': '"', // fancy quotes (U+00AB)
              '\u00BB': '"'  // fancy quotes (U+00BB)
            };
            
            let safeQuery = formattedQuery;
            for (const [specialChar, replacement] of Object.entries(problematicChars)) {
              if (safeQuery.includes(specialChar)) {
                // Using split and join instead of RegExp to avoid escaping issues with Unicode
                safeQuery = safeQuery.split(specialChar).join(replacement);
              }
            }
            
            // Check specifically for en dash after replacement
            if (safeQuery.includes('–')) {
              // Try a direct replacement of the en dash
              safeQuery = safeQuery.split('–').join('-');
            }
            
            // Use encodeURIComponent for API URL
            const encodedQuery = encodeURIComponent(safeQuery);
            
            const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedQuery}`;
            
            // Add a small delay to ensure the browser has time to process the request
            // Sometimes browsers can throttle multiple rapid requests
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const response = await fetch(apiUrl);
            
            if (response.ok) {
                // Get the canonical title from Wikipedia's API response
                const data = await response.json();
                // Use the canonical title from Wikipedia which has the correct case
                const canonicalSlug = data.title.replace(/\s+/g, '_');
                
                // Direct match found, navigate to the wiki article page with correct case
                // Use router.push with object syntax to properly handle special characters
                
                router.push({
                    pathname: '/wiki/[slug]',
                    query: { slug: canonicalSlug },
                }, `/wiki/${canonicalSlug}`);
                
                return; // Exit early as we've already navigated
            }
        } catch (err) {
            // Continue with normal search flow if there's an error
        }

        // If we get here, no exact match was found, so follow normal search behavior
        if (onSearch) {
            onSearch(sanitizedQuery);
        } else {
            // Default behavior if onSearch is not provided (e.g., for a global search bar)
            
            // Handle problematic characters
            const problematicChars = {
                '\u2013': '-', // en dash to regular hyphen (U+2013)
                '\u2014': '-', // em dash to regular hyphen (U+2014)
                '\u2018': "'", // fancy single quotes (U+2018)
                '\u2019': "'", // fancy single quotes (U+2019)
                '\u201C': '"', // fancy double quotes (U+201C)
                '\u201D': '"', // fancy double quotes (U+201D)
                '\u201E': '"', // fancy double quotes (U+201E)
                '\u00AB': '"', // fancy quotes (U+00AB)
                '\u00BB': '"'  // fancy quotes (U+00BB)
            };
            
            let safeQuery = sanitizedQuery;
            let hadProblematicChars = false;
            
            for (const [specialChar, replacement] of Object.entries(problematicChars)) {
                if (safeQuery.includes(specialChar)) {
                    // Using split and join instead of RegExp to avoid escaping issues with Unicode
                    safeQuery = safeQuery.split(specialChar).join(replacement);
                    hadProblematicChars = true;
                }
            }
            
            // Check for en dash specifically
            if (safeQuery.includes('–')) {
                safeQuery = safeQuery.split('–').join('-');
                hadProblematicChars = true;
            }
            
            if (router && router.push) {
                router.push({
                    pathname: '/wiki',
                    query: { q: safeQuery }
                });
            } else {
                console.warn('SearchBar: onSearch prop not provided and router not available for default action.');
            }
        }
    };

    const handleChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        
        if (error) setError(null);
        
        // Show suggestions if enabled and there's text
        if (enableSuggestions) {
            setShowSuggestions(!!value);
            
            // Debounce API calls while typing - only if suggestions enabled
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            
            debounceRef.current = setTimeout(() => {
                fetchSuggestions(value);
            }, 300);
        }
        
        // Notify parent component if onInputChange handler is provided
        if (onInputChange) {
            onInputChange(value);
        }
    };
    
    const handleSuggestionClick = (suggestion) => {
        setQuery(suggestion.title);
        setShowSuggestions(false);
        
        // Format suggestion and navigate directly to wiki article page - preserve case for Wikipedia
        const formattedSuggestion = suggestion.title.replace(/\s+/g, '_');
        
        // Use router.push with the object syntax to handle special characters properly
        router.push({
            pathname: '/wiki/[slug]',
            query: { slug: formattedSuggestion },
        }, `/wiki/${formattedSuggestion}`);
    };

    return (
        <div className={s.SearchBar} ref={searchRef}>
            <form onSubmit={handleSubmit}>
                <div className={s.InputWrapper}>
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
                </div>
                
                {/* Suggestions dropdown - only show if enableSuggestions is true */}
                {enableSuggestions && showSuggestions && suggestions.length > 0 && (
                    <ul className={s.SuggestionsList}>
                        {suggestions.map((suggestion, index) => (
                            <li 
                                key={index} 
                                className={s.SuggestionItem}
                                onClick={() => handleSuggestionClick(suggestion)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSuggestionClick(suggestion)}
                                tabIndex="0"
                                role="option"
                                aria-selected="false"
                                title={suggestion.description || suggestion.title}
                            >
                                {suggestion.title}
                            </li>
                        ))}
                    </ul>
                )}
                
                {/* Loading indicator - only show if enableSuggestions is true */}
                {enableSuggestions && loading && showSuggestions && (
                    <div className={s.LoadingIndicator}>
                        Loading suggestions...
                    </div>
                )}
                
                {error && <div className={s.Error}>{error}</div>}
            </form>
        </div>
    );
};

SearchBar.propTypes = {
    placeholder: PropTypes.string,
    initialQuery: PropTypes.string,
    onInputChange: PropTypes.func,
    onSearch: PropTypes.func, // Added onSearch to propTypes
    enableSuggestions: PropTypes.bool // Control whether to show suggestions
};

export default SearchBar;