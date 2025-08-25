/**
 * Authentication API functions for B5-Admin
 * Specialized functions for user authentication, registration, and email verification
 */

import { post, get } from './client.js';
import { API_CONFIG } from './config.js';

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {boolean} remember - Whether to remember the user (long-term token)
 * @returns {Promise<Object>} Login response with user data and token
 */
export async function loginUser(email, password, remember = false) {
	try {
		const response = await post(API_CONFIG.endpoints.login, {
			email,
			password,
			remember
		});

		console.log('🔐 Login API response:', response);
		return {
			success: true,
			user: response.data.user || null,
			token: response.data.token || null,
			message: response.data.message || 'Login successful'
		};
	} catch (error) {
		// Handle specific authentication errors
		let message = 'Login failed';

		if (error.status === 401) {
			message = 'Неверный email или пароль';
		} else if (error.status === 422) {
			message = 'Проверьте правильность введенных данных';
		} else if (error.status === 429) {
			message = 'Слишком много попыток входа. Попробуйте позже';
		} else if (error.status === 0) {
			message = error.message; // Network error message
		}

		return {
			success: false,
			message: error.message || message,
			errors: error.data?.errors || {}
		};
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
 * @returns {Promise<Object>} Registration response
 */
export async function registerUser(userData) {
	try {
		const response = await post(API_CONFIG.endpoints.register, userData);

		return {
			success: true,
			user: response.user || null,
			token: response.token || null,
			message: response.message || 'Registration successful'
		};
	} catch (error) {
		// Handle specific registration errors
		let message = 'Registration failed';

		if (error.status === 422) {
			message = 'Проверьте правильность заполнения формы';
		} else if (error.status === 409) {
			message = 'Пользователь с таким email уже существует';
		} else if (error.status === 429) {
			message = 'Слишком много попыток регистрации. Попробуйте позже';
		} else if (error.status === 0) {
			message = error.message; // Network error message
		}

		return {
			success: false,
			message: error.message || message,
			errors: error.data?.errors || {}
		};
	}
}

/**
 * Logout current user
 * @returns {Promise<Object>} Logout response
 */
export async function logoutUser() {
	try {
		const response = await post(API_CONFIG.endpoints.logout, {}, {}, true);

		return {
			success: true,
			message: response.message || 'Logout successful'
		};
	} catch (error) {
		// Even if logout fails on server, we consider it successful locally
		return {
			success: true,
			message: 'Logout completed'
		};
	}
}

/**
 * Get current authenticated user data
 * @returns {Promise<Object>} User data response
 */
export async function getCurrentUser() {
	try {
		const response = await get(API_CONFIG.endpoints.user, {}, true);

		return {
			success: true,
			user: response.user || response,
			message: 'User data retrieved successfully'
		};
	} catch (error) {
		// Handle specific user data errors
		let message = 'Failed to get user data';

		if (error.status === 401) {
			message = 'Сессия истекла. Необходимо войти в систему заново';
		} else if (error.status === 403) {
			message = 'Недостаточно прав для доступа к данным пользователя';
		} else if (error.status === 0) {
			message = error.message; // Network error message
		}

		return {
			success: false,
			message: error.message || message,
			errors: error.data?.errors || {}
		};
	}
}

/**
 * Send email verification notification
 * @returns {Promise<Object>} Email verification response
 */
export async function sendEmailVerification() {
	try {
		const response = await post(API_CONFIG.endpoints.sendEmailVerification, {}, {}, true);

		return {
			success: true,
			message: response.message || 'Verification email sent successfully'
		};
	} catch (error) {
		// Handle specific email verification errors
		let message = 'Failed to send verification email';

		if (error.status === 401) {
			message = 'Необходимо войти в систему для отправки письма подтверждения';
		} else if (error.status === 429) {
			message = 'Слишком много запросов на отправку письма. Попробуйте позже';
		} else if (error.status === 422) {
			message = 'Email адрес уже подтвержден';
		} else if (error.status === 0) {
			message = error.message; // Network error message
		}

		return {
			success: false,
			message: error.message || message,
			errors: error.data?.errors || {}
		};
	}
}

/**
 * Resend email verification notification (alias for sendEmailVerification)
 * @returns {Promise<Object>} Email verification response
 */
export async function resendEmailVerification() {
	return sendEmailVerification();
}

/**
 * Verify email address using verification link parameters
 * @param {string} id - User ID from verification link
 * @param {string} hash - Hash from verification link
 * @param {string} signature - Signature from verification link
 * @returns {Promise<Object>} Email verification response
 */
export async function verifyEmail(id, hash, signature) {
	try {
		const endpoint = `${API_CONFIG.endpoints.verifyEmail}/${id}/${hash}?signature=${signature}`;
		const response = await get(endpoint, {}, true);

		return {
			success: true,
			message: response.message || 'Email verified successfully'
		};
	} catch (error) {
		// Handle specific email verification errors
		let message = 'Email verification failed';

		if (error.status === 401) {
			message = 'Ссылка подтверждения недействительна или истекла';
		} else if (error.status === 404) {
			message = 'Ссылка подтверждения не найдена';
		} else if (error.status === 422) {
			message = 'Неверные параметры подтверждения';
		} else if (error.status === 0) {
			message = error.message; // Network error message
		}

		return {
			success: false,
			message: error.message || message,
			errors: error.data?.errors || {}
		};
	}
}
