/**
 * Server-side load function for agents page with SSR
 * Data is rendered on the server using JWT from httpOnly cookie
 */

import {
	makeServerGraphQLRequest,
	createFallbackData,
	categorizeError,
	getUserFriendlyErrorMessage,
	calculateStats
} from '$lib/api/server.js';

/**
 * GraphQL query for users
 */
const USERS_QUERY = `
	{
		users {
			id
			region
			name
			email
			phones {
				id
				value
				is_primary
			}
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
 * Load agents data asynchronously
 * @param {string} token - JWT token
 * @param {Function} fetch - SvelteKit fetch function
 * @param {string} hostname - Hostname for domain-based URL resolution
 */
async function loadAgentsData(token, fetch, hostname) {
	const startTime = Date.now();

	try {
		console.log('📊 Agents SSR: Loading users data');

		// Fetch users using GraphQL with JWT token
		const data = await makeServerGraphQLRequest(token, USERS_QUERY, {}, fetch, hostname);
		const allUsers = data.users || [];

		// Filter only agents
		const agents = allUsers
			.filter((user) => user.userStatus?.slug === 'agent')
			.map((user) => ({
				...user,
				status: 'active' // Status will be determined by ban/unban mutations on client
			}))
			.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

		// Calculate stats - ban status is managed via mutations, not stored in schema
		const stats = {
			total: agents.length,
			active: agents.length,
			banned: 0
		};
		const loadTime = Date.now() - startTime;

		console.log(`✅ Agents SSR: Loaded ${agents.length} agents in ${loadTime}ms`);

		return {
			agents,
			stats,
			error: null,
			errorType: null,
			canRetry: false,
			isLoading: false,
			loadTime
		};
	} catch (apiError) {
		const errorType = categorizeError(apiError);
		const userMessage = getUserFriendlyErrorMessage(errorType, apiError.message);
		const loadTime = Date.now() - startTime;

		console.error('❌ Agents SSR: Failed to load agents:', {
			error: apiError.message,
			type: errorType,
			stack: apiError.stack,
			loadTime
		});

		return {
			...createFallbackData(),
			error: userMessage,
			errorType,
			canRetry: errorType !== 'auth',
			originalError: apiError.message,
			loadTime
		};
	}
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, fetch, url }) {
	try {
		console.log('📊 Agents SSR: Server-side load started');
		console.log('🌐 Agents SSR: Request hostname:', url.hostname);

		// Check authentication from event.locals (set by hooks.server.js)
		// Note: SSR data loading is optional - client will handle auth redirect via auth-guard
		// Access control happens in auth-guard.svelte.js on the client side
		if (!locals.isAuthenticated || !locals.user || !locals.token) {
			console.log(
				'⚠️ Agents SSR: User not authenticated on server, returning empty data for client-side loading'
			);
			// Return empty data - client will handle loading or redirect
			return {
				agentsData: createFallbackData({
					needsClientLoad: true // Flag for client to handle auth
				})
			};
		}

		console.log('👤 Agents SSR: Loading data for user:', locals.user.email);

		// Load agents data with hostname for domain-based URL resolution
		const agentsData = await loadAgentsData(locals.token, fetch, url.hostname);

		return {
			agentsData
		};
	} catch (err) {
		console.error('❌ Agents SSR: Server load error:', {
			error: err.message,
			stack: err.stack
		});

		// Return fallback data on error
		return {
			agentsData: createFallbackData({
				error: 'Внутренняя ошибка при загрузке данных агентов',
				errorType: 'unknown',
				canRetry: true
			})
		};
	}
}
