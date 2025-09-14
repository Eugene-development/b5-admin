/**
 * API Configuration for B5-Admin Authentication
 * Manages endpoints and settings for Laravel Sanctum integration
 */

// API Configuration
export const API_CONFIG = {
	baseUrl: import.meta.env.VITE_API_AUTH,
	timeout: 10000, // 10 seconds
	endpoints: {
		// Authentication endpoints
		register: '/api/register',
		login: '/api/login',
		logout: '/api/logout',
		user: '/api/user',

		// Email verification endpoints
		sendEmailVerification: '/api/email/verification-notification',
		verifyEmail: '/api/email/verify'
	},
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json'
	}
};

// Token storage keys
export const STORAGE_KEYS = {
	AUTH_TOKEN: 'b5_admin_auth_token',
	USER_DATA: 'b5_admin_user_data'
};

/**
 * Get authentication token from localStorage
 * @returns {string|null} The stored auth token or null if not found
 */
export function getAuthToken() {
	// Check if we're in browser environment
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
		return null;
	}

	try {
		const tokenData = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
		if (!tokenData) return null;

		const parsed = JSON.parse(tokenData);
		return parsed.access_token || null;
	} catch (error) {
		console.error('Error getting auth token:', error);
		return null;
	}
}

/**
 * Set authentication token in localStorage
 * @param {Object} tokenData - Token data object from API response
 * @param {string} tokenData.access_token - The Bearer token
 * @param {string} tokenData.token_type - Token type (usually "Bearer")
 * @param {string|null} tokenData.expires_at - Token expiration date
 */
export function setAuthToken(tokenData) {
	// Check if we're in browser environment
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
		return;
	}

	try {
		localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(tokenData));
	} catch (error) {
		console.error('Error setting auth token:', error);
	}
}

/**
 * Remove authentication token from localStorage
 */
export function removeAuthToken() {
	// Check if we're in browser environment
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
		return;
	}

	try {
		localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
		localStorage.removeItem(STORAGE_KEYS.USER_DATA);
	} catch (error) {
		console.error('Error removing auth token:', error);
	}
}

/**
 * Check if authentication token exists
 * @returns {boolean} True if token exists, false otherwise
 */
export function hasAuthToken() {
	return getAuthToken() !== null;
}

/**
 * Get authorization headers for API requests
 * @returns {Object|null} Headers object with Authorization header or null if no token
 */
export function getAuthHeaders() {
	const token = getAuthToken();
	if (!token) return null;

	return {
		Authorization: `Bearer ${token}`
	};
}

/**
 * Get user data from localStorage
 * @returns {Object|null} User data object or null if not found
 */
export function getUserData() {
	// Check if we're in browser environment
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
		return null;
	}

	try {
		const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
		return userData ? JSON.parse(userData) : null;
	} catch (error) {
		console.error('Error getting user data:', error);
		return null;
	}
}

/**
 * Set user data in localStorage
 * @param {Object} userData - User data object
 */
export function setUserData(userData) {
	// Check if we're in browser environment
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
		return;
	}

	try {
		localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
	} catch (error) {
		console.error('Error setting user data:', error);
	}
}
