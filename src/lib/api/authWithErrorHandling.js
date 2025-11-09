/**
 * Enhanced Authentication API with Error Handling
 *
 * Wraps the base auth API functions with centralized error handling,
 * retry mechanisms, and toast notifications.
 */

import {
	loginUser as baseLoginUser,
	registerUser as baseRegisterUser,
	logoutUser as baseLogoutUser,
	getCurrentUser as baseGetCurrentUser,
	sendEmailVerification as baseSendEmailVerification,
	resendEmailVerification as baseResendEmailVerification,
	verifyEmail as baseVerifyEmail
} from './auth.js';

import {
	executeCriticalAuthOperation,
	handleAuthError,
	formatValidationErrors,
	CRITICAL_OPERATIONS,
	AUTH_ERROR_MESSAGES
} from '../utils/authErrorHandler.js';

import { addSuccessToast } from '../utils/toastStore.js';

/**
 * Enhanced login with error handling and retry mechanism
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {boolean} remember - Whether to remember the user
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Login response
 */
export async function loginUser(email, password, remember = false, options = {}) {
	const { showSuccessToast = true, showErrorToast = true, maxRetries = 2 } = options;

	try {
		const result = await executeCriticalAuthOperation(
			() => baseLoginUser(email, password, remember),
			CRITICAL_OPERATIONS.LOGIN,
			{
				maxRetries,
				showRetryToasts: showErrorToast,
				showToast: showErrorToast
			}
		);

		if (result.success && showSuccessToast) {
			addSuccessToast('Вход выполнен успешно!');
		}

		// Format validation errors if present
		if (result.errors) {
			result.formattedErrors = formatValidationErrors(result.errors);
		}

		return result;
	} catch (error) {
		// Error already handled by executeCriticalAuthOperation
		return {
			success: false,
			message: error.message || AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
			errors: error.data?.errors || {},
			formattedErrors: formatValidationErrors(error.data?.errors || {})
		};
	}
}

/**
 * Enhanced registration with error handling
 * @param {Object} userData - User registration data
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Registration response
 */
export async function registerUser(userData, options = {}) {
	const {
		showSuccessToast = true,
		showErrorToast = true,
		maxRetries = 1 // Registration usually shouldn't be retried automatically
	} = options;

	try {
		const result = await executeCriticalAuthOperation(
			() => baseRegisterUser(userData),
			CRITICAL_OPERATIONS.REGISTER,
			{
				maxRetries,
				showRetryToasts: showErrorToast,
				showToast: showErrorToast
			}
		);

		if (result.success && showSuccessToast) {
			addSuccessToast('Регистрация прошла успешно! Проверьте email для подтверждения.');
		}

		// Format validation errors if present
		if (result.errors) {
			result.formattedErrors = formatValidationErrors(result.errors);
		}

		return result;
	} catch (error) {
		// Error already handled by executeCriticalAuthOperation
		return {
			success: false,
			message: error.message || 'Ошибка регистрации',
			errors: error.data?.errors || {},
			formattedErrors: formatValidationErrors(error.data?.errors || {})
		};
	}
}

/**
 * Enhanced logout with error handling
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Logout response
 */
export async function logoutUser(options = {}) {
	const {
		showSuccessToast = true,
		showErrorToast = false, // Usually don't show error toasts for logout
		maxRetries = 2
	} = options;

	try {
		const result = await executeCriticalAuthOperation(
			() => baseLogoutUser(),
			CRITICAL_OPERATIONS.LOGOUT,
			{
				maxRetries,
				showRetryToasts: showErrorToast,
				showToast: showErrorToast
			}
		);

		if (result.success && showSuccessToast) {
			addSuccessToast('Выход выполнен успешно');
		}

		return result;
	} catch (error) {
		// For logout, we usually want to succeed even if server call fails
		if (showSuccessToast) {
			addSuccessToast('Выход выполнен');
		}

		return {
			success: true,
			message: 'Выход выполнен'
		};
	}
}

/**
 * Enhanced get current user with error handling
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} User data response
 */
export async function getCurrentUser(options = {}) {
	const { showErrorToast = true, maxRetries = 2, redirectOnAuth = true } = options;

	try {
		const result = await executeCriticalAuthOperation(
			() => baseGetCurrentUser(),
			CRITICAL_OPERATIONS.GET_USER,
			{
				maxRetries,
				showRetryToasts: showErrorToast,
				showToast: showErrorToast,
				redirectOnAuth
			}
		);

		return result;
	} catch (error) {
		// Error already handled by executeCriticalAuthOperation
		return {
			success: false,
			message: error.message || 'Не удалось получить данные пользователя',
			errors: error.data?.errors || {}
		};
	}
}

/**
 * Enhanced send email verification with error handling
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Email verification response
 */
export async function sendEmailVerification(options = {}) {
	const { showSuccessToast = true, showErrorToast = true, maxRetries = 2 } = options;

	try {
		const result = await executeCriticalAuthOperation(
			() => baseSendEmailVerification(),
			CRITICAL_OPERATIONS.EMAIL_VERIFICATION,
			{
				maxRetries,
				showRetryToasts: showErrorToast,
				showToast: showErrorToast
			}
		);

		if (result.success && showSuccessToast) {
			addSuccessToast('Письмо подтверждения отправлено на ваш email');
		}

		return result;
	} catch (error) {
		// Error already handled by executeCriticalAuthOperation
		return {
			success: false,
			message: error.message || 'Не удалось отправить письмо подтверждения',
			errors: error.data?.errors || {}
		};
	}
}

/**
 * Enhanced resend email verification with error handling
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Email verification response
 */
export async function resendEmailVerification(options = {}) {
	const { showSuccessToast = true, showErrorToast = true, maxRetries = 2 } = options;

	try {
		const result = await executeCriticalAuthOperation(
			() => baseResendEmailVerification(),
			CRITICAL_OPERATIONS.EMAIL_VERIFICATION,
			{
				maxRetries,
				showRetryToasts: showErrorToast,
				showToast: showErrorToast
			}
		);

		if (result.success && showSuccessToast) {
			addSuccessToast('Письмо подтверждения отправлено повторно');
		}

		return result;
	} catch (error) {
		// Error already handled by executeCriticalAuthOperation
		return {
			success: false,
			message: error.message || 'Не удалось повторно отправить письмо подтверждения',
			errors: error.data?.errors || {}
		};
	}
}

/**
 * Enhanced email verification with error handling
 * @param {string} id - User ID from verification link
 * @param {string} hash - Hash from verification link
 * @param {string} signature - Signature from verification link
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Email verification response
 */
export async function verifyEmail(id, hash, signature, options = {}) {
	const {
		showSuccessToast = true,
		showErrorToast = true,
		maxRetries = 1 // Email verification links are usually one-time use
	} = options;

	try {
		const result = await executeCriticalAuthOperation(
			() => baseVerifyEmail(id, hash, signature),
			CRITICAL_OPERATIONS.EMAIL_VERIFICATION,
			{
				maxRetries,
				showRetryToasts: showErrorToast,
				showToast: showErrorToast
			}
		);

		if (result.success && showSuccessToast) {
			addSuccessToast('Email адрес успешно подтвержден!');
		}

		return result;
	} catch (error) {
		// Error already handled by executeCriticalAuthOperation
		return {
			success: false,
			message: error.message || 'Не удалось подтвердить email адрес',
			errors: error.data?.errors || {}
		};
	}
}

/**
 * Batch operation handler for multiple auth operations
 * @param {Array} operations - Array of operation objects
 * @param {Object} options - Batch options
 * @returns {Promise<Array>} Array of operation results
 */
export async function batchAuthOperations(operations, options = {}) {
	const { stopOnFirstError = false, showProgressToasts = false } = options;

	const results = [];

	for (let i = 0; i < operations.length; i++) {
		const { operation, args = [], options: opOptions = {} } = operations[i];

		if (showProgressToasts) {
			addSuccessToast(`Выполняется операция ${i + 1} из ${operations.length}...`);
		}

		try {
			const result = await operation(...args, opOptions);
			results.push({ success: true, result });
		} catch (error) {
			const errorResult = { success: false, error };
			results.push(errorResult);

			if (stopOnFirstError) {
				break;
			}
		}
	}

	return results;
}

/**
 * Health check for authentication system
 * @returns {Promise<Object>} Health check result
 */
export async function authHealthCheck() {
	try {
		// Try to get current user without showing toasts
		const result = await getCurrentUser({
			showErrorToast: false,
			maxRetries: 1,
			redirectOnAuth: false
		});

		return {
			healthy: result.success,
			authenticated: result.success,
			message: result.success
				? 'Authentication system is healthy'
				: 'Authentication system has issues',
			details: result
		};
	} catch (error) {
		return {
			healthy: false,
			authenticated: false,
			message: 'Authentication system is not responding',
			error: error.message
		};
	}
}
