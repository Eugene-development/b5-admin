/**
 * Server-side load function for managers page with httpOnly cookie authentication
 * Data is rendered on the server using JWT token from httpOnly cookies
 */

import { makeServerGraphQLRequest, createFallbackData, categorizeError, getUserFriendlyErrorMessage } from '$lib/api/server.js';

/**
 * GraphQL query to fetch all users (will filter for managers on server)
 */
const USERS_QUERY = `
	{
		users {
			id
			region
			name
			email
			email_verified_at
			created_at
			updated_at
			status_id
			userStatus {
				id
				value
				slug
				color
				icon
			}
		}
	}
`;

/**
 * Load managers data from GraphQL API
 */
async function loadManagersData(token, fetch) {
	const startTime = Date.now();

	try {
		console.log('📊 Managers SSR: Starting data load...');

		// Make GraphQL request with JWT token from httpOnly cookie
		const data = await makeServerGraphQLRequest(token, USERS_QUERY, {}, fetch);
		const allUsers = data.users || [];

		// Filter only managers based on userStatus.slug
		const managers = allUsers
			.filter((user) => user.userStatus?.slug === 'managers')
			.map((user) => ({
				...user,
				status: 'active' // Status will be determined by ban/unban mutations on client
			}))
			.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

		// Calculate stats
		const stats = {
			total: managers.length,
			active: managers.length,
			banned: 0,
			verified: managers.filter((m) => m.email_verified_at).length,
			unverified: managers.filter((m) => !m.email_verified_at).length
		};

		const loadTime = Date.now() - startTime;

		console.log(`✅ Managers SSR: Loaded ${managers.length} managers in ${loadTime}ms`);

		return {
			agents: managers, // Keep as 'agents' for compatibility with existing page component
			stats,
			pagination: {
				currentPage: 1,
				lastPage: 1,
				total: managers.length,
				perPage: 1000,
				hasMorePages: false
			},
			error: null,
			errorType: null,
			canRetry: false,
			isLoading: false
		};
	} catch (error) {
		const errorType = categorizeError(error);
		const userMessage = getUserFriendlyErrorMessage(errorType, error.message);

		console.error('❌ Managers SSR: Failed to load data:', {
			error: error.message,
			type: errorType,
			loadTime: Date.now() - startTime
		});

		return createFallbackData({
			error: userMessage,
			errorType,
			canRetry: errorType !== 'auth'
		});
	}
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, fetch }) {
	try {
		console.log('🚀 Managers SSR: Starting server-side load', {
			hasLocals: !!locals,
			hasUser: !!locals?.user,
			hasToken: !!locals?.token
		});

		// Check if user is authenticated via httpOnly cookie
		if (!locals?.user || !locals?.token) {
			console.log('⚠️ Managers SSR: No authentication token found in httpOnly cookie');
			return {
				usersData: createFallbackData({
					needsClientLoad: true // Flag for client to handle auth
				})
			};
		}

		// Check if user has permission to access managers page
		// User type can be in Russian ('Админ') or English slug ('admin')
		const userStatusSlug = locals.user.status?.slug || locals.user.type?.toLowerCase();
		const isAdmin = userStatusSlug === 'admin' || userStatusSlug === 'админ' || locals.user.type === 'Админ';

		if (!isAdmin) {
			console.log('⚠️ Managers SSR: User does not have admin permissions', {
				userStatusSlug,
				userType: locals.user.type
			});
			return {
				usersData: createFallbackData({
					error: 'У вас нет прав доступа к этой странице',
					errorType: 'auth',
					canRetry: false
				})
			};
		}

		console.log('👤 Managers SSR: Loading data for user:', locals.user.email);

		// Load managers data
		const managersData = await loadManagersData(locals.token, fetch);

		return {
			usersData: managersData
		};
	} catch (err) {
		console.error('❌ Managers SSR: Server load error:', {
			error: err.message,
			stack: err.stack
		});

		return {
			usersData: createFallbackData({
				error: 'Внутренняя ошибка при загрузке данных менеджеров',
				errorType: 'unknown',
				canRetry: true
			})
		};
	}
}
