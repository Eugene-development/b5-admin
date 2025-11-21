/**
 * Server-side load function with SSR for clients page with streaming
 * Data is rendered on the server for SEO and better performance
 * Uses streaming to show loading state while data is being fetched
 */

import { getClientsWithPagination } from '$lib/api/clients.js';
import { addSequentialNumbers } from '$lib/utils/sequentialNumber.js';

const ERROR_TYPES = {
	NETWORK: 'network',
	API: 'api',
	AUTH: 'auth',
	TIMEOUT: 'timeout',
	VALIDATION: 'validation',
	UNKNOWN: 'unknown'
};

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

function createClientsFallbackData() {
	return {
		clients: [],
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
		isLoading: false
	};
}

function validateClientsData(clientsResult) {
	if (!clientsResult || typeof clientsResult !== 'object') {
		return false;
	}

	if (!Array.isArray(clientsResult.data)) {
		return false;
	}

	const paginatorInfo = clientsResult.paginatorInfo;
	if (paginatorInfo && typeof paginatorInfo !== 'object') {
		return false;
	}

	return true;
}

function calculateClientStats(clients) {
	if (!Array.isArray(clients)) {
		return {
			total: 0,
			active: 0,
			banned: 0
		};
	}

	const stats = {
		total: clients.length,
		active: 0,
		banned: 0
	};

	for (const client of clients) {
		if (client?.ban) {
			stats.banned++;
		} else {
			stats.active++;
		}
	}

	return stats;
}

/**
 * Load clients data asynchronously for streaming
 */
async function loadClientsData(fetch) {
	const startTime = Date.now();

	try {
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error('Request timeout')), 30000);
		});

		const clientsResult = await Promise.race([
			getClientsWithPagination(1000, 1, fetch),
			timeoutPromise
		]);

		if (!validateClientsData(clientsResult)) {
			throw new Error('Invalid data format received from API');
		}

		const rawClients = clientsResult.data || [];

		// Add sequential numbers based on created_at date
		const clients = addSequentialNumbers(rawClients);

		const stats = calculateClientStats(clients);

		const pagination = clientsResult.paginatorInfo || {
			currentPage: 1,
			lastPage: 1,
			total: clients.length,
			perPage: 1000,
			hasMorePages: false
		};

		const loadTime = Date.now() - startTime;

		return {
			clients: clients,
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

		console.error('Failed to load clients data:', {
			error: apiError.message,
			type: errorType,
			stack: apiError.stack,
			loadTime: Date.now() - startTime
		});

		const fallbackData = createClientsFallbackData();
		return {
			...fallbackData,
			error: userMessage,
			errorType,
			canRetry: errorType !== ERROR_TYPES.AUTH,
			originalError: apiError.message,
			loadTime: Date.now() - startTime
		};
	}
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	// JWT tokens are stored in localStorage and not available on server
	// Return empty data immediately and let client load data via onMount
	// This prevents 401 errors during SSR
	return {
		clientsData: Promise.resolve(createClientsFallbackData())
	};
}
