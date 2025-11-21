/**
 * HTTP Client wrapper for API requests with JWT authentication
 * Handles JWT tokens, error handling, and automatic redirects
 */

import { browser } from '$app/environment';
import { API_BASE_URL, AUTH_API_URL } from '$lib/config/api.js';
import { setToken as authSetToken } from '$lib/auth/auth.svelte.js';

/**
 * Get JWT token from localStorage
 * @returns {string|null} JWT token or null if not found
 */
function getStoredToken() {
	if (!browser) return null;
	return localStorage.getItem('b5_auth_token');
}

/**
 * HTTP Client class for making authenticated API requests with JWT
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
		this.getToken = options.getToken || getStoredToken;
		this.setToken = options.setToken || this.defaultSetToken;
		this.isRefreshing = false;
		this.refreshPromise = null;
	}

	/**
	 * Default token setter - stores token in localStorage
	 * @param {string} token - JWT token to store
	 */
	defaultSetToken(token) {
		if (browser && token) {
			localStorage.setItem('b5_auth_token', token);
		}
	}

	/**
	 * Attempt to refresh the JWT token
	 * @returns {Promise<string|null>} New token or null if refresh failed
	 */
	async refreshToken() {
		if (!browser) return null;

		// If already refreshing, wait for that promise
		if (this.isRefreshing && this.refreshPromise) {
			return this.refreshPromise;
		}

		this.isRefreshing = true;

		this.refreshPromise = (async () => {
			try {
				const token = this.getToken();
				if (!token) return null;

				// Call the refresh endpoint
				const response = await this.fetch(`${AUTH_API_URL}/api/refresh`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Accept: 'application/json',
						Authorization: `Bearer ${token}`
					}
				});

				if (!response.ok) {
					return null;
				}

				const data = await response.json();

				if (data.success && data.token) {
					this.setToken(data.token);
					return data.token;
				}

				return null;
			} catch (error) {
				console.error('Token refresh failed:', error);
				return null;
			} finally {
				this.isRefreshing = false;
				this.refreshPromise = null;
			}
		})();

		return this.refreshPromise;
	}

	/**
	 * Default handler for 401 unauthorized responses
	 * Automatically redirects to login page
	 */
	async defaultUnauthorizedHandler() {
		if (browser) {
			// Clear any stored auth state
			if (typeof window !== 'undefined' && window.localStorage) {
				window.localStorage.removeItem('b5_auth_token');
				window.localStorage.removeItem('auth_user');
			}

			// Use safe redirect to prevent multiple concurrent redirects
			const { safeRedirectToLogin } = await import('$lib/auth/auth.svelte.js');
			await safeRedirectToLogin();
		}
	}

	/**
	 * Prepare headers for API request
	 * Automatically includes JWT Authorization header if token is available
	 * @param {Object} customHeaders - Additional headers to include
	 * @returns {Object} Complete headers object
	 */
	prepareHeaders(customHeaders = {}) {
		const headers = {
			...this.defaultHeaders,
			...customHeaders
		};

		// Add JWT Authorization header if token is available
		const token = this.getToken();
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}

		return headers;
	}

	/**
	 * Make HTTP request with automatic JWT handling and token refresh
	 * @param {string} url - Request URL (relative to baseURL or absolute)
	 * @param {Object} options - Fetch options
	 * @param {boolean} isRetry - Internal flag to prevent infinite refresh loop
	 * @returns {Promise<Response>} Fetch response
	 */
	async request(url, options = {}, isRetry = false) {
		// Resolve URL (handle both relative and absolute URLs)
		const requestUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;

		// Prepare configuration with headers (no credentials needed for JWT)
		const config = {
			headers: this.prepareHeaders(options.headers),
			...options
		};

		try {
			const response = await this.fetch(requestUrl, config);

			// Handle 401 unauthorized responses automatically
			if (response.status === 401 && !isRetry) {
				// Try to refresh the token
				const newToken = await this.refreshToken();

				if (newToken) {
					// Retry the request with the new token
					return this.request(url, options, true);
				}

				// If refresh failed, call unauthorized handler
				await this.onUnauthorized();

				// Create error for the calling code
				const error = new Error('Unauthorized');
				error.status = 401;
				error.response = response;
				throw error;
			}

			// If 401 on retry (refresh failed), call unauthorized handler
			if (response.status === 401 && isRetry) {
				await this.onUnauthorized();

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
export const httpClient = new HttpClient({
	setToken: authSetToken
});

/**
 * GraphQL client instance for data requests
 * Uses API_BASE_URL for GraphQL queries
 */
export const graphqlClient = new HttpClient({
	baseURL: API_BASE_URL,
	setToken: authSetToken
});

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
