/**
 * Server-side API utilities for SSR data loading
 * Handles GraphQL requests with JWT token from httpOnly cookies via event.locals
 */

import { API_BASE_URL } from '../config/api.js';
import { getApiUrl } from '../config/domain.js';

/**
 * Make GraphQL request with JWT token from server context
 * @param {string} token - JWT access token from event.locals
 * @param {string} query - GraphQL query
 * @param {Object} variables - GraphQL variables
 * @param {Function} fetch - SvelteKit fetch function (optional, for SSR)
 * @param {string|Request|URL} [hostnameOrRequest] - Hostname string, Request object, or URL for domain-based URL resolution
 * @returns {Promise<Object>} GraphQL response data
 */
export async function makeServerGraphQLRequest(token, query, variables = {}, fetch = globalThis.fetch, hostnameOrRequest = null) {
	// Determine API URL based on hostname/request
	let apiBaseUrl = API_BASE_URL;
	
	if (hostnameOrRequest) {
		if (typeof hostnameOrRequest === 'string') {
			// Direct hostname string
			apiBaseUrl = getApiUrl(hostnameOrRequest);
		} else if (hostnameOrRequest instanceof URL) {
			// URL object
			apiBaseUrl = getApiUrl(hostnameOrRequest.hostname);
		} else if (hostnameOrRequest?.url) {
			// SvelteKit event object with url property
			const url = new URL(hostnameOrRequest.url);
			apiBaseUrl = getApiUrl(url.hostname);
		} else if (hostnameOrRequest?.headers) {
			// Request object
			apiBaseUrl = getApiUrl(hostnameOrRequest);
		}
	}
	
	console.log(`🌐 SSR GraphQL: Using API URL: ${apiBaseUrl}/graphql`);
	
	const response = await fetch(`${apiBaseUrl}/graphql`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
			...(token && { Authorization: `Bearer ${token}` })
		},
		body: JSON.stringify({ query, variables }),
		credentials: 'include' // Include httpOnly cookies
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`GraphQL request failed: ${response.status} ${response.statusText} - ${errorText}`);
	}

	const result = await response.json();

	if (result.errors) {
		console.error('GraphQL errors:', result.errors);
		throw new Error(result.errors[0]?.message || 'GraphQL query failed');
	}

	return result.data;
}

/**
 * Create fallback data structure for error cases
 * @param {Object} customData - Custom data to merge with fallback
 * @returns {Object} Fallback data structure
 */
export function createFallbackData(customData = {}) {
	return {
		data: [],
		stats: {
			total: 0,
			active: 0,
			banned: 0
		},
		pagination: {
			currentPage: 1,
			lastPage: 1,
			total: 0,
			perPage: 1000,
			hasMorePages: false
		},
		error: null,
		errorType: null,
		canRetry: false,
		isLoading: false,
		...customData
	};
}

/**
 * Error types for categorization
 */
export const ERROR_TYPES = {
	NETWORK: 'network',
	API: 'api',
	AUTH: 'auth',
	TIMEOUT: 'timeout',
	VALIDATION: 'validation',
	UNKNOWN: 'unknown'
};

/**
 * Categorize error by type
 * @param {Error} error - Error object
 * @returns {string} Error type
 */
export function categorizeError(error) {
	const message = error.message?.toLowerCase() || '';

	if (message.includes('network') || message.includes('fetch')) {
		return ERROR_TYPES.NETWORK;
	}
	if (message.includes('timeout') || message.includes('aborted')) {
		return ERROR_TYPES.TIMEOUT;
	}
	if (message.includes('unauthorized') || message.includes('forbidden') || message.includes('401')) {
		return ERROR_TYPES.AUTH;
	}
	if (message.includes('validation') || message.includes('invalid')) {
		return ERROR_TYPES.VALIDATION;
	}
	if (message.includes('graphql') || message.includes('api')) {
		return ERROR_TYPES.API;
	}

	return ERROR_TYPES.UNKNOWN;
}

/**
 * Get user-friendly error message
 * @param {string} errorType - Error type
 * @param {string} originalMessage - Original error message
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyErrorMessage(errorType, originalMessage) {
	switch (errorType) {
		case ERROR_TYPES.NETWORK:
			return 'Проблема с подключением к серверу. Проверьте интернет-соединение.';
		case ERROR_TYPES.TIMEOUT:
			return 'Превышено время ожидания ответа от сервера. Попробуйте еще раз.';
		case ERROR_TYPES.AUTH:
			return 'Ошибка авторизации. Пожалуйста, войдите в систему заново.';
		case ERROR_TYPES.API:
			return 'Ошибка при получении данных с сервера. Попробуйте обновить страницу.';
		case ERROR_TYPES.VALIDATION:
			return 'Получены некорректные данные с сервера. Обратитесь к администратору.';
		default:
			return `Произошла неожиданная ошибка: ${originalMessage}`;
	}
}

/**
 * Validate data structure
 * @param {Object} data - Data to validate
 * @param {Array<string>} requiredFields - Required fields
 * @returns {boolean} True if valid
 */
export function validateData(data, requiredFields = []) {
	if (!data || typeof data !== 'object') {
		return false;
	}

	for (const field of requiredFields) {
		if (!(field in data)) {
			return false;
		}
	}

	return true;
}

/**
 * Calculate statistics for users/items
 * @param {Array} items - Items array
 * @param {string} statusField - Field name for status (default: 'ban')
 * @returns {Object} Statistics object
 */
export function calculateStats(items, statusField = 'ban') {
	if (!Array.isArray(items)) {
		return {
			total: 0,
			active: 0,
			banned: 0
		};
	}

	const stats = {
		total: items.length,
		active: 0,
		banned: 0
	};

	for (const item of items) {
		if (item?.[statusField]) {
			stats.banned++;
		} else {
			stats.active++;
		}
	}

	return stats;
}
