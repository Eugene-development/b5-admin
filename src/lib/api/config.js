/**
 * API Configuration for B5-Admin Authentication
 * Manages endpoints and settings for Laravel Sanctum integration
 */

import { AUTH_API_URL } from '../config/api.js';
import { getAuthApiUrl } from '../config/domain.js';

/**
 * Get dynamic base URL for auth API
 * Uses domain-based detection on client, falls back to env variable
 * @returns {string} Auth API base URL
 */
function getBaseUrl() {
	// On client-side, use dynamic domain detection
	if (typeof window !== 'undefined') {
		return getAuthApiUrl();
	}
	// On server-side without request context, use env variable
	return AUTH_API_URL;
}

// API Configuration
export const API_CONFIG = {
	// Use getter for dynamic baseUrl resolution
	get baseUrl() {
		return getBaseUrl();
	},
	timeout: 10000, // 10 seconds
	endpoints: {
		// Authentication endpoints
		register: '/api/register',
		login: '/api/login',
		logout: '/api/logout',
		user: '/api/user',

		// Email verification endpoints
		sendEmailVerification: '/api/email/verification-notification',
		verifyEmail: '/api/email/verify',

		// Password reset endpoints
		forgotPassword: '/api/forgot-password',
		resetPassword: '/api/reset-password'
	},
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json'
	}
};

// Token storage keys
export const STORAGE_KEYS = {
	AUTH_TOKEN: 'b5_auth_token', // Changed to match JWT implementation
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

		// Handle both string token (JWT) and object with access_token
		try {
			const parsed = JSON.parse(tokenData);
			return parsed.access_token || parsed.token || tokenData;
		} catch {
			// If parsing fails, it's probably a plain string token (JWT)
			return tokenData;
		}
	} catch (error) {
		console.error('Error getting auth token:', error);
		return null;
	}
}

/**
 * Set authentication token in localStorage
 * @param {Object|string} tokenData - Token data (can be string or object from API response)
 */
export function setAuthToken(tokenData) {
	// Check if we're in browser environment
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
		return;
	}

	try {
		// If tokenData is a string (JWT token), store it directly
		if (typeof tokenData === 'string') {
			localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokenData);
		} else if (tokenData && typeof tokenData === 'object') {
			// If it's an object, extract the token
			const token = tokenData.token || tokenData.access_token;
			if (token) {
				localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
			} else {
				// Fallback: store the whole object as JSON
				localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(tokenData));
			}
		}
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
 * @returns {Object} Headers object with Authorization header or empty object if no token
 */
export function getAuthHeaders() {
	const token = getAuthToken();
	if (!token) return {};

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
