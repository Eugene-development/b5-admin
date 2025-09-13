/**
 * HTTP Client wrapper for API requests with authentication support
 * Handles cookies, CSRF tokens, error handling, and automatic redirects
 * Requirements: 4.4, 5.1, 5.2, 5.3, 5.4
 */

import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { API_BASE_URL, AUTH_API_URL } from '$lib/config/api.js';

/**
 * Get CSRF token from cookie
 * @returns {string|null} CSRF token or null if not found
 */
function getCsrfToken() {
	if (!browser) return null;

	const cookies = document.cookie.split(';');
	for (let cookie of cookies) {
		const [name, value] = cookie.trim().split('=');
		if (name === 'XSRF-TOKEN') {
			return decodeURIComponent(value);
		}
	}
	return null;
}

/**
 * Initialize CSRF protection by fetching CSRF cookie
 * Requirements: 5.1, 5.2, 5.4
 * @returns {Promise<void>}
 */
export async function initCsrf(fetchFn = globalThis.fetch) {
	try {
		await fetchFn(`${AUTH_API_URL}/sanctum/csrf-cookie`, {
			method: 'GET',
			credentials: 'include',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			}
		});
	} catch (error) {
		console.error('Failed to initialize CSRF protection:', error);
		throw new Error('Failed to initialize CSRF protection');
	}
}

/**
 * HTTP Client class for making authenticated API requests
 * Requirements: 4.4, 5.1, 5.2, 5.3, 5.4
 */
export class HttpClient {
	constructor(options = {}) {
		this.baseURL = options.baseURL || AUTH_API_URL;
		this.fetch = options.fetch || globalThis.fetch;
		this.defaultHeaders = {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...options.defaultHeaders
		};
		this.onUnauthorized = options.onUnauthorized || this.defaultUnauthorizedHandler;
	}

	/**
	 * Default handler for 401 unauthorized responses
	 * Automatically redirects to login page
	 * Requirements: 5.1, 5.3
	 */
	async defaultUnauthorizedHandler() {
		if (browser) {
			// Clear any stored auth state if available
			if (typeof window !== 'undefined' && window.localStorage) {
				window.localStorage.removeItem('auth_user');
			}

			// Redirect to login page
			await goto('/login');
		}
	}

	/**
	 * Prepare headers for API request
	 * Automatically includes CSRF token if available
	 * Requirements: 5.2, 5.4
	 * @param {Object} customHeaders - Additional headers to include
	 * @returns {Object} Complete headers object
	 */
	prepareHeaders(customHeaders = {}) {
		const headers = {
			...this.defaultHeaders,
			...customHeaders
		};

		// Add CSRF token if available
		const csrfToken = getCsrfToken();
		if (csrfToken) {
			headers['X-XSRF-TOKEN'] = csrfToken;
		}

		return headers;
	}

	/**
	 * Make HTTP request with automatic credential handling
	 * Requirements: 4.4, 5.1, 5.2, 5.3, 5.4
	 * @param {string} url - Request URL (relative to baseURL or absolute)
	 * @param {Object} options - Fetch options
	 * @returns {Promise<Response>} Fetch response
	 */
	async request(url, options = {}) {
		// Resolve URL (handle both relative and absolute URLs)
		const requestUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;

		// Prepare configuration with credentials and headers
		const config = {
			credentials: 'include', // Always send cookies
			headers: this.prepareHeaders(options.headers),
			...options
		};

		try {
			const response = await this.fetch(requestUrl, config);

			// Handle 401 unauthorized responses automatically
			if (response.status === 401) {
				await this.onUnauthorized();

				// Create error for the calling code
				const error = new Error('Unauthorized');
				error.status = 401;
				error.response = response;
				throw error;
			}

			return response;
		} catch (error) {
			// Re-throw fetch errors (network issues, etc.)
			if (!error.status) {
				const networkError = new Error(`Network error: ${error.message}`);
				networkError.originalError = error;
				throw networkError;
			}
			throw error;
		}
	}

	/**
	 * Make HTTP request and parse JSON response
	 * Requirements: 4.4, 5.1, 5.2, 5.3, 5.4
	 * @param {string} url - Request URL
	 * @param {Object} options - Fetch options
	 * @returns {Promise<Object>} Parsed JSON response
	 * @throws {Error} API error with status and data
	 */
	async requestJson(url, options = {}) {
		const response = await this.request(url, options);

		let data;
		try {
			data = await response.json();
		} catch (error) {
			throw new Error(`Failed to parse JSON response: ${error.message}`);
		}

		if (!response.ok) {
			const apiError = new Error(data.message || `HTTP ${response.status}`);
			apiError.status = response.status;
			apiError.data = data;
			apiError.response = response;
			throw apiError;
		}

		return data;
	}

	/**
	 * Make GET request
	 * @param {string} url - Request URL
	 * @param {Object} options - Additional fetch options
	 * @returns {Promise<Object>} JSON response
	 */
	async get(url, options = {}) {
		return this.requestJson(url, {
			method: 'GET',
			...options
		});
	}

	/**
	 * Make POST request
	 * @param {string} url - Request URL
	 * @param {Object} data - Request body data
	 * @param {Object} options - Additional fetch options
	 * @returns {Promise<Object>} JSON response
	 */
	async post(url, data = null, options = {}) {
		return this.requestJson(url, {
			method: 'POST',
			body: data ? JSON.stringify(data) : null,
			...options
		});
	}

	/**
	 * Make PUT request
	 * @param {string} url - Request URL
	 * @param {Object} data - Request body data
	 * @param {Object} options - Additional fetch options
	 * @returns {Promise<Object>} JSON response
	 */
	async put(url, data = null, options = {}) {
		return this.requestJson(url, {
			method: 'PUT',
			body: data ? JSON.stringify(data) : null,
			...options
		});
	}

	/**
	 * Make PATCH request
	 * @param {string} url - Request URL
	 * @param {Object} data - Request body data
	 * @param {Object} options - Additional fetch options
	 * @returns {Promise<Object>} JSON response
	 */
	async patch(url, data = null, options = {}) {
		return this.requestJson(url, {
			method: 'PATCH',
			body: data ? JSON.stringify(data) : null,
			...options
		});
	}

	/**
	 * Make DELETE request
	 * @param {string} url - Request URL
	 * @param {Object} options - Additional fetch options
	 * @returns {Promise<Object>} JSON response
	 */
	async delete(url, options = {}) {
		return this.requestJson(url, {
			method: 'DELETE',
			...options
		});
	}

	/**
	 * Make GraphQL request to the data API
	 * @param {string} query - GraphQL query
	 * @param {Object} variables - GraphQL variables
	 * @param {Object} options - Additional options
	 * @returns {Promise<Object>} GraphQL response
	 */
	async graphql(query, variables = {}, options = {}) {
		const graphqlEndpoint = `${API_BASE_URL}/graphql`;

		return this.requestJson(graphqlEndpoint, {
			method: 'POST',
			body: JSON.stringify({
				query,
				variables
			}),
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			},
			...options
		});
	}
}

/**
 * Default HTTP client instance for authentication requests
 * Uses AUTH_API_URL for login, register, logout, etc.
 */
export const httpClient = new HttpClient();

/**
 * GraphQL client instance for data requests
 * Uses API_BASE_URL for GraphQL queries
 */
export const graphqlClient = new HttpClient({ baseURL: API_BASE_URL });

/**
 * Convenience function to create a new HTTP client with custom configuration
 * @param {Object} options - Client configuration options
 * @returns {HttpClient} New HTTP client instance
 */
export function createHttpClient(options = {}) {
	return new HttpClient(options);
}

/**
 * Create HTTP clients with SvelteKit fetch function
 * Use this in load functions to avoid the fetch warning
 * @param {typeof fetch} fetch - SvelteKit fetch function
 * @returns {Object} HTTP clients configured with SvelteKit fetch
 */
export function createApiClients(fetch) {
	const authClient = new HttpClient({ fetch, baseURL: AUTH_API_URL });
	const dataClient = new HttpClient({ fetch, baseURL: API_BASE_URL });

	return {
		authClient,
		dataClient,
		// Convenience methods
		initCsrf: () => initCsrf(fetch),
		auth: {
			get: (url, options) => authClient.get(url, options),
			post: (url, data, options) => authClient.post(url, data, options),
			put: (url, data, options) => authClient.put(url, data, options),
			patch: (url, data, options) => authClient.patch(url, data, options),
			delete: (url, options) => authClient.delete(url, options)
		},
		data: {
			get: (url, options) => dataClient.get(url, options),
			post: (url, data, options) => dataClient.post(url, data, options),
			graphql: (query, variables, options) => dataClient.graphql(query, variables, options)
		}
	};
}

/**
 * API helper functions using the default client
 */
export const api = {
	/**
	 * Initialize CSRF protection
	 * @returns {Promise<void>}
	 */
	initCsrf: () => initCsrf(),

	/**
	 * Make GET request
	 * @param {string} url - Request URL
	 * @param {Object} options - Additional options
	 * @returns {Promise<Object>} JSON response
	 */
	get: (url, options) => httpClient.get(url, options),

	/**
	 * Make POST request
	 * @param {string} url - Request URL
	 * @param {Object} data - Request body data
	 * @param {Object} options - Additional options
	 * @returns {Promise<Object>} JSON response
	 */
	post: (url, data, options) => httpClient.post(url, data, options),

	/**
	 * Make PUT request
	 * @param {string} url - Request URL
	 * @param {Object} data - Request body data
	 * @param {Object} options - Additional options
	 * @returns {Promise<Object>} JSON response
	 */
	put: (url, data, options) => httpClient.put(url, data, options),

	/**
	 * Make PATCH request
	 * @param {string} url - Request URL
	 * @param {Object} data - Request body data
	 * @param {Object} options - Additional options
	 * @returns {Promise<Object>} JSON response
	 */
	patch: (url, data, options) => httpClient.patch(url, data, options),

	/**
	 * Make DELETE request
	 * @param {string} url - Request URL
	 * @param {Object} options - Additional options
	 * @returns {Promise<Object>} JSON response
	 */
	delete: (url, options) => httpClient.delete(url, options),

	/**
	 * Make GraphQL request
	 * @param {string} query - GraphQL query
	 * @param {Object} variables - GraphQL variables
	 * @param {Object} options - Additional options
	 * @returns {Promise<Object>} GraphQL response
	 */
	graphql: (query, variables, options) => graphqlClient.graphql(query, variables, options)
};
