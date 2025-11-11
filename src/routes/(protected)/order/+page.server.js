/**
 * Server-side load function with SSR for orders page with streaming
 * Data is rendered on the server for SEO and better performance
 */

import { error } from '@sveltejs/kit';
import { getOrders, getCompaniesForDropdown, getProjectsForDropdown } from '$lib/api/orders.js';

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
 * Load orders data asynchronously for streaming
 */
async function loadOrdersData(fetch) {
	try {
		// Add timeout to prevent hanging requests
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error('Request timeout')), 30000);
		});

		// Load orders data, companies, and projects in parallel with timeout
		const [rawOrders, companies, projects] = await Promise.race([
			Promise.all([
				getOrders(1000, 1, fetch).catch((err) => {
					console.error('Error loading orders:', err);
					return [];
				}),
				getCompaniesForDropdown(fetch).catch((err) => {
					console.error('Error loading companies:', err);
					return [];
				}),
				getProjectsForDropdown(fetch).catch((err) => {
					console.error('Error loading projects:', err);
					return [];
				})
			]),
			timeoutPromise
		]);

		// Sort orders by created_at in descending order (newest first)
		const sortedOrders = [...(Array.isArray(rawOrders) ? rawOrders : [])].sort((a, b) => {
			const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
			const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
			return dateB - dateA;
		});

		// Add sequential numbers to orders (1, 2, 3, ...)
		const orders = sortedOrders.map((order, index) => ({
			...order,
			sequentialNumber: index + 1
		}));

		return {
			orders,
			companies: Array.isArray(companies) ? companies : [],
			projects: Array.isArray(projects) ? projects : [],
			error: null,
			errorType: null,
			canRetry: false,
			isLoading: false
		};
	} catch (apiError) {
		const errorType = categorizeError(apiError);
		const userMessage = getUserFriendlyErrorMessage(errorType, apiError.message);

		console.error('Failed to load orders data:', {
			error: apiError.message,
			type: errorType,
			stack: apiError.stack
		});

		// Return error state
		return {
			orders: [],
			companies: [],
			projects: [],
			error: userMessage,
			errorType,
			canRetry: errorType !== ERROR_TYPES.AUTH,
			isLoading: false
		};
	}
}

export async function load({ fetch }) {
	// Return immediately with streamed Promise
	// Page will render instantly, data will load in background
	return {
		// Don't await - return Promise for streaming!
		ordersData: loadOrdersData(fetch)
	};
}
