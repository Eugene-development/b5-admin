/**
 * Server-side load function with SSR for actions page with streaming
 * Data is rendered on the server for SEO and better performance
 */

import { error } from '@sveltejs/kit';
import { refreshActions, getCompaniesForActions } from '$lib/api/actions.js';

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
 * Load actions data asynchronously for streaming
 */
async function loadActionsData() {
	try {
		// Add timeout to prevent hanging requests
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error('Request timeout')), 30000);
		});

		// Load actions data and companies in parallel with timeout
		const [actionsData, companies] = await Promise.race([
			Promise.all([refreshActions(), getCompaniesForActions()]),
			timeoutPromise
		]);

		// Validate data structure
		if (!Array.isArray(actionsData)) {
			throw new Error('Invalid data format received from API');
		}

		// Transform actions data to match table format
		const actions = actionsData.map((action) => ({
			id: action.id,
			company_name: action.company?.name || 'Не указано',
			action_name: action.name,
			phone: action.company?.phone || '',
			contact_person: action.company?.contact_person || '',
			region: action.company?.region || 'Не указан',
			start_date: action.start,
			end_date: action.end,
			description: action.description,
			comment: action.is_active ? 'Акция активна' : 'Акция неактивна',
			is_active: action.is_active,
			company_id: action.company_id,
			created_at: action.created_at,
			updated_at: action.updated_at,
			// Keep original data for editing
			_original: action
		}));

		return {
			actions,
			companies: Array.isArray(companies) ? companies : [],
			error: null,
			errorType: null,
			canRetry: false,
			isLoading: false
		};
	} catch (apiError) {
		const errorType = categorizeError(apiError);
		const userMessage = getUserFriendlyErrorMessage(errorType, apiError.message);

		console.error('Failed to load actions data:', {
			error: apiError.message,
			type: errorType,
			stack: apiError.stack
		});

		// Return error state
		return {
			actions: [],
			companies: [],
			error: userMessage,
			errorType,
			canRetry: errorType !== ERROR_TYPES.AUTH,
			isLoading: false
		};
	}
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ parent }) {
	try {
		// Get authentication data from parent layout (fast)
		const { user, isAuthenticated } = await parent();

		// Check authentication
		if (!isAuthenticated || !user) {
			throw error(401, {
				message: 'Необходима авторизация для просмотра акций'
			});
		}

		// Return immediately with streamed Promise
		// Page will render instantly, data will load in background
		return {
			// Don't await - return Promise for streaming!
			actionsData: loadActionsData()
		};
	} catch (err) {
		// Handle authentication errors
		if (err.status === 401) {
			throw err;
		}

		console.error('Client load error for actions page:', {
			error: err.message,
			stack: err.stack
		});

		throw error(500, {
			message: 'Внутренняя ошибка при загрузке страницы акций'
		});
	}
}
