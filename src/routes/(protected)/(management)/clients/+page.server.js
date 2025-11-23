/**
 * Server-side load function for clients page with SSR
 * Data is rendered on the server using JWT from httpOnly cookie
 */

import {
	makeServerGraphQLRequest,
	createFallbackData,
	categorizeError,
	getUserFriendlyErrorMessage,
	calculateStats
} from '$lib/api/server.js';
import { addSequentialNumbers } from '$lib/utils/sequentialNumber.js';

/**
 * GraphQL query for clients with pagination
 */
const CLIENTS_QUERY = `
	query GetClients($first: Int!, $page: Int!) {
		clientsForAdmin(first: $first, page: $page) {
			data {
				id
				name
				region
				email
				ban
				created_at
				updated_at
				phones {
					value
				}
				projects {
					agent {
						id
						name
						email
					}
				}
			}
			paginatorInfo {
				currentPage
				lastPage
				total
				perPage
				hasMorePages
			}
		}
	}
`;

/**
 * Load clients data asynchronously
 */
async function loadClientsData(token, fetch) {
	const startTime = Date.now();

	try {
		console.log('📊 Clients SSR: Loading clients data');

		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error('Request timeout')), 30000);
		});

		// Fetch clients using GraphQL with JWT token
		const data = await Promise.race([
			makeServerGraphQLRequest(token, CLIENTS_QUERY, { first: 1000, page: 1 }, fetch),
			timeoutPromise
		]);

		const rawClients = data.clientsForAdmin?.data || [];

		// Add sequential numbers and normalize
		const clients = addSequentialNumbers(rawClients).map((client) => {
			// Get agent from first project (if exists)
			const firstProject = client.projects?.[0];
			const agent = firstProject?.agent;

			return {
				...client,
				status: client.ban ? 'banned' : 'active',
				agent: agent
					? {
							id: agent.id,
							name: agent.name,
							email: agent.email
						}
					: null
			};
		});

		const stats = calculateStats(clients);
		const pagination = data.clientsForAdmin?.paginatorInfo || {
			currentPage: 1,
			lastPage: 1,
			total: clients.length,
			perPage: 1000,
			hasMorePages: false
		};

		const loadTime = Date.now() - startTime;

		console.log(`✅ Clients SSR: Loaded ${clients.length} clients in ${loadTime}ms`);

		return {
			clients,
			stats,
			pagination,
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

		console.error('❌ Clients SSR: Failed to load clients:', {
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
export async function load({ locals, fetch }) {
	try {
		console.log('📊 Clients SSR: Server-side load started');

		// Check authentication from event.locals (set by hooks.server.js)
		if (!locals.isAuthenticated || !locals.user || !locals.token) {
			console.log('⚠️ Clients SSR: User not authenticated, returning empty data');
			return {
				clientsData: createFallbackData({
					needsClientLoad: true
				})
			};
		}

		// Check if user has permission to access clients page (admin or managers)
		// User type can be in Russian ('Админ', 'Менеджер') or English slug ('admin', 'managers')
		const userStatusSlug = locals.user.status?.slug || locals.user.type?.toLowerCase();
		const userType = locals.user.type;
		const hasAccess =
			userStatusSlug === 'admin' ||
			userStatusSlug === 'админ' ||
			userType === 'Админ' ||
			userStatusSlug === 'managers' ||
			userStatusSlug === 'менеджер' ||
			userType === 'Менеджер';

		if (!hasAccess) {
			console.log('⚠️ Clients SSR: User does not have required permissions', {
				userStatusSlug,
				userType
			});
			return {
				clientsData: createFallbackData({
					error: 'У вас нет прав доступа к этой странице',
					errorType: 'auth',
					canRetry: false
				})
			};
		}

		console.log('👤 Clients SSR: Loading data for user:', locals.user.email);

		// Load clients data
		const clientsData = await loadClientsData(locals.token, fetch);

		return {
			clientsData
		};
	} catch (err) {
		console.error('❌ Clients SSR: Server load error:', {
			error: err.message,
			stack: err.stack
		});

		return {
			clientsData: createFallbackData({
				error: 'Внутренняя ошибка при загрузке данных клиентов',
				errorType: 'unknown',
				canRetry: true
			})
		};
	}
}
