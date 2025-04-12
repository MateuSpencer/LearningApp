import { getCookie } from './Cookie';

const parseJSON = (response) => response.json();

const defaultHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
};

const buildHeaders = () => {
    return {
        ...defaultHeaders,
    };
};

const buildHeadersWithCsrf = () => {
    return {
        'X-CSRFToken': getCookie('csrftoken'),
        ...defaultHeaders,
    }
}

const checkStatus = (response) => {
    if (response.status >= 200 && response.status < 300) {
        return response;
    }

    const error = new Error(response.statusText);
    error.response = response;
    error.status = response.status;  // Add this line
    throw error;
};

const httpGet = (url) =>
    fetch(url, {
        headers: buildHeaders(),
        credentials: 'same-origin',
    })
        .then(checkStatus)
        .then(parseJSON);

const httpPostWithCsrfToken = (url, data) =>
    fetch(url, {
        method: 'post',
        headers: buildHeadersWithCsrf(),
        body: JSON.stringify(data),
        credentials: 'same-origin',
    })
        .then(checkStatus)
        .then(parseJSON);


const fetchCsrfToken = async () => {
    try {
        const response = await fetch('/api/auth/csrf-token/', {
            method: 'GET',
            credentials: 'same-origin',
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch CSRF token');
        }
        
        const data = await response.json();
        return data.csrfToken;
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
        throw error;
    }
};

const httpPost = async (url, data) => {
    // Get CSRF token first
    let headers = buildHeaders();
    
    try {
        // Try to get CSRF token - only if endpoint is available
        if (url.startsWith('/api/auth/')) {
            try {
                const csrfToken = await fetchCsrfToken();
                if (csrfToken) {
                    headers = {
                        ...headers,
                        'X-CSRFToken': csrfToken,
                    };
                }
            } catch (e) {
                console.warn('Could not fetch CSRF token, proceeding without it');
            }
        }
        
        return fetch(url, {
            method: 'post',
            headers,
            body: JSON.stringify(data),
            credentials: 'same-origin',
        })
        .then(checkStatus)
        .then(parseJSON);
    } catch (error) {
        console.error('HTTP Post error:', error);
        throw error;
    }
};

export { httpGet, httpPostWithCsrfToken, fetchCsrfToken, httpPost };