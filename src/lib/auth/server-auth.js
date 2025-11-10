/**
 * Server-side authentication helpers for protected routes
 * These helpers should be used in +page.server.js files to enforce
 * authentication and authorization checks during SSR
 */

import { error } from '@sveltejs/kit';

/**
 * Allowed user types for admin panel access
 */
const ALLOWED_USER_TYPES = ['Админ', 'Куратор', 'Менеджер'];

/**
 * Check if user is authenticated and has required permissions
 * Throws appropriate SvelteKit errors if checks fail
 *
 * @param {Object} parentData - Data from parent layout (should include user and isAuthenticated)
 * @param {Object} options - Options for the check
 * @param {string[]} options.allowedTypes - Array of allowed user types (default: ['Админ', 'Куратор', 'Менеджер'])
 * @param {string} options.errorMessage - Custom error message for auth failure
 * @throws {error} 401 if not authenticated, 403 if wrong user type
 * @returns {Object} User data if authenticated and authorized
 */
export function requireServerAuth(parentData, options = {}) {
	const {
		allowedTypes = ALLOWED_USER_TYPES,
		errorMessage = 'Необходима авторизация для доступа к этой странице'
	} = options;

	const { user, isAuthenticated } = parentData;

	// Check if user is authenticated
	if (!isAuthenticated || !user) {
		throw error(401, {
			message: errorMessage
		});
	}

	// Check user type - allow access ONLY for specified types
	const userType = user?.type;
	if (!userType || !allowedTypes.includes(userType)) {
		throw error(403, {
			message: `Доступ запрещён. Страница доступна только для: ${allowedTypes.join(', ')}.`
		});
	}

	return user;
}

/**
 * Async wrapper for requireServerAuth that can be used in load functions
 *
 * @param {Function} parent - SvelteKit parent() function
 * @param {Object} options - Options for the check
 * @returns {Promise<Object>} User data if authenticated and authorized
 */
export async function requireServerAuthAsync(parent, options = {}) {
	const parentData = await parent();
	return requireServerAuth(parentData, options);
}
