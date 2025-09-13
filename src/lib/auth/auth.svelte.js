/**
 * Authentication state management module using Svelte 5 runes
 * Provides reactive state for user authentication, loading states, and error handling
 */

// Reactive state using Svelte 5 runes
let user = $state(null);
let errors = $state({});
let isLoading = $state(false);

/**
 * Authentication state object with getters for reactive access
 */
export const authState = {
	/**
	 * Get current user data
	 * @returns {Object|null} Current user object or null if not authenticated
	 */
	get user() {
		return user;
	},

	/**
	 * Check if user is authenticated
	 * @returns {boolean} True if user is authenticated, false otherwise
	 */
	get isAuthenticated() {
		return !!user;
	},

	/**
	 * Get current loading state
	 * @returns {boolean} True if any authentication operation is in progress
	 */
	get isLoading() {
		return isLoading;
	},

	/**
	 * Get current errors
	 * @returns {Object} Object containing error messages by field
	 */
	get errors() {
		return errors;
	}
};

/**
 * Set the current user
 * @param {Object|null} newUser - User object or null to clear user
 */
export function setUser(newUser) {
	user = newUser;
}

/**
 * Set error messages
 * @param {Object} newErrors - Object containing error messages by field
 */
export function setErrors(newErrors) {
	errors = newErrors || {};
}

/**
 * Set loading state
 * @param {boolean} loading - Loading state
 */
export function setLoading(loading) {
	isLoading = !!loading;
}

/**
 * Clear all error messages
 */
export function clearErrors() {
	errors = {};
}

/**
 * Clear all authentication state (user, errors, loading)
 */
export function clearAuthState() {
	user = null;
	errors = {};
	isLoading = false;
}

/**
 * Clear specific error fields
 * Requirements: 6.1
 * @param {string|string[]} fields - Field name(s) to clear
 */
export function clearErrorFields(fields) {
	errors = clearFields(errors, fields);
}

/**
 * Check if there are any errors in the current state
 * Requirements: 6.1, 6.2, 6.3, 6.4
 * @returns {boolean} True if there are any errors
 */
export function hasAuthErrors() {
	return hasErrors(errors);
}

/**
 * Get the first error message from current errors
 * Requirements: 6.1, 6.2, 6.3, 6.4
 * @returns {string|null} First error message or null
 */
export function getFirstAuthError() {
	return getFirstErrorMessage(errors);
}

import { api, createHttpClient } from '../utils/http-client.js';
import { goto } from '$app/navigation';

/**
 * Create HTTP client with custom unauthorized handler for auth module
 * Requirements: 4.4, 5.1, 5.2, 5.3, 5.4
 */
const authHttpClient = createHttpClient({
	onUnauthorized: async () => {
		// Clear authentication state when unauthorized
		clearAuthState();

		// Set auth error only if we're not on a public page
		const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
		const isPublicPage = ['/', '/login', '/register'].includes(currentPath);

		if (!isPublicPage) {
			const authError = { auth: ['Session expired. Please log in again.'] };
			setErrors(authError);

			// Redirect to login page only if not on public page
			if (typeof window !== 'undefined') {
				await goto('/login');
			}
		}
	}
});

/**
 * Initialize authentication state from server data
 * @param {Object} serverData - Data from server load function
 */
export function initAuthFromServer(serverData) {
	if (serverData?.user && serverData?.isAuthenticated) {
		user = serverData.user;
		clearErrors();
	}
}

/**
 * Initialize CSRF protection by fetching CSRF cookie
 * Requirements: 5.1, 5.2, 5.4
 * @returns {Promise<void>}
 */
export async function initCsrf() {
	return api.initCsrf();
}

import {
	handleApiError as centralizedHandleApiError,
	clearErrorFields as clearFields,
	hasErrors,
	getFirstErrorMessage
} from '../utils/errorHandler.svelte.js';

/**
 * Handle API errors and update state accordingly
 * Uses centralized error handler for consistent error processing
 * Requirements: 6.1, 6.2, 6.3, 6.4
 * @param {Error} error - API error
 * @returns {Object} Error object with formatted messages
 */
function handleApiError(error) {
	setLoading(false);

	// Use centralized error handler with auth-specific options
	const formattedErrors = centralizedHandleApiError(error, {
		redirectOnAuth: false // Don't redirect here, let the HTTP client handle it
	});

	setErrors(formattedErrors);
	return formattedErrors;
}

/**
 * Login user with email and password
 * Requirements: 2.1, 2.2, 2.3
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} options - Login options
 * @param {string} options.redirectTo - Path to redirect after successful login
 * @returns {Promise<Object>} User data on success
 * @throws {Error} Login error
 */
export async function login(email, password, options = {}) {
	setLoading(true);
	clearErrors();

	try {
		// Initialize CSRF protection first
		await initCsrf();

		const data = await authHttpClient.post('/api/login', { email, password });

		if (data.success && data.user) {
			setUser(data.user);
			setLoading(false);

			// Handle post-login redirect if in browser
			if (typeof window !== 'undefined' && options.redirectTo) {
				await goto(options.redirectTo);
			}

			return data.user;
		} else {
			throw new Error(data.message || 'Login failed');
		}
	} catch (error) {
		handleApiError(error);
		throw error;
	}
}

/**
 * Register new user
 * Requirements: 1.1, 1.2, 1.3
 * @param {string} name - User name
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} passwordConfirmation - Password confirmation
 * @param {Object} options - Registration options
 * @param {string} options.redirectTo - Path to redirect after successful registration
 * @returns {Promise<Object>} User data on success
 * @throws {Error} Registration error
 */
export async function register(name, email, password, passwordConfirmation, options = {}) {
	setLoading(true);
	clearErrors();

	try {
		// Initialize CSRF protection first
		await initCsrf();

		const data = await authHttpClient.post('/api/register', {
			name,
			email,
			password,
			password_confirmation: passwordConfirmation
		});

		if (data.success && data.user) {
			setUser(data.user);
			setLoading(false);

			// Handle post-registration redirect if in browser
			if (typeof window !== 'undefined' && options.redirectTo) {
				await goto(options.redirectTo);
			}

			return data.user;
		} else {
			throw new Error(data.message || 'Registration failed');
		}
	} catch (error) {
		handleApiError(error);
		throw error;
	}
}

/**
 * Logout current user
 * Requirements: 3.1, 3.2, 3.3
 * @param {Object} options - Logout options
 * @param {string} options.redirectTo - Path to redirect after logout
 * @returns {Promise<void>}
 * @throws {Error} Logout error
 */
export async function logout(options = {}) {
	setLoading(true);
	clearErrors();

	try {
		await authHttpClient.post('/api/logout');

		// Clear authentication state regardless of response
		clearAuthState();

		// Handle post-logout redirect if in browser
		if (typeof window !== 'undefined' && options.redirectTo) {
			await goto(options.redirectTo);
		}
	} catch (error) {
		// Clear state even if logout request fails
		clearAuthState();

		// Handle post-logout redirect even on error
		if (typeof window !== 'undefined' && options.redirectTo) {
			await goto(options.redirectTo);
		}

		// Only throw error if it's not a 401 (already logged out)
		if (error.status !== 401) {
			handleApiError(error);
			throw error;
		}
	}
}

/**
 * Get current authenticated user data from auth state
 * User data is now loaded from server in +layout.server.js
 * Requirements: 2.1, 4.1, 4.2
 * @returns {Promise<Object|null>} User data or null if not authenticated
 */
export async function getUser() {
	// Return current user from auth state
	// No longer makes fetch requests - data comes from server
	return authState.user;
}
