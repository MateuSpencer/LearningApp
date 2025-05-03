// frontend/utils/stringUtils.js

/**
 * Formats a slug for display by replacing underscores with spaces 
 * and capitalizing the first letter of each word.
 * 
 * @param {string} slugText The slug to format.
 * @returns {string} The formatted slug, or an empty string if input is falsy.
 */
export const formatPageSlug = (slugText) => {
    if (!slugText) return '';
    return slugText
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
