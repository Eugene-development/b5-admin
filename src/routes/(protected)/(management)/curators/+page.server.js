/**
 * Server-side load function for curators page with httpOnly cookie authentication
 * Data is rendered on the server using JWT token from httpOnly cookies
 */

import {
	makeServerGraphQLRequest,
	createFallbackData,
	categorizeError,
	getUserFriendlyErrorMessage
} from '$lib/api/server.js';

/**
 * GraphQL query to fetch all users (will filter for curators on server)
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
 * Load curators data from GraphQL API
 * @param {string} token - JWT token
 * @param {Function} fetch - SvelteKit fetch function
 * @param {string} hostname - Hostname for domain-based URL resolution
 */
async function loadCuratorsData(token, fetch, hostname) {
	const startTime = Date.now();

	try {
		console.log('📊 Curators SSR: Starting data load...');

		// Make GraphQL request with JWT token from httpOnly cookie
		const data = await makeServerGraphQLRequest(token, USERS_QUERY, {}, fetch, hostname);
		const allUsers = data.users || [];

		// Filter only curators based on userStatus.slug
		const curators = allUsers
			.filter((user) => user.userStatus?.slug === 'curator')
			.map((user) => ({
				...user,
				status: 'active' // Status will be determined by ban/unban mutations on client
			}))
			.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

		// Calculate stats
		const stats = {
			total: curators.length,
			active: curators.length,
			banned: 0,
			verified: curators.filter((c) => c.email_verified_at).length,
			unverified: curators.filter((c) => !c.email_verified_at).length
		};

		const loadTime = Date.now() - startTime;

		console.log(`✅ Curators SSR: Loaded ${curators.length} curators in ${loadTime}ms`);

		return {
			agents: curators, // Keep as 'agents' for compatibility with existing page component
			stats,
			pagination: {
				currentPage: 1,
				lastPage: 1,
				total: curators.length,
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

		console.error('❌ Curators SSR: Failed to load data:', {
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
export async function load({ locals, fetch, url }) {
	try {
		console.log('🚀 Curators SSR: Starting server-side load', {
			hostname: url.hostname,
			hasLocals: !!locals,
			hasUser: !!locals?.user,
			hasToken: !!locals?.token
		});

		// Check if user is authenticated via httpOnly cookie
		// Note: SSR data loading is optional - client will handle auth redirect via auth-guard
		// Access control happens in auth-guard.svelte.js on the client side
		if (!locals?.user || !locals?.token) {
			console.log('⚠️ Curators SSR: No authentication token found in httpOnly cookie');
			return {
				usersData: createFallbackData({
					needsClientLoad: true // Flag for client to handle auth
				})
			};
		}

		console.log('👤 Curators SSR: Loading data for user:', locals.user.email);

		// Load curators data with hostname for domain-based URL resolution
		const curatorsData = await loadCuratorsData(locals.token, fetch, url.hostname);

		return {
			usersData: curatorsData
		};
	} catch (err) {
		console.error('❌ Curators SSR: Server load error:', {
			error: err.message,
			stack: err.stack
		});

		return {
			usersData: createFallbackData({
				error: 'Внутренняя ошибка при загрузке данных кураторов',
				errorType: 'unknown',
				canRetry: true
			})
		};
	}
}
