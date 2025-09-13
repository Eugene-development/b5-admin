/**
 * Centralized error handling utilities for the B5-agent application
 * Provides functions for handling different types of API and network errors
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { goto } from '$app/navigation';
import { browser } from '$app/environment';

/**
 * Error types enumeration for consistent error categorization
 */
export const ERROR_TYPES = {
	VALIDATION: 'validation',
	AUTHENTICATION: 'authentication', 
	AUTHORIZATION: 'authorization',
	NETWORK: 'network',
	SERVER: 'server',
	UNKNOWN: 'unknown'
};

/**
 * HTTP status codes for error handling
 */
export const HTTP_STATUS = {
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	UNPROCESSABLE_ENTITY: 422,
	INTERNAL_SERVER_ERROR: 500,
	BAD_GATEWAY: 502,
	SERVICE_UNAVAILABLE: 503
};

/**
 * Default error messages for different error types
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
const DEFAULT_ERROR_MESSAGES = {
	[ERROR_TYPES.VALIDATION]: 'Please check your input and try again.',
	[ERROR_TYPES.AUTHENTICATION]: 'Authentication failed. Please log in again.',
	[ERROR_TYPES.AUTHORIZATION]: 'Access denied. You do not have permission to perform this action.',
	[ERROR_TYPES.NETWORK]: 'Network error. Please check your connection and try again.',
	[ERROR_TYPES.SERVER]: 'Server error. Please try again later.',
	[ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.'
};

/**
 * Determine error type based on HTTP status code and error details
 * Requirements: 6.1, 6.2, 6.3, 6.4
 * @param {Error} error - Error object with status and data properties
 * @returns {string} Error type from ERROR_TYPES enum
 */
export function getErrorType(error) {
	if (!error) return ERROR_TYPES.UNKNOWN;

	// Network errors (no status code)
	if (!error.status) {
		return ERROR_TYPES.NETWORK;
	}

	// HTTP status code based categorization
	switch (error.status) {
		case HTTP_STATUS.UNAUTHORIZED:
			return ERROR_TYPES.AUTHENTICATION;
		case HTTP_STATUS.FORBIDDEN:
			return ERROR_TYPES.AUTHORIZATION;
		case HTTP_STATUS.UNPROCESSABLE_ENTITY:
			return ERROR_TYPES.VALIDATION;
		case HTTP_STATUS.INTERNAL_SERVER_ERROR:
		case HTTP_STATUS.BAD_GATEWAY:
		case HTTP_STATUS.SERVICE_UNAVAILABLE:
			return ERROR_TYPES.SERVER;
		default:
			return ERROR_TYPES.UNKNOWN;
	}
}

/**
 * Extract user-friendly error message from error object
 * Requirements: 6.1, 6.2, 6.3, 6.4
 * @param {Error} error - Error object
 * @param {string} fallbackMessage - Fallback message if no specific message found
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error, fallbackMessage = null) {
	if (!error) return fallbackMessage || DEFAULT_ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];

	// Use error message if available
	if (error.message) {
		return error.message;
	}

	// Use API response message if available
	if (error.data && error.data.message) {
		return error.data.message;
	}

	// Use default message based on error type
	const errorType = getErrorType(error);
	return fallbackMessage || DEFAULT_ERROR_MESSAGES[errorType];
}

/**
 * Format validation errors from Laravel API response
 * Requirements: 6.1
 * @param {Object} validationErrors - Validation errors object from API
 * @returns {Object} Formatted errors object with field-specific messages
 */
export function formatValidationErrors(validationErrors) {
	if (!validationErrors || typeof validationErrors !== 'object') {
		return {};
	}

	const formattedErrors = {};
	
	for (const [field, messages] of Object.entries(validationErrors)) {
		if (Array.isArray(messages) && messages.length > 0) {
			// Take the first error message for each field
			formattedErrors[field] = messages;
		}
	}

	return formattedErrors;
}

/**
 * Handle validation errors (422 status)
 * Requirements: 6.1
 * @param {Error} error - API error with validation details
 * @returns {Object} Formatted validation errors
 */
export function handleValidationError(error) {
	const validationErrors = error.data?.errors || {};
	return formatValidationErrors(validationErrors);
}

/**
 * Handle authentication errors (401 status)
 * Requirements: 6.2
 * @param {Error} error - Authentication error
 * @param {Object} options - Handling options
 * @param {boolean} options.redirect - Whether to redirect to login page
 * @param {string} options.redirectPath - Custom redirect path
 * @returns {Object} Formatted error object
 */
export function handleAuthenticationError(error, options = {}) {
	const { redirect = true, redirectPath = '/login' } = options;
	
	const errorMessage = getErrorMessage(error, DEFAULT_ERROR_MESSAGES[ERROR_TYPES.AUTHENTICATION]);
	
	// Redirect to login page if in browser and redirect is enabled
	if (redirect && browser) {
		// Use setTimeout to avoid blocking the error handling
		setTimeout(() => {
			goto(redirectPath);
		}, 100);
	}

	return {
		auth: [errorMessage]
	};
}

/**
 * Handle authorization errors (403 status)
 * Requirements: 6.2
 * @param {Error} error - Authorization error
 * @returns {Object} Formatted error object
 */
export function handleAuthorizationError(error) {
	const errorMessage = getErrorMessage(error, DEFAULT_ERROR_MESSAGES[ERROR_TYPES.AUTHORIZATION]);
	
	return {
		auth: [errorMessage]
	};
}

/**
 * Handle network errors (no status code or connection issues)
 * Requirements: 6.3
 * @param {Error} error - Network error
 * @returns {Object} Formatted error object
 */
export function handleNetworkError(error) {
	let errorMessage = DEFAULT_ERROR_MESSAGES[ERROR_TYPES.NETWORK];
	
	// Provide more specific messages for common network issues
	if (error.message) {
		if (error.message.includes('fetch')) {
			errorMessage = 'Unable to connect to the server. Please check your internet connection.';
		} else if (error.message.includes('timeout')) {
			errorMessage = 'Request timed out. Please try again.';
		} else if (error.message.includes('Network error')) {
			errorMessage = error.message;
		}
	}

	return {
		network: [errorMessage]
	};
}

/**
 * Handle server errors (5xx status codes)
 * Requirements: 6.4
 * @param {Error} error - Server error
 * @returns {Object} Formatted error object
 */
export function handleServerError(error) {
	let errorMessage = DEFAULT_ERROR_MESSAGES[ERROR_TYPES.SERVER];
	
	// Provide more specific messages based on status code
	switch (error.status) {
		case HTTP_STATUS.INTERNAL_SERVER_ERROR:
			errorMessage = 'Internal server error. Please try again later.';
			break;
		case HTTP_STATUS.BAD_GATEWAY:
			errorMessage = 'Server is temporarily unavailable. Please try again later.';
			break;
		case HTTP_STATUS.SERVICE_UNAVAILABLE:
			errorMessage = 'Service is temporarily unavailable. Please try again later.';
			break;
		default:
			errorMessage = getErrorMessage(error, DEFAULT_ERROR_MESSAGES[ERROR_TYPES.SERVER]);
	}

	return {
		server: [errorMessage]
	};
}

/**
 * Main error handler function that routes errors to appropriate handlers
 * Requirements: 6.1, 6.2, 6.3, 6.4
 * @param {Error} error - Error object to handle
 * @param {Object} options - Handling options
 * @param {boolean} options.redirectOnAuth - Whether to redirect on auth errors
 * @param {string} options.authRedirectPath - Custom auth redirect path
 * @returns {Object} Formatted error object suitable for UI display
 */
export function handleApiError(error, options = {}) {
	if (!error) {
		return {
			general: [DEFAULT_ERROR_MESSAGES[ERROR_TYPES.UNKNOWN]]
		};
	}

	const errorType = getErrorType(error);

	switch (errorType) {
		case ERROR_TYPES.VALIDATION:
			return handleValidationError(error);
		
		case ERROR_TYPES.AUTHENTICATION:
			return handleAuthenticationError(error, {
				redirect: options.redirectOnAuth !== false,
				redirectPath: options.authRedirectPath
			});
		
		case ERROR_TYPES.AUTHORIZATION:
			return handleAuthorizationError(error);
		
		case ERROR_TYPES.NETWORK:
			return handleNetworkError(error);
		
		case ERROR_TYPES.SERVER:
			return handleServerError(error);
		
		default:
			return {
				general: [getErrorMessage(error, DEFAULT_ERROR_MESSAGES[ERROR_TYPES.UNKNOWN])]
			};
	}
}

/**
 * Create user-friendly error messages for display in UI components
 * Requirements: 6.1, 6.2, 6.3, 6.4
 * @param {Object} errors - Errors object (field -> messages array)
 * @param {string} separator - Separator for multiple messages
 * @returns {Object} Object with formatted display messages
 */
export function createDisplayMessages(errors, separator = ' ') {
	if (!errors || typeof errors !== 'object') {
		return {};
	}

	const displayMessages = {};

	for (const [field, messages] of Object.entries(errors)) {
		if (Array.isArray(messages)) {
			displayMessages[field] = messages.join(separator);
		} else if (typeof messages === 'string') {
			displayMessages[field] = messages;
		}
	}

	return displayMessages;
}

/**
 * Get the first error message from an errors object
 * Useful for displaying a single error message in notifications
 * Requirements: 6.1, 6.2, 6.3, 6.4
 * @param {Object} errors - Errors object
 * @returns {string|null} First error message or null if no errors
 */
export function getFirstErrorMessage(errors) {
	if (!errors || typeof errors !== 'object') {
		return null;
	}

	for (const messages of Object.values(errors)) {
		if (Array.isArray(messages) && messages.length > 0) {
			return messages[0];
		} else if (typeof messages === 'string') {
			return messages;
		}
	}

	return null;
}

/**
 * Check if errors object has any errors
 * Requirements: 6.1, 6.2, 6.3, 6.4
 * @param {Object} errors - Errors object
 * @returns {boolean} True if there are any errors
 */
export function hasErrors(errors) {
	if (!errors || typeof errors !== 'object') {
		return false;
	}

	return Object.keys(errors).length > 0;
}

/**
 * Clear specific error fields from errors object
 * Requirements: 6.1, 6.2, 6.3, 6.4
 * @param {Object} errors - Current errors object
 * @param {string|string[]} fields - Field name(s) to clear
 * @returns {Object} New errors object with specified fields removed
 */
export function clearErrorFields(errors, fields) {
	if (!errors || typeof errors !== 'object') {
		return {};
	}

	const fieldsArray = Array.isArray(fields) ? fields : [fields];
	const newErrors = { ...errors };

	fieldsArray.forEach(field => {
		delete newErrors[field];
	});

	return newErrors;
}

/**
 * Merge multiple error objects into one
 * Requirements: 6.1, 6.2, 6.3, 6.4
 * @param {...Object} errorObjects - Error objects to merge
 * @returns {Object} Merged errors object
 */
export function mergeErrors(...errorObjects) {
	const mergedErrors = {};

	errorObjects.forEach(errors => {
		if (errors && typeof errors === 'object') {
			Object.assign(mergedErrors, errors);
		}
	});

	return mergedErrors;
}