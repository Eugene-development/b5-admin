/**
 * Server-side load function with SSR for technical specifications page with streaming
 * Data is rendered on the server for SEO and better performance
 */

import { createTechnicalSpecificationsApiWithFetch } from '$lib/api/technicalSpecifications.js';
import { addSequentialNumbers } from '$lib/utils/sequentialNumber.js';

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
 */
function categorizeError(err) {
	const message = err.message?.toLowerCase() || '';

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
 * Load technical specifications data asynchronously for streaming
 */
async function loadTzData(fetch, cookies) {
	try {
		// Add timeout to prevent hanging requests
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error('Request timeout')), 30000);
		});

		// Load TZ data with timeout
		const api = createTechnicalSpecificationsApiWithFetch(fetch, cookies);
		const rawTzList = await Promise.race([api.getTechnicalSpecifications(), timeoutPromise]);

		// Validate data structure
		if (!Array.isArray(rawTzList)) {
			throw new Error('Invalid data format received from API');
		}

		// Add sequential numbers based on created_at date
		const tzList = addSequentialNumbers(rawTzList);

		return {
			tzList,
			error: null,
			errorType: null,
			canRetry: false,
			isLoading: false
		};
	} catch (apiError) {
		const errorType = categorizeError(apiError);
		const userMessage = getUserFriendlyErrorMessage(errorType, apiError.message);

		console.error('Failed to load technical specifications:', {
			error: apiError.message,
			type: errorType,
			stack: apiError.stack
		});

		// Return error state
		return {
			tzList: [],
			error: userMessage,
			errorType,
			canRetry: errorType !== ERROR_TYPES.AUTH,
			isLoading: false
		};
	}
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, cookies }) {
	// Return immediately with streamed Promise
	// Page will render instantly, data will load in background
	return {
		// Don't await - return Promise for streaming!
		tzData: loadTzData(fetch, cookies)
	};
}
