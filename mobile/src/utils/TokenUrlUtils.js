import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Utility to securely append authentication token to URLs.
 * Use this when APIs require the token as a query parameter instead of a header.
 */
const TokenUrlUtils = {
    /**
     * Appends the current user token to the given URL as a query parameter.
     * @param {string} url - The base URL or path.
     * @param {object} params - Additional query parameters (optional).
     * @returns {Promise<string>} - The URL with the token appended.
     */
    appendTokenToUrl: async (url, params = {}) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                console.warn('No token found in AsyncStorage');
                return url;
            }

            const separator = url.includes('?') ? '&' : '?';
            let newUrl = `${url}${separator}token=${token}`;

            // Append additional parameters
            Object.keys(params).forEach(key => {
                newUrl += `&${key}=${encodeURIComponent(params[key])}`;
            });

            return newUrl;
        } catch (error) {
            console.error('Error appending token to URL:', error);
            return url;
        }
    },

    /**
     * Extracts the token from a URL query string (if needed for deep linking).
     * @param {string} url - The URL containing the token.
     * @returns {string|null} - The extracted token or null.
     */
    extractTokenFromUrl: (url) => {
        try {
            const regex = /[?&]token=([^&]+)/;
            const match = url.match(regex);
            return match ? match[1] : null;
        } catch (error) {
            console.error('Error extracting token from URL:', error);
            return null;
        }
    }
};

export default TokenUrlUtils;
