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
	loginError: null,
	registerError: null,
	emailVerificationError: null,
	
	// Token data
	token: null,
	
	// Initialization status
	initialized: false
});

/**
 * Initialize authentication state from localStorage
 * Should be called when the app starts
 */
export async function initializeAuth() {
	if (authState.initialized) return;
	
	authState.loading = true;
	authState.error = null;
	
	try {
		// Check if we have a stored token
		if (hasAuthToken()) {
			// Try to get current user data to validate token
			const result = await getCurrentUser();
			
			if (result.success && result.user) {
				// Token is valid, restore authentication state
				authState.user = result.user;
				authState.isAuthenticated = true;
				authState.emailVerified = result.user.email_verified || false;
				authState.token = getAuthToken();
				
				// Store user data
				setUserData(result.user);
			} else {
				// Token is invalid, clear it
				removeAuthToken();
				clearAuthState();
			}
		} else {
			// No token, clear state
			clearAuthState();
		}
	} catch (error) {
		console.error('Error initializing auth:', error);
		// Clear invalid state
		removeAuthToken();
		clearAuthState();
	} finally {
		authState.loading = false;
		authState.initialized = true;
	}
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
		const result = await loginUser(email, password, remember);
		
		if (result.success) {
			// Update auth state
			authState.user = result.user;
			authState.isAuthenticated = true;
			authState.emailVerified = result.user?.email_verified || false;
			authState.token = result.token?.access_token || null;
			
			// Store token and user data
			if (result.token) {
				setAuthToken(result.token);
			}
			if (result.user) {
				setUserData(result.user);
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
 * @param {string} userData.password - User password
 * @param {string} userData.password_confirmation - Password confirmation
 * @param {string} userData.city - User city
 * @param {boolean} userData.terms_accepted - Terms acceptance
 * @returns {Promise<boolean>} Success status
 */
export async function register(userData) {
	authState.registerLoading = true;
	authState.registerError = null;
	authState.error = null;
	
	try {
		const result = await registerUser(userData);
		
		if (result.success) {
			// Update auth state
			authState.user = result.user;
			authState.isAuthenticated = true;
			authState.emailVerified = result.user?.email_verified || false;
			authState.token = result.token?.access_token || null;
			
			// Store token and user data
			if (result.token) {
				setAuthToken(result.token);
			}
			if (result.user) {
				setUserData(result.user);
			}
			
			return true;
		} else {
			// Registration failed
			authState.registerError = result.message;
			authState.error = result.message;
			return false;
		}
	} catch (error) {
		console.error('Registration error:', error);
		authState.registerError = error.message || 'Произошла ошибка при регистрации';
		authState.error = authState.registerError;
		return false;
	} finally {
		authState.registerLoading = false;
	}
}

/**
 * Logout current user
 * @returns {Promise<boolean>} Success status
 */
export async function logout() {
	authState.logoutLoading = true;
	authState.error = null;
	
	try {
		// Call logout API (even if it fails, we'll clear local state)
		await logoutUser();
		
		// Clear authentication state
		clearAuthState();
		removeAuthToken();
		
		return true;
	} catch (error) {
		console.error('Logout error:', error);
		// Even if API call fails, clear local state
		clearAuthState();
		removeAuthToken();
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
	
	authState.loading = true;
	authState.error = null;
	
	try {
		const result = await getCurrentUser();
		
		if (result.success && result.user) {
			// Update user data
			authState.user = result.user;
			authState.isAuthenticated = true;
			authState.emailVerified = result.user.email_verified || false;
			
			// Update stored user data
			setUserData(result.user);
			
			return true;
		} else {
			// Token is invalid
			clearAuthState();
			removeAuthToken();
			return false;
		}
	} catch (error) {
		console.error('Check auth error:', error);
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
		authState.emailVerificationError = error.message || 'Произошла ошибка при отправке письма подтверждения';
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
		authState.emailVerificationError = error.message || 'Произошла ошибка при повторной отправке письма подтверждения';
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
 * @param {string} signature - Signature from verification link
 * @returns {Promise<boolean>} Success status
 */
export async function verifyEmailAddress(id, hash, signature) {
	authState.emailVerificationLoading = true;
	authState.emailVerificationError = null;
	authState.error = null;
	
	try {
		const result = await verifyEmail(id, hash, signature);
		
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
	authState.loginError = null;
	authState.registerError = null;
	authState.emailVerificationError = null;
}

/**
 * Get current authentication status
 * @returns {boolean} Whether user is authenticated
 */
export function isAuthenticated() {
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
	return authState.loading || 
		   authState.loginLoading || 
		   authState.registerLoading || 
		   authState.logoutLoading || 
		   authState.emailVerificationLoading;
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