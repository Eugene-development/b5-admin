/**
 * HTTP Client for B5-Admin Authentication API
 * Provides HTTP methods with Bearer token support and error handling
 */

import { API_CONFIG, getAuthHeaders, removeAuthToken } from './config.js';
import { goto } from '$app/navigation';
import {
	handleAuthError,
	handleNetworkError,
	handleTimeoutError
} from '../utils/authErrorHandler.js';
import { browser } from '$app/environment';

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
 * Custom API Error class
 */
export class ApiError extends Error {
	constructor(message, status, data = null) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.data = data;
	}
}

/**
 * Handle API response and errors
 * @param {Response} response - Fetch response object
 * @returns {Promise<Object>} Parsed response data
 * @throws {ApiError} When response indicates an error
 */
async function handleResponse(response) {
	let data;

	try {
		data = await response.json();
	} catch (error) {
		// If response is not JSON, create a generic error
		throw new ApiError(`HTTP ${response.status}: ${response.statusText}`, response.status);
	}

	if (!response.ok) {
		// Handle specific error cases
		switch (response.status) {
			case 401:
				// Unauthorized - just throw error, let caller handle redirect
				// Don't auto-redirect here as it interferes with login flow
				throw new ApiError(data.message || 'Unauthorized access', 401, data);

			case 422:
				// Validation errors
				throw new ApiError('Validation failed', 422, data);

			case 403:
				// Forbidden
				throw new ApiError('Access forbidden', 403, data);

			case 404:
				// Not found
				throw new ApiError('Resource not found', 404, data);

			case 429:
				// Too many requests
				throw new ApiError('Too many requests', 429, data);

			default:
				// Generic server error
				throw new ApiError(
					data.message || `HTTP ${response.status}: ${response.statusText}`,
					response.status,
					data
				);
		}
	}

	return data;
}

/**
 * Make an API request with proper error handling and timeout
 * @param {string} endpoint - API endpoint (relative to base URL)
 * @param {Object} options - Fetch options
 * @param {boolean} requireAuth - Whether to include auth headers
 * @returns {Promise<Object>} API response data
 */
export async function apiRequest(endpoint, options = {}, requireAuth = false) {
	const url = `${API_CONFIG.baseUrl}${endpoint}`;

	// Create abort controller for timeout
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

	// Prepare headers
	const headers = {
		...API_CONFIG.headers,
		...options.headers
	};

	// Add CSRF token if available
	const csrfToken = getCsrfToken();
	if (csrfToken) {
		headers['X-XSRF-TOKEN'] = csrfToken;
	}

	// Add auth headers if required and available
	if (requireAuth) {
		const authHeaders = getAuthHeaders();
		if (authHeaders) {
			Object.assign(headers, authHeaders);
		} else {
			clearTimeout(timeoutId);
			throw new ApiError('Authentication required', 401);
		}
	}

	// Prepare fetch options
	const fetchOptions = {
		...options,
		headers,
		signal: controller.signal,
		credentials: 'include' // Include cookies for CSRF and session management
	};

	try {
		const response = await fetch(url, fetchOptions);
		clearTimeout(timeoutId);
		return await handleResponse(response);
	} catch (error) {
		clearTimeout(timeoutId);

		if (error.name === 'AbortError') {
			const timeoutError = new ApiError('Request timeout', 408);
			handleTimeoutError(timeoutError, { showToast: false }); // Don't show toast here, let caller handle it
			throw timeoutError;
		}

		if (error instanceof ApiError) {
			throw error;
		}

		// Network or other errors
		const networkError = new ApiError('Произошла ошибка при подключении к серверу', 0, {
			originalError: error.message
		});
		handleNetworkError(error, { showToast: false }); // Don't show toast here, let caller handle it
		throw networkError;
	}
}

/**
 * GET request
 * @param {string} endpoint - API endpoint
 * @param {Object} headers - Additional headers
 * @param {boolean} requireAuth - Whether authentication is required
 * @returns {Promise<Object>} API response data
 */
export async function get(endpoint, headers = {}, requireAuth = false) {
	return apiRequest(
		endpoint,
		{
			method: 'GET',
			headers
		},
		requireAuth
	);
}

/**
 * POST request
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Request body data
 * @param {Object} headers - Additional headers
 * @param {boolean} requireAuth - Whether authentication is required
 * @returns {Promise<Object>} API response data
 */
export async function post(endpoint, body = {}, headers = {}, requireAuth = false) {
	return apiRequest(
		endpoint,
		{
			method: 'POST',
			headers,
			body: JSON.stringify(body)
		},
		requireAuth
	);
}

/**
 * PUT request
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Request body data
 * @param {Object} headers - Additional headers
 * @param {boolean} requireAuth - Whether authentication is required
 * @returns {Promise<Object>} API response data
 */
export async function put(endpoint, body = {}, headers = {}, requireAuth = false) {
	return apiRequest(
		endpoint,
		{
			method: 'PUT',
			headers,
			body: JSON.stringify(body)
		},
		requireAuth
	);
}

/**
 * DELETE request
 * @param {string} endpoint - API endpoint
 * @param {Object} headers - Additional headers
 * @param {boolean} requireAuth - Whether authentication is required
 * @returns {Promise<Object>} API response data
 */
export async function deleteRequest(endpoint, headers = {}, requireAuth = false) {
	return apiRequest(
		endpoint,
		{
			method: 'DELETE',
			headers
		},
		requireAuth
	);
}

// Export delete with a more standard name as well
export { deleteRequest as delete };
