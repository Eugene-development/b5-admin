import { writable } from 'svelte/store';

/**
 * Toast Store
 *
 * A centralized store for managing toast notifications throughout the application.
 * Provides methods to add, remove, and manage toast notifications.
 */

// Create the writable store
export const toasts = writable([]);

// Counter for generating unique IDs
let toastIdCounter = 0;

/**
 * Generate a unique ID for a toast
 * @returns {string} Unique toast ID
 */
function generateToastId() {
	return `toast-${++toastIdCounter}-${Date.now()}`;
}

/**
 * Add a new toast notification
 * @param {Object} toastConfig - Toast configuration
 * @param {string} toastConfig.type - Toast type: 'success', 'error', 'warning', 'info'
 * @param {string} toastConfig.message - Toast message
 * @param {number} [toastConfig.duration=5000] - Auto-dismiss duration (0 = no auto-dismiss)
 * @param {boolean} [toastConfig.dismissible=true] - Whether toast can be manually dismissed
 * @param {string} [toastConfig.class=''] - Additional CSS classes
 * @returns {string} Toast ID
 */
export function addToast({
	type,
	message,
	duration = 5000,
	dismissible = true,
	class: className = ''
}) {
	const id = generateToastId();

	const toast = {
		id,
		type,
		message,
		duration,
		dismissible,
		class: className,
		isVisible: true,
		onDismiss: () => removeToast(id)
	};

	toasts.update((currentToasts) => [...currentToasts, toast]);

	return id;
}

/**
 * Remove a toast by ID
 * @param {string} toastId - Toast ID to remove
 */
export function removeToast(toastId) {
	toasts.update((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));
}

/**
 * Clear all toasts
 */
export function clearAllToasts() {
	toasts.set([]);
}

/**
 * Add a success toast
 * @param {string} message - Success message
 * @param {Object} [options={}] - Additional options
 * @returns {string} Toast ID
 */
export function addSuccessToast(message, options = {}) {
	return addToast({ type: 'success', message, ...options });
}

/**
 * Add an error toast
 * @param {string} message - Error message
 * @param {Object} [options={}] - Additional options
 * @returns {string} Toast ID
 */
export function addErrorToast(message, options = {}) {
	return addToast({ type: 'error', message, duration: 10000, ...options }); // Error toasts auto-dismiss after 10 seconds
}

/**
 * Add a warning toast
 * @param {string} message - Warning message
 * @param {Object} [options={}] - Additional options
 * @returns {string} Toast ID
 */
export function addWarningToast(message, options = {}) {
	return addToast({ type: 'warning', message, ...options });
}

/**
 * Add an info toast
 * @param {string} message - Info message
 * @param {Object} [options={}] - Additional options
 * @returns {string} Toast ID
 */
export function addInfoToast(message, options = {}) {
	return addToast({ type: 'info', message, ...options });
}

/**
 * Handle API errors and show appropriate toast
 * @param {Error} error - The error object
 * @param {string} [defaultMessage='An error occurred'] - Default error message
 * @returns {string} Toast ID
 */
export function handleApiError(error, defaultMessage = 'An error occurred') {
	console.error('API Error:', error);

	let errorMessage = defaultMessage;

	// Handle different types of errors
	if (error.name === 'TypeError' && error.message.includes('fetch')) {
		errorMessage =
			'Network error: Unable to connect to the server. Please check your connection and try again.';
	} else if (error.response) {
		// GraphQL or API response error
		if (error.response.errors && error.response.errors.length > 0) {
			errorMessage = error.response.errors[0].message;
		} else if (error.response.data && error.response.data.message) {
			errorMessage = error.response.data.message;
		} else {
			errorMessage = `Server error: ${error.message || 'Unknown server error'}`;
		}
	} else if (error.message) {
		errorMessage = error.message;
	}

	return addErrorToast(errorMessage);
}

/**
 * Retry mechanism for failed operations
 * @param {Function} operation - The operation to retry
 * @param {number} [maxRetries=3] - Maximum number of retry attempts
 * @param {number} [delay=1000] - Delay between retries in milliseconds
 * @returns {Promise} Promise that resolves with the operation result
 */
export async function retryOperation(operation, maxRetries = 3, delay = 1000) {
	let lastError;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			const result = await operation();

			// If we had previous failures but this attempt succeeded
			if (attempt > 1) {
				addSuccessToast('Operation completed successfully after retry');
			}

			return result;
		} catch (error) {
			lastError = error;

			if (attempt < maxRetries) {
				addWarningToast(
					`Attempt ${attempt} failed, retrying... (${maxRetries - attempt} attempts remaining)`,
					{ duration: 2000 } // Short duration for retry messages
				);

				// Wait before retrying
				await new Promise((resolve) => setTimeout(resolve, delay));

				// Exponential backoff
				delay *= 1.5;
			}
		}
	}

	// All retries failed
	handleApiError(lastError, `Operation failed after ${maxRetries} attempts`);
	throw lastError;
}
