/**
 * Authentication State Store for B5-Admin
 * Centralized state management using Svelte 5 runes
 * Integrates with Laravel Sanctum API for authentication
 */

import {
	loginUser,
	registerUser,
	logoutUser,
	getCurrentUser,
	sendEmailVerification,
	resendEmailVerification,
	verifyEmail
} from '../api/auth.js';
import {
	getAuthToken,
	setAuthToken,
	removeAuthToken,
	getUserData,
	setUserData,
	hasAuthToken
} from '../api/config.js';
import { goto } from '$app/navigation';

/**
 * Authentication state using Svelte 5 runes
 */
export const authState = $state({
	// User data
	user: null,

	// Authentication status
	isAuthenticated: false,

	// Email verification status
	emailVerified: false,

	// Loading states
	loading: false,
	loginLoading: false,
	registerLoading: false,
	logoutLoading: false,
	emailVerificationLoading: false,

	// Error states
	error: null,
	errors: {},
	loginError: null,
	registerError: null,
	emailVerificationError: null,

	// Token data
	token: null,

	// Initialization status
	initialized: false
});

/**
 * Normalize user data to ensure consistent structure
 * Converts user.status to user.userStatus for compatibility
 */
function normalizeUserData(user) {
	if (!user) return null;

	// If status exists but userStatus doesn't, map status to userStatus
	if (user.status && !user.userStatus) {
		user.userStatus = user.status;
	}

	return user;
}

/**
 * Initialize authentication state from localStorage
 * Should be called when the app starts
 */
export async function initializeAuth() {
	if (authState.initialized) {
		return;
	}

	// Immediately restore from localStorage if available (before setting loading state)
	const hasToken = hasAuthToken();
	const token = getAuthToken();
	const storedUser = normalizeUserData(getUserData());

	// Restore state immediately from localStorage if we have both token and user data
	if (hasToken && storedUser) {
		authState.user = storedUser;
		authState.isAuthenticated = true;
		authState.emailVerified = storedUser.email_verified || false;
		authState.token = token;
		authState.initialized = true; // Mark as initialized early to prevent flicker
	} else if (!hasToken) {
		// No token, clear state immediately

		clearAuthState();
		authState.initialized = true;
		return;
	}

	// Now set loading for background API verification (if we have a token)
	if (hasToken) {
		authState.loading = true;
		authState.error = null;

		try {
			// Try to get fresh data from API to verify token and update user data

			try {
				const result = await getCurrentUser();

				if (result.success && result.user) {
					// Update with fresh data
					const normalizedUser = normalizeUserData(result.user);
					authState.user = normalizedUser;
					authState.isAuthenticated = true;
					authState.emailVerified = normalizedUser.email_verified || false;
					authState.token = getAuthToken();

					// Update stored user data
					setUserData(normalizedUser);
				} else if (result.status === 401 || result.status === 403) {
					// Token is invalid, clear it
					removeAuthToken();
					clearAuthState();
				} else if (result.status === 0) {
					// Network error, keep the restored state if we have it
					// State already restored from localStorage above, no need to do anything
				}
				// For other errors, keep the restored state
			} catch (apiError) {
				// State already restored from localStorage above, no need to do anything
			}
		} catch (error) {
			console.error('Error during API verification:', error);
			// Keep the state already restored from localStorage
		} finally {
			authState.loading = false;
		}
	}

	authState.initialized = true;
}

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {boolean} remember - Whether to remember the user
 * @returns {Promise<boolean>} Success status
 */
export async function login(email, password, remember = false) {
	authState.loginLoading = true;
	authState.loginError = null;
	authState.error = null;

	try {
		// JWT doesn't need CSRF protection - removed initCsrf()
		const result = await loginUser(email, password, remember);

		if (result.success) {
			// Update auth state - add safety checks and normalize user data
			const normalizedUser = normalizeUserData(result.user);
			authState.user = normalizedUser || null;
			authState.isAuthenticated = !!normalizedUser;
			authState.emailVerified = normalizedUser?.email_verified || false;
			// Handle JWT token - it comes as a string in result.token
			authState.token =
				typeof result.token === 'string'
					? result.token
					: result.token?.access_token || result.token || null;

			// Store token and user data
			if (result.token) {
				// setAuthToken now handles both string and object tokens
				setAuthToken(result.token);
			}
			if (normalizedUser) {
				setUserData(normalizedUser);
			}

			return true;
		} else {
			// Login failed
			authState.loginError = result.message;
			authState.error = result.message;
			return false;
		}
	} catch (error) {
		console.error('Login error:', error);
		authState.loginError = error.message || 'Произошла ошибка при входе в систему';
		authState.error = authState.loginError;
		return false;
	} finally {
		authState.loginLoading = false;
	}
}

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User name
 * @param {string} userData.email - User email
 * @param {string} userData.phone - User phone (optional)
 * @param {string} userData.password - User password
 * @param {string} userData.password_confirmation - Password confirmation
 * @param {string} userData.region - User region
 * @param {boolean} userData.terms_accepted - Terms acceptance
 * @returns {Promise<boolean>} Success status
 */
export async function register(userData) {
	authState.registerLoading = true;
	authState.registerError = null;
	authState.error = null;

	try {
		// JWT doesn't need CSRF protection - removed initCsrf()
		const result = await registerUser(userData);

		if (result.success) {
			// Update auth state and normalize user data
			const normalizedUser = normalizeUserData(result.user);
			authState.user = normalizedUser;
			authState.isAuthenticated = true;
			authState.emailVerified = normalizedUser?.email_verified || false;
			authState.token = result.token?.access_token || null;

			// Store token and user data
			if (result.token) {
				setAuthToken(result.token);
			}
			if (normalizedUser) {
				setUserData(normalizedUser);
			}

			return true;
		} else {
			// Registration failed
			authState.registerError = result.message;
			authState.error = result.message;
			authState.errors = result.errors || {};
			return false;
		}
	} catch (error) {
		console.error('Registration error:', error);
		authState.registerError = error.message || 'Произошла ошибка при регистрации';
		authState.error = authState.registerError;
		authState.errors = error.errors || {};
		return false;
	} finally {
		authState.registerLoading = false;
	}
}

/**
 * Logout current user
 * @param {Object} options - Logout options
 * @param {string} options.redirectTo - Path to redirect after logout
 * @returns {Promise<boolean>} Success status
 */
export async function logout(options = {}) {
	authState.logoutLoading = true;
	authState.error = null;

	try {
		// Call logout API (even if it fails, we'll clear local state)
		await logoutUser();

		// Clear authentication state
		clearAuthState();
		removeAuthToken();

		// Handle post-logout redirect if in browser
		if (typeof window !== 'undefined' && options.redirectTo) {
			await goto(options.redirectTo);
		}

		return true;
	} catch (error) {
		console.error('Logout error:', error);
		// Even if API call fails, clear local state
		clearAuthState();
		removeAuthToken();

		// Handle post-logout redirect even on error
		if (typeof window !== 'undefined' && options.redirectTo) {
			await goto(options.redirectTo);
		}

		return true; // We consider logout successful even if API fails
	} finally {
		authState.logoutLoading = false;
	}
}

/**
 * Check authentication status and refresh user data
 * @returns {Promise<boolean>} Authentication status
 */
export async function checkAuth() {
	if (!hasAuthToken()) {
		clearAuthState();
		return false;
	}

	// If we don't have user data in state but have token, restore from localStorage first
	if (!authState.user && hasAuthToken()) {
		const storedUser = normalizeUserData(getUserData());
		if (storedUser) {
			authState.user = storedUser;
			authState.isAuthenticated = true;
			authState.emailVerified = storedUser.email_verified || false;
		}
	}

	authState.loading = true;
	authState.error = null;

	try {
		const result = await getCurrentUser();

		if (result.success && result.user) {
			// Update user data and normalize
			const normalizedUser = normalizeUserData(result.user);
			authState.user = normalizedUser;
			authState.isAuthenticated = true;
			authState.emailVerified = normalizedUser.email_verified || false;

			// Update stored user data
			setUserData(normalizedUser);

			return true;
		} else if (result.status === 0) {
			// Network error, keep current/stored state if present
			return authState.isAuthenticated;
		} else if (result.status === 401 || result.status === 403) {
			// Token is invalid
			clearAuthState();
			removeAuthToken();
			return false;
		} else {
			// Other errors, keep current state
			return authState.isAuthenticated;
		}
	} catch (error) {
		console.error('Check auth error:', error);
		// If network error, try to keep stored state
		const storedUser = normalizeUserData(getUserData());
		if (storedUser && hasAuthToken()) {
			authState.user = storedUser;
			authState.isAuthenticated = true;
			authState.emailVerified = storedUser.email_verified || false;
			return true;
		}
		// Token is likely invalid
		clearAuthState();
		removeAuthToken();
		return false;
	} finally {
		authState.loading = false;
	}
}

/**
 * Send email verification notification
 * @returns {Promise<boolean>} Success status
 */
export async function sendEmailVerificationNotification() {
	authState.emailVerificationLoading = true;
	authState.emailVerificationError = null;
	authState.error = null;

	try {
		const result = await sendEmailVerification();

		if (result.success) {
			return true;
		} else {
			authState.emailVerificationError = result.message;
			authState.error = result.message;
			return false;
		}
	} catch (error) {
		console.error('Send email verification error:', error);
		authState.emailVerificationError =
			error.message || 'Произошла ошибка при отправке письма подтверждения';
		authState.error = authState.emailVerificationError;
		return false;
	} finally {
		authState.emailVerificationLoading = false;
	}
}

/**
 * Resend email verification notification
 * @returns {Promise<boolean>} Success status
 */
export async function resendEmailVerificationNotification() {
	authState.emailVerificationLoading = true;
	authState.emailVerificationError = null;
	authState.error = null;

	try {
		const result = await resendEmailVerification();

		if (result.success) {
			return true;
		} else {
			authState.emailVerificationError = result.message;
			authState.error = result.message;
			return false;
		}
	} catch (error) {
		console.error('Resend email verification error:', error);
		authState.emailVerificationError =
			error.message || 'Произошла ошибка при повторной отправке письма подтверждения';
		authState.error = authState.emailVerificationError;
		return false;
	} finally {
		authState.emailVerificationLoading = false;
	}
}

/**
 * Verify email address using verification link parameters
 * @param {string} id - User ID from verification link
 * @param {string} hash - Hash from verification link
 * @returns {Promise<boolean>} Success status
 */
export async function verifyEmailAddress(id, hash) {
	authState.emailVerificationLoading = true;
	authState.emailVerificationError = null;
	authState.error = null;

	try {
		const result = await verifyEmail(id, hash);

		if (result.success) {
			// Mark email as verified
			markEmailAsVerified();
			return true;
		} else {
			authState.emailVerificationError = result.message;
			authState.error = result.message;
			return false;
		}
	} catch (error) {
		console.error('Email verification error:', error);
		authState.emailVerificationError = error.message || 'Произошла ошибка при подтверждении email';
		authState.error = authState.emailVerificationError;
		return false;
	} finally {
		authState.emailVerificationLoading = false;
	}
}

/**
 * Mark email as verified (called after successful email verification)
 */
export function markEmailAsVerified() {
	if (authState.user) {
		authState.user.email_verified = true;
		authState.user.email_verified_at = new Date().toISOString();
		authState.emailVerified = true;

		// Update stored user data
		setUserData(authState.user);
	}
}

/**
 * Clear all error states
 */
export function clearError() {
	authState.error = null;
	authState.errors = {};
	authState.loginError = null;
	authState.registerError = null;
	authState.emailVerificationError = null;
}

/**
 * Clear authentication state (internal helper)
 */
function clearAuthState() {
	authState.user = null;
	authState.isAuthenticated = false;
	authState.emailVerified = false;
	authState.token = null;
	authState.error = null;
	authState.errors = {};
	authState.loginError = null;
	authState.registerError = null;
	authState.emailVerificationError = null;
}

/**
 * Update authentication state from server data
 * Safe to call from $effect blocks
 * @param {Object} serverData - Server data containing user and authentication status
 */
export function updateAuthStateFromServer(serverData) {
	if (serverData?.user && serverData?.isAuthenticated) {
		const normalizedUser = normalizeUserData(serverData.user);
		authState.user = normalizedUser;
		authState.isAuthenticated = true;
		authState.emailVerified = normalizedUser?.email_verified || false;
		authState.initialized = true;

		// Store user data in localStorage for offline access
		if (typeof window !== 'undefined') {
			setUserData(normalizedUser);
		}
	} else {
		// No server data - user is not authenticated
		authState.user = null;
		authState.isAuthenticated = false;
		authState.emailVerified = false;
		authState.initialized = true;

		// Clear localStorage
		if (typeof window !== 'undefined') {
			removeAuthToken();
		}
	}
}

/**
 * Get current authentication status
 * @returns {boolean} Whether user is authenticated
 */
export function isAuthenticated() {
	// console.log('isAuthenticated check:', {
	// 	isAuthenticated: authState.isAuthenticated,
	// 	user: authState.user,
	// 	token: authState.token,
	// 	hasToken: hasAuthToken(),
	// 	storedToken: getAuthToken(),
	// 	storedUser: getUserData()
	// });
	return authState.isAuthenticated;
}

/**
 * Get current user data
 * @returns {Object|null} Current user data or null
 */
export function getCurrentUserData() {
	return authState.user;
}

/**
 * Check if current user's email is verified
 * @returns {boolean} Email verification status
 */
export function isEmailVerified() {
	return authState.emailVerified;
}

/**
 * Check if any authentication operation is in progress
 * @returns {boolean} Loading status
 */
export function isLoading() {
	return (
		authState.loading ||
		authState.loginLoading ||
		authState.registerLoading ||
		authState.logoutLoading ||
		authState.emailVerificationLoading
	);
}

/**
 * Get current error message
 * @returns {string|null} Current error message
 */
export function getError() {
	return authState.error;
}

/**
 * Get validation errors from last operation
 * @returns {Object} Validation errors object
 */
export function getValidationErrors() {
	// This would be populated by the API responses
	// For now, return empty object as errors are handled in the API layer
	return {};
}
