/**
 * Client-side load function for managers page
 * Handles data fetching and processing with error handling on the client-side
 */

import { getUsersWithPagination } from '$lib/api/agents.js';
import { authState } from '$lib/state/auth.svelte.js';
import { browser } from '$app/environment';

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

function createManagersFallbackData() {
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

function validateManagersData(managersResult) {
	if (!managersResult || typeof managersResult !== 'object') {
		return false;
	}

	if (!Array.isArray(managersResult.data)) {
		return false;
	}

	const paginatorInfo = managersResult.paginatorInfo;
	if (paginatorInfo && typeof paginatorInfo !== 'object') {
		return false;
	}

	return true;
}

function calculateManagerStats(managers) {
	if (!Array.isArray(managers)) {
		return {
			total: 0,
			active: 0,
			banned: 0,
			verified: 0,
			unverified: 0
		};
	}

	const stats = {
		total: managers.length,
		active: 0,
		banned: 0,
		verified: 0,
		unverified: 0
	};

	for (const manager of managers) {
		const status = manager?.status?.toLowerCase() || 'active';
		if (status === 'active') {
			stats.active++;
		} else if (status === 'banned') {
			stats.banned++;
		}

		if (manager?.email_verified_at) {
			stats.verified++;
		} else {
			stats.unverified++;
		}
	}

	return stats;
}

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	const startTime = Date.now();

	if (!browser) {
		return createManagersFallbackData();
	}

	try {
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error('Request timeout')), 30000);
		});

		console.log('🔍 Loading managers data');
		const managersResult = await Promise.race([
			getUsersWithPagination(1000, 1, fetch),
			timeoutPromise
		]);
		console.log('✅ Managers data loaded successfully:', managersResult);

		if (!validateManagersData(managersResult)) {
			throw new Error('Invalid data format received from API');
		}

		const managers = managersResult.data || [];
		const stats = calculateManagerStats(managers);

		const pagination = managersResult.paginatorInfo || {
			currentPage: 1,
			lastPage: 1,
			total: managers.length,
			perPage: 1000,
			hasMorePages: false
		};

		const loadTime = Date.now() - startTime;
		console.log(`Managers data loaded successfully in ${loadTime}ms`);

		return {
			agents: managers,
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

		console.error('Failed to load managers data:', {
			error: apiError.message,
			type: errorType,
			stack: apiError.stack,
			loadTime: Date.now() - startTime
		});

		const fallbackData = createManagersFallbackData();
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
