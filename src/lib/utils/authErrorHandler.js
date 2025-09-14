/**
 * Authentication Error Handler Utilities
 * 
 * Provides centralized error handling for authentication-related operations
 * with integration to the toast system and retry mechanisms.
 */

import { 
	addErrorToast, 
	addWarningToast, 
	addSuccessToast,
	retryOperation as baseRetryOperation 
} from './toastStore.js';
import { ApiError } from '../api/client.js';
import { removeAuthToken } from '../api/config.js';
import { goto } from '$app/navigation';

/**
 * Authentication-specific error messages
 */
export const AUTH_ERROR_MESSAGES = {
	NETWORK_ERROR: 'Произошла ошибка при подключении к серверу',
	TIMEOUT_ERROR: 'Превышено время ожидания ответа сервера',
	INVALID_CREDENTIALS: 'Неверный email или пароль',
	EMAIL_ALREADY_EXISTS: 'Пользователь с таким email уже существует',
	EMAIL_NOT_VERIFIED: 'Необходимо подтвердить email адрес',
	UNAUTHORIZED: 'Необходимо войти в систему',
	FORBIDDEN: 'Недостаточно прав доступа',
	VALIDATION_ERROR: 'Ошибка валидации данных',
	SERVER_ERROR: 'Произошла ошибка сервера',
	TOKEN_EXPIRED: 'Сессия истекла, необходимо войти заново',
	RATE_LIMITED: 'Слишком много запросов, попробуйте позже'
};

/**
 * Critical operations that should have retry mechanism
 */
export const CRITICAL_OPERATIONS = {
	LOGIN: 'login',
	LOGOUT: 'logout',
	REGISTER: 'register',
	EMAIL_VERIFICATION: 'email_verification',
	GET_USER: 'get_user'
};

/**
 * Handle authentication-specific API errors
 * @param {Error|ApiError} error - The error object
 * @param {string} operation - The operation that failed (optional)
 * @param {Object} options - Additional options
 * @param {boolean} options.showToast - Whether to show toast notification (default: true)
 * @param {boolean} options.redirectOnAuth - Whether to redirect on auth errors (default: true)
 * @param {string} options.customMessage - Custom error message to display
 * @returns {Object} Processed error information
 */
export function handleAuthError(error, operation = null, options = {}) {
	const {
		showToast = true,
		redirectOnAuth = true,
		customMessage = null
	} = options;

	console.error('Authentication Error:', { error, operation, options });

	let errorMessage = customMessage || AUTH_ERROR_MESSAGES.SERVER_ERROR;
	let errorType = 'generic';
	let shouldRedirect = false;
	let validationErrors = null;

	// Handle different types of errors
	if (error instanceof ApiError) {
		switch (error.status) {
			case 0:
				// Network error
				errorMessage = AUTH_ERROR_MESSAGES.NETWORK_ERROR;
				errorType = 'network';
				break;

			case 401:
				// Unauthorized
				errorMessage = AUTH_ERROR_MESSAGES.UNAUTHORIZED;
				errorType = 'unauthorized';
				shouldRedirect = redirectOnAuth;
				
				// Clear auth token and redirect to login
				if (redirectOnAuth) {
					removeAuthToken();
					setTimeout(() => {
						const currentPath = window.location.pathname;
						if (currentPath !== '/login') {
							goto(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
						}
					}, 100);
				}
				break;

			case 403:
				// Forbidden
				errorMessage = AUTH_ERROR_MESSAGES.FORBIDDEN;
				errorType = 'forbidden';
				break;

			case 408:
				// Timeout
				errorMessage = AUTH_ERROR_MESSAGES.TIMEOUT_ERROR;
				errorType = 'timeout';
				break;

			case 422:
				// Validation errors
				errorMessage = AUTH_ERROR_MESSAGES.VALIDATION_ERROR;
				errorType = 'validation';
				validationErrors = error.data?.errors || {};
				
				// Handle specific validation messages
				if (error.data?.message) {
					errorMessage = error.data.message;
				}
				break;

			case 429:
				// Rate limited
				errorMessage = AUTH_ERROR_MESSAGES.RATE_LIMITED;
				errorType = 'rate_limited';
				break;

			default:
				// Generic server error
				if (error.data?.message) {
					errorMessage = error.data.message;
				}
				errorType = 'server';
		}
	} else if (error.name === 'TypeError' && error.message.includes('fetch')) {
		// Network error
		errorMessage = AUTH_ERROR_MESSAGES.NETWORK_ERROR;
		errorType = 'network';
	} else if (error.name === 'AbortError') {
		// Timeout error
		errorMessage = AUTH_ERROR_MESSAGES.TIMEOUT_ERROR;
		errorType = 'timeout';
	} else if (error.message) {
		// Generic error with message
		errorMessage = error.message;
		errorType = 'generic';
	}

	// Show toast notification if requested
	if (showToast) {
		addErrorToast(errorMessage, {
			duration: errorType === 'network' || errorType === 'timeout' ? 0 : 5000
		});
	}

	return {
		message: errorMessage,
		type: errorType,
		shouldRedirect,
		validationErrors,
		originalError: error
	};
}

/**
 * Handle network-specific errors with enhanced messaging
 * @param {Error} error - The network error
 * @param {Object} options - Additional options
 * @returns {Object} Processed error information
 */
export function handleNetworkError(error, options = {}) {
	const { showToast = true, operation = null } = options;

	console.error('Network Error:', { error, operation });

	let errorMessage = AUTH_ERROR_MESSAGES.NETWORK_ERROR;
	
	// Provide more specific network error messages
	if (error.message.includes('Failed to fetch')) {
		errorMessage = 'Не удается подключиться к серверу. Проверьте подключение к интернету.';
	} else if (error.message.includes('NetworkError')) {
		errorMessage = 'Ошибка сети. Проверьте подключение и попробуйте снова.';
	} else if (error.name === 'AbortError') {
		errorMessage = AUTH_ERROR_MESSAGES.TIMEOUT_ERROR;
	}

	if (showToast) {
		addErrorToast(errorMessage, { duration: 0 }); // Don't auto-dismiss network errors
	}

	return {
		message: errorMessage,
		type: 'network',
		shouldRedirect: false,
		validationErrors: null,
		originalError: error
	};
}

/**
 * Handle timeout errors specifically
 * @param {Error} error - The timeout error
 * @param {Object} options - Additional options
 * @returns {Object} Processed error information
 */
export function handleTimeoutError(error, options = {}) {
	const { showToast = true, operation = null } = options;

	console.error('Timeout Error:', { error, operation });

	const errorMessage = `${AUTH_ERROR_MESSAGES.TIMEOUT_ERROR}${operation ? ` при выполнении операции: ${operation}` : ''}`;

	if (showToast) {
		addErrorToast(errorMessage, { duration: 0 });
	}

	return {
		message: errorMessage,
		type: 'timeout',
		shouldRedirect: false,
		validationErrors: null,
		originalError: error
	};
}

/**
 * Enhanced retry mechanism for authentication operations
 * @param {Function} operation - The operation to retry
 * @param {string} operationType - Type of operation (from CRITICAL_OPERATIONS)
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.initialDelay - Initial delay between retries in ms (default: 1000)
 * @param {boolean} options.exponentialBackoff - Use exponential backoff (default: true)
 * @param {boolean} options.showRetryToasts - Show toast notifications for retries (default: true)
 * @returns {Promise} Promise that resolves with the operation result
 */
export async function retryAuthOperation(operation, operationType, options = {}) {
	const {
		maxRetries = 3,
		initialDelay = 1000,
		exponentialBackoff = true,
		showRetryToasts = true
	} = options;

	console.log('Starting retry operation:', { operationType, maxRetries });

	let lastError;
	let delay = initialDelay;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			const result = await operation();

			// If we had previous failures but this attempt succeeded
			if (attempt > 1 && showRetryToasts) {
				addSuccessToast(`Операция "${operationType}" выполнена успешно после ${attempt} попыток`);
			}

			return result;
		} catch (error) {
			lastError = error;
			console.error(`Attempt ${attempt} failed:`, error);

			// Don't retry on certain types of errors
			if (error instanceof ApiError) {
				// Don't retry validation errors, auth errors, or forbidden errors
				if ([401, 403, 422].includes(error.status)) {
					console.log('Not retrying due to error type:', error.status);
					throw error;
				}
			}

			if (attempt < maxRetries) {
				if (showRetryToasts) {
					addWarningToast(
						`Попытка ${attempt} не удалась, повторяем... (осталось попыток: ${maxRetries - attempt})`,
						{ duration: 3000 }
					);
				}

				// Wait before retrying
				await new Promise((resolve) => setTimeout(resolve, delay));

				// Apply exponential backoff
				if (exponentialBackoff) {
					delay = Math.min(delay * 1.5, 10000); // Cap at 10 seconds
				}
			}
		}
	}

	// All retries failed
	const errorInfo = handleAuthError(lastError, operationType, { 
		showToast: showRetryToasts,
		customMessage: `Операция "${operationType}" не удалась после ${maxRetries} попыток`
	});

	throw lastError;
}

/**
 * Wrapper for critical authentication operations with automatic retry
 * @param {Function} operation - The operation to execute
 * @param {string} operationType - Type of operation (from CRITICAL_OPERATIONS)
 * @param {Object} options - Options for retry and error handling
 * @returns {Promise} Promise that resolves with the operation result
 */
export async function executeCriticalAuthOperation(operation, operationType, options = {}) {
	const isCritical = Object.values(CRITICAL_OPERATIONS).includes(operationType);
	
	if (isCritical) {
		return retryAuthOperation(operation, operationType, options);
	} else {
		// For non-critical operations, just execute once with error handling
		try {
			return await operation();
		} catch (error) {
			handleAuthError(error, operationType, options);
			throw error;
		}
	}
}

/**
 * Validate and format validation errors for display
 * @param {Object} validationErrors - Validation errors from API response
 * @returns {Object} Formatted validation errors
 */
export function formatValidationErrors(validationErrors) {
	if (!validationErrors || typeof validationErrors !== 'object') {
		return {};
	}

	const formatted = {};
	
	for (const [field, messages] of Object.entries(validationErrors)) {
		if (Array.isArray(messages) && messages.length > 0) {
			formatted[field] = messages[0]; // Take the first error message
		} else if (typeof messages === 'string') {
			formatted[field] = messages;
		}
	}

	return formatted;
}

/**
 * Check if an error is recoverable (can be retried)
 * @param {Error|ApiError} error - The error to check
 * @returns {boolean} True if the error is recoverable
 */
export function isRecoverableError(error) {
	if (error instanceof ApiError) {
		// Don't retry these status codes
		const nonRecoverableStatuses = [400, 401, 403, 404, 422];
		return !nonRecoverableStatuses.includes(error.status);
	}

	// Network errors and timeouts are generally recoverable
	if (error.name === 'TypeError' && error.message.includes('fetch')) {
		return true;
	}

	if (error.name === 'AbortError') {
		return true;
	}

	// Default to non-recoverable for unknown errors
	return false;
}

/**
 * Create a debounced error handler to prevent spam
 * @param {Function} handler - The error handler function
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function} Debounced error handler
 */
export function createDebouncedErrorHandler(handler, delay = 1000) {
	let timeoutId = null;
	let lastError = null;

	return function(error, ...args) {
		lastError = error;

		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(() => {
			handler(lastError, ...args);
			timeoutId = null;
			lastError = null;
		}, delay);
	};
}