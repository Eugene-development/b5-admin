/**
 * Server-side load function for projects page with httpOnly cookie authentication
 * Data is rendered on the server using JWT token from httpOnly cookies
 */

import { makeServerGraphQLRequest, createFallbackData, categorizeError, getUserFriendlyErrorMessage } from '$lib/api/server.js';

/**
 * GraphQL query to fetch all projects
 */
const PROJECTS_QUERY = `
	query GetProjects($first: Int!, $page: Int) {
		projects(first: $first, page: $page) {
			data {
				id
				project_number
				value
				user_id
				client_id
				status_id
				agent {
					id
					name
					email
					region
					status
					phones {
						id
						value
						is_primary
					}
				}
				client {
				id
				name
				birthday
				ban
				phones {
					id
					value
					is_primary
				}
			}
				status {
					id
					value
					slug
					description
					color
					icon
					is_active
				}
				users {
					id
					name
					email
					phones {
						id
						value
						is_primary
					}
				}
				curator {
					id
					name
					email
					phones {
						id
						value
						is_primary
					}
				}
				projectUsers {
					id
					user_id
					role
					user {
						id
						name
						email
						phones {
							id
							value
							is_primary
						}
					}
				}
				contracts {
					id
					contract_number
					contract_date
					planned_completion_date
					actual_completion_date
					agent_percentage
					curator_percentage
					is_active
					company {
						id
						name
						legal_name
					}
				}
			orders {
				id
				order_number
				order_amount
				agent_bonus
				curator_bonus
				is_active
			}
				comments {
					id
					value
					author_name
					created_at
				}
				region
				description
				is_active
				is_incognito
				contract_name
				contract_number
				contract_date
				contract_amount
				agent_percentage
				planned_completion_date
				created_at
				updated_at
			}
			paginatorInfo {
				count
				currentPage
				firstItem
				hasMorePages
				lastItem
				lastPage
				perPage
				total
			}
		}
	}
`;

/**
 * Load projects data from GraphQL API
 * @param {string} token - JWT token
 * @param {Function} fetch - SvelteKit fetch function
 * @param {string} hostname - Hostname for domain-based URL resolution
 */
async function loadProjectsData(token, fetch, hostname) {
	const startTime = Date.now();

	try {
		console.log('📊 Projects SSR: Starting data load...');

		// Make GraphQL request with JWT token from httpOnly cookie
		const data = await makeServerGraphQLRequest(
			token,
			PROJECTS_QUERY,
			{ first: 1000, page: 1 },
			fetch,
			hostname
		);

		const rawProjects = data.projects?.data || [];
		const paginatorInfo = data.projects?.paginatorInfo || {
			count: rawProjects.length,
			currentPage: 1,
			firstItem: 1,
			hasMorePages: false,
			lastItem: rawProjects.length,
			lastPage: 1,
			perPage: 1000,
			total: rawProjects.length
		};

		// Sort projects by created_at descending (newest first)
		const sortedProjects = [...rawProjects].sort((a, b) => {
			const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
			const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
			return dateB - dateA;
		});

		// Add sequential numbers
		const projects = sortedProjects.map((project, index) => ({
			...project,
			sequentialNumber: index + 1
		}));

		// Calculate stats
		const stats = {
			total: projects.length,
			active: projects.filter((p) => p.is_active === true).length,
			inactive: projects.filter((p) => p.is_active !== true).length,
			totalContractAmount: projects.reduce((sum, p) => sum + (Number(p.contract_amount) || 0), 0),
			averageContractAmount: 0
		};

		if (stats.total > 0) {
			stats.averageContractAmount = stats.totalContractAmount / stats.total;
		}

		const loadTime = Date.now() - startTime;

		console.log(`✅ Projects SSR: Loaded ${projects.length} projects in ${loadTime}ms`);

		return {
			projects,
			stats,
			pagination: paginatorInfo,
			error: null
		};
	} catch (error) {
		const errorType = categorizeError(error);
		const userMessage = getUserFriendlyErrorMessage(errorType, error.message);

		console.error('❌ Projects SSR: Failed to load data:', {
			error: error.message,
			type: errorType,
			loadTime: Date.now() - startTime
		});

		return {
			projects: [],
			stats: { total: 0, active: 0, inactive: 0, totalContractAmount: 0, averageContractAmount: 0 },
			pagination: {
				count: 0,
				currentPage: 1,
				firstItem: 0,
				hasMorePages: false,
				lastItem: 0,
				lastPage: 1,
				perPage: 1000,
				total: 0
			},
			error: {
				message: userMessage,
				canRetry: errorType !== 'auth'
			}
		};
	}
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, fetch, url }) {
	try {
		console.log('🚀 Projects SSR: Starting server-side load', {
			hostname: url.hostname,
			hasLocals: !!locals,
			hasUser: !!locals?.user,
			hasToken: !!locals?.token
		});

		// Check if user is authenticated via httpOnly cookie
		if (!locals?.user || !locals?.token) {
			console.log('⚠️ Projects SSR: No authentication token found in httpOnly cookie');
			return {
				projectsData: {
					projects: [],
					stats: { total: 0, active: 0, inactive: 0, totalContractAmount: 0, averageContractAmount: 0 },
					pagination: {
						count: 0,
						currentPage: 1,
						firstItem: 0,
						hasMorePages: false,
						lastItem: 0,
						lastPage: 1,
						perPage: 1000,
						total: 0
					},
					needsClientLoad: true
				}
			};
		}

		console.log('👤 Projects SSR: Loading data for user:', locals.user.email);

		// Load projects data with hostname for domain-based URL resolution
		const projectsData = await loadProjectsData(locals.token, fetch, url.hostname);

		return {
			projectsData
		};
	} catch (err) {
		console.error('❌ Projects SSR: Server load error:', {
			error: err.message,
			stack: err.stack
		});

		return {
			projectsData: {
				projects: [],
				stats: { total: 0, active: 0, inactive: 0, totalContractAmount: 0, averageContractAmount: 0 },
				pagination: {
					count: 0,
					currentPage: 1,
					firstItem: 0,
					hasMorePages: false,
					lastItem: 0,
					lastPage: 1,
					perPage: 1000,
					total: 0
				},
				error: {
					message: 'Внутренняя ошибка при загрузке данных проектов',
					canRetry: true
				}
			}
		};
	}
}
