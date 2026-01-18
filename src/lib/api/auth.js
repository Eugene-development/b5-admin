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
		console.log('🔐 Login API request:', { email, remember });
		
		// Call SvelteKit endpoint that sets httpOnly cookie
		const response = await fetch('/api/auth/login-jwt', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ email, password, remember }),
			credentials: 'include'
		});

		const data = await response.json();

		console.log('🔐 Login API response:', { success: data.success, hasUser: !!data.user });

		if (!response.ok || !data.success) {
			return {
				success: false,
				message: data.message || 'Login failed',
				errors: data.errors || {}
			};
		}

		return {
			success: true,
			user: data.user || null,
			token: data.token || null,
			message: data.message || 'Login successful'
		};
	} catch (error) {
		console.error('🔐 Login API error:', error);
		// Handle specific authentication errors
		let message = 'Login failed';

		if (error.status === 401) {
			message = 'Неверный email или пароль';
		} else if (error.status === 422) {
			message = 'Проверьте правильность введенных данных';
		} else if (error.status === 429) {
			message = 'Слишком много попыток входа. Попробуйте позже';
		}

		return {
			success: false,
			message: error.message || message,
			errors: {}
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
 * @param {string} userData.region - User region (optional)
 * @param {string} userData.phone - User phone (optional)
 * @param {boolean} userData.terms_accepted - Terms acceptance
 * @returns {Promise<Object>} Registration response
 */
export async function registerUser(userData) {
	try {
		console.log('🔐 Registration API call started', {
			endpoint: API_CONFIG.endpoints.register,
			userData: { ...userData, password: '***', password_confirmation: '***' }
		});

		const response = await post(API_CONFIG.endpoints.register, userData);

		console.log('🔐 Registration API response:', response);

		return {
			success: true,
			user: response.user || response.data?.user || null,
			token: response.token || response.data?.token || null,
			message: response.message || response.data?.message || 'Registration successful'
		};
	} catch (error) {
		console.error('🔐 Registration API error:', error);
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
		console.log('🚪 Calling logout API...');
		
		// Call SvelteKit endpoint to clear httpOnly cookies
		try {
			await fetch('/api/auth/logout-jwt', {
				method: 'POST',
				credentials: 'include'
			});
			console.log('🍪 Cookies cleared via SvelteKit endpoint');
		} catch (cookieError) {
			console.warn('⚠️ Failed to clear cookies:', cookieError);
		}

		// Also call backend logout API to invalidate token
		const response = await post(API_CONFIG.endpoints.logout, {}, {}, true);
		console.log('🚪 Logout API response:', response);

		return {
			success: true,
			message: response.message || 'Logout successful'
		};
	} catch (error) {
		console.error('🚪 Logout API error:', error);
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
			user: response.user || response.data?.user || response,
			status: 200,
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
			status: error.status ?? null,
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
 * @returns {Promise<Object>} Email verification response
 */
export async function verifyEmail(id, hash) {
	try {
		const endpoint = `${API_CONFIG.endpoints.verifyEmail}/${id}/${hash}`;
		const response = await get(endpoint, {}, false);

		return {
			success: true,
			message: response.message || 'Email verified successfully'
		};
	} catch (error) {
		// Handle specific email verification errors
		let message = 'Email verification failed';

		if (error.status === 401) {
			message = 'Ссылка подтверждения недействительна или истекла';
		} else if (error.status === 403) {
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

/**
 * Request password reset link
 * @param {string} email - User email
 * @returns {Promise<Object>} Password reset request response
 */
export async function forgotPassword(email) {
	try {
		const response = await post(API_CONFIG.endpoints.forgotPassword, { email }, {}, false);

		return {
			success: true,
			message: response.message || 'Ссылка для сброса пароля отправлена на ваш email'
		};
	} catch (error) {
		// Handle specific forgot password errors
		let message = 'Не удалось отправить ссылку для сброса пароля';

		if (error.status === 422) {
			message = 'Некорректный email адрес';
		} else if (error.status === 429) {
			message = 'Слишком много запросов. Попробуйте позже';
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
 * Reset password using token
 * @param {string} token - Password reset token
 * @param {string} email - User email
 * @param {string} password - New password
 * @param {string} password_confirmation - Password confirmation
 * @returns {Promise<Object>} Password reset response
 */
export async function resetPassword(token, email, password, password_confirmation) {
	try {
		const response = await post(
			API_CONFIG.endpoints.resetPassword,
			{
				token,
				email,
				password,
				password_confirmation
			},
			{},
			false
		);

		return {
			success: true,
			message: response.message || 'Пароль изменен'
		};
	} catch (error) {
		// Handle specific reset password errors
		let message = 'Не удалось сбросить пароль';

		if (error.status === 422) {
			message = 'Проверьте правильность введенных данных';
		} else if (error.status === 400) {
			message = 'Недействительный или истекший токен';
		} else if (error.status === 404) {
			message = 'Пользователь не найден';
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
