/**
 * Client-side load function for agents page with streaming
 * Allows instant page navigation with data loading in background
 * Uses streaming to show loading state while data is being fetched
 * Requirements: Client-side data loading, error handling, authentication state management
 */

import { getUsersWithPagination } from '$lib/api/agents.js';
import { authState } from '$lib/state/auth.svelte.js';
import { browser } from '$app/environment';

/**
 * Error types for better error categorization
 */
const ERROR_TYPES = {
	NETWORK: 'network',
	API: 'api',
	AUTH: 'auth',
	TIMEOUT: 'timeout',
	VALIDATION: 'validation',
	UNKNOWN: 'unknown'
};

/**
 * Categorize error based on error message and properties
 * @param {Error} error - The error to categorize
 * @returns {string} Error type
 */
function categorizeError(error) {
	const message = error.message?.toLowerCase() || '';

	if (message.includes('network') || message.includes('fetch')) {
		return ERROR_TYPES.NETWORK;
	}
	if (message.includes('timeout') || message.includes('aborted')) {
		return ERROR_TYPES.TIMEOUT;
	}
	if (message.includes('unauthorized') || message.includes('forbidden')) {
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
 * Get user-friendly error message based on error type
 * @param {string} errorType - Error type
 * @param {string} originalMessage - Original error message
 * @returns {string} User-friendly error message
 */
function getUserFriendlyErrorMessage(errorType, originalMessage) {
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
 * Create fallback data structure for agents page
 * @returns {Object} Fallback data structure
 */
function createAgentsFallbackData() {
	return {
		agents: [],
		stats: {
			total: 0,
			active: 0,
			banned: 0,
			verified: 0,
			unverified: 0
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
		isLoading: false
	};
}

/**
 * Validate agents data structure
 * @param {any} agentsResult - Agents result from API
 * @returns {boolean} Whether data is valid
 */
function validateAgentsData(agentsResult) {
	if (!agentsResult || typeof agentsResult !== 'object') {
		return false;
	}

	if (!Array.isArray(agentsResult.data)) {
		return false;
	}

	// Validate pagination info structure
	const paginatorInfo = agentsResult.paginatorInfo;
	if (paginatorInfo && typeof paginatorInfo !== 'object') {
		return false;
	}

	return true;
}

/**
 * Safely calculate agent statistics
 * @param {Array} agents - Array of agents
 * @returns {Object} Statistics object
 */
function calculateAgentStats(agents) {
	if (!Array.isArray(agents)) {
		return {
			total: 0,
			active: 0,
			banned: 0,
			verified: 0,
			unverified: 0
		};
	}

	const stats = {
		total: agents.length,
		active: 0,
		banned: 0,
		verified: 0,
		unverified: 0
	};

	for (const agent of agents) {
		// Safely check agent status
		const status = agent?.status?.toLowerCase() || 'active';
		if (status === 'active') {
			stats.active++;
		} else if (status === 'banned') {
			stats.banned++;
		}

		// Safely check email verification status
		if (agent?.email_verified_at) {
			stats.verified++;
		} else {
			stats.unverified++;
		}
	}

	return stats;
}

/**
 * Load agents data asynchronously for streaming
 */
async function loadAgentsData(fetch) {
	const startTime = Date.now();

	try {
		// Add timeout to prevent hanging requests
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 seconds
		});

		// Load agents data - use SvelteKit fetch for proper SSR support
		const agentsResult = await Promise.race([
			getUsersWithPagination(1000, 1, fetch), // Pass SvelteKit fetch function
			timeoutPromise
		]);

		// Validate data structure
		if (!validateAgentsData(agentsResult)) {
			throw new Error('Invalid data format received from API');
		}

		const agents = agentsResult.data || [];

		// Calculate statistics with error handling
		const stats = calculateAgentStats(agents);

		// Ensure pagination info is valid
		const pagination = agentsResult.paginatorInfo || {
			currentPage: 1,
			lastPage: 1,
			total: agents.length,
			perPage: 1000,
			hasMorePages: false
		};

		const loadTime = Date.now() - startTime;

		return {
			agents,
			stats,
			pagination,
			error: null,
			errorType: null,
			canRetry: false,
			isLoading: false,
			loadTime
		};
	} catch (apiError) {
		const errorType = categorizeError(apiError);
		const userMessage = getUserFriendlyErrorMessage(errorType, apiError.message);

		console.error('Failed to load agents data:', {
			error: apiError.message,
			type: errorType,
			stack: apiError.stack,
			loadTime: Date.now() - startTime
		});

		// Return error state with detailed information for graceful error handling
		const fallbackData = createAgentsFallbackData();
		return {
			...fallbackData,
			error: userMessage,
			errorType,
			canRetry: errorType !== ERROR_TYPES.AUTH, // Don't allow retry for auth errors
			originalError: apiError.message, // For debugging
			loadTime: Date.now() - startTime
		};
	}
}

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	// Return immediately with streamed Promise
	// Page will render instantly, data will load in background
	return {
		// Don't await - return Promise for streaming!
		agentsData: loadAgentsData(fetch)
	};
}
