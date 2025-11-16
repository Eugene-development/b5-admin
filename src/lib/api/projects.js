import { gql, request } from 'graphql-request';
import { getAuthHeaders } from './config.js';
import { handleAuthError } from '$lib/utils/authErrorHandler.js';
import { GRAPHQL_ENDPOINT } from '$lib/config/api.js';

// GraphQL queries and mutations
const PROJECTS_QUERY = gql`
	query GetProjects($first: Int!, $page: Int) {
		projects(first: $first, page: $page) {
			data {
				id
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
				region
				description
				is_active
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

const UPDATE_PROJECT_MUTATION = gql`
	mutation UpdateProject($input: UpdateProjectInput!) {
		updateProject(input: $input) {
			id
			value
			user_id
			client_id
			status_id
			agent {
				id
				name
				email
			}
			client {
				id
				name
			}
			status {
				id
				value
				slug
				description
				color
				icon
				sort_order
				is_default
				is_active
			}
			region
			description
			is_active
			contract_name
			contract_date
			contract_amount
			agent_percentage
			planned_completion_date
			created_at
			updated_at
		}
	}
`;

const DELETE_PROJECT_MUTATION = gql`
	mutation DeleteProject($id: ID!) {
		deleteProject(id: $id) {
			id
			value
		}
	}
`;

const ACCEPT_PROJECT_MUTATION = gql`
	mutation AcceptProject($projectId: ID!, $userId: ID!, $statusId: ID) {
		acceptProject(projectId: $projectId, userId: $userId, statusId: $statusId) {
			id
			user_id
			project_id
			created_at
		}
	}
`;

const HAS_NEW_PROJECTS_QUERY = gql`
	query HasNewProjects {
		projects(first: 100, page: 1) {
			data {
				id
				status_id
			}
		}
	}
`;

// Helper function to make GraphQL requests with proper error handling, authentication, and retry logic
// Supports both client-side and server-side fetch
async function makeGraphQLRequest(
	query,
	variables = {},
	operationName = 'GraphQL operation',
	retries = 3,
	customFetch = null,
	cookies = null
) {
	let lastError;

	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

			// Use custom fetch for server-side or default for client-side
			const fetchFunction =
				customFetch || (typeof window !== 'undefined' ? window.fetch : globalThis.fetch);

			// Prepare headers
			const headers = {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			};

			// Note: Authentication headers temporarily disabled for CORS compatibility
			// TODO: Re-enable authentication after CORS is properly configured

			// Make the request using fetch directly to support server-side
			const response = await fetchFunction(GRAPHQL_ENDPOINT, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					query,
					variables
				}),
				signal: controller.signal,
				credentials: 'include'
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const result = await response.json();

			// Handle GraphQL errors
			if (result.errors && result.errors.length > 0) {
				throw new Error(result.errors[0].message || 'GraphQL query failed');
			}

			return result.data;
		} catch (err) {
			lastError = err;
			console.error(`❌ GraphQL Error in ${operationName} (attempt ${attempt}/${retries}):`, {
				error: err.message,
				type: err.constructor.name,
				stack: err.stack,
				cause: err.cause
			});

			// Handle authentication errors (only for client-side)
			if (!customFetch && handleAuthError(err, '/projects')) {
				throw err;
			}

			// Don't retry on certain error types
			if (err.response?.status === 403) {
				throw err;
			}

			// If this is the last attempt, throw the error
			if (attempt === retries) {
				throw err;
			}

			// Wait before retrying (exponential backoff)
			const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError;
}

// Function to get all projects
export async function getProjects(first = 1000, page = 1, customFetch = null, cookies = null) {
	try {
		const variables = { first, page };
		const result = await makeGraphQLRequest(
			PROJECTS_QUERY,
			variables,
			'getProjects',
			3,
			customFetch,
			cookies
		);
		return result.projects?.data || [];
	} catch (err) {
		console.error('Get projects failed:', err);
		throw err;
	}
}

// Function to update a project
export async function updateProject(projectData, customFetch = null, cookies = null) {
	try {
		const result = await makeGraphQLRequest(
			UPDATE_PROJECT_MUTATION,
			{ input: projectData },
			'updateProject',
			3,
			customFetch,
			cookies
		);
		return result.updateProject;
	} catch (err) {
		console.error('Update project failed:', err);
		throw err;
	}
}

// Function to delete a project
export async function deleteProject(projectId, customFetch = null, cookies = null) {
	try {
		const result = await makeGraphQLRequest(
			DELETE_PROJECT_MUTATION,
			{ id: projectId },
			'deleteProject',
			3,
			customFetch,
			cookies
		);
		return result.deleteProject;
	} catch (err) {
		console.error('Delete project failed:', err);
		throw err;
	}
}

// Function to accept a project (link user to project)
export async function acceptProject(
	projectId,
	userId,
	statusId = null,
	customFetch = null,
	cookies = null
) {
	try {
		const result = await makeGraphQLRequest(
			ACCEPT_PROJECT_MUTATION,
			{ projectId, userId, statusId },
			'acceptProject',
			3,
			customFetch,
			cookies
		);
		return result.acceptProject;
	} catch (err) {
		console.error('❌ Accept project failed:', err);
		console.error('Error details:', {
			message: err.message,
			stack: err.stack,
			response: err.response
		});
		throw err;
	}
}

// Function to refresh projects data (alias for getProjects for consistency with agents.js)
export async function refreshProjects(first = 1000, page = 1, customFetch = null, cookies = null) {
	try {
		const variables = { first, page };
		const result = await makeGraphQLRequest(
			PROJECTS_QUERY,
			variables,
			'refreshProjects',
			3,
			customFetch,
			cookies
		);
		return result.projects?.data || [];
	} catch (err) {
		console.error('Refresh projects failed:', err);
		throw err;
	}
}

// Function to get all projects (alias for getProjects for consistency)
export async function getAllProjects(first = 1000, page = 1, customFetch = null, cookies = null) {
	try {
		const variables = { first, page };
		const result = await makeGraphQLRequest(
			PROJECTS_QUERY,
			variables,
			'getAllProjects',
			3,
			customFetch,
			cookies
		);
		return result.projects?.data || [];
	} catch (err) {
		console.error('Get all projects failed:', err);
		throw err;
	}
}

// Function to get projects with pagination info
export async function getProjectsWithPagination(
	first = 1000,
	page = 1,
	customFetch = null,
	cookies = null
) {
	try {
		const variables = { first, page };
		const result = await makeGraphQLRequest(
			PROJECTS_QUERY,
			variables,
			'getProjectsWithPagination',
			3,
			customFetch,
			cookies
		);
		return {
			data: result.projects?.data || [],
			paginatorInfo: result.projects?.paginatorInfo || null
		};
	} catch (err) {
		console.error('Get projects with pagination failed:', err);
		throw err;
	}
}

/**
 * Function to check if there are any new projects
 * Queries backend for projects and filters by status_id "01K7HRKTSQV1894Y3JD9WV5KZX" (Новый проект)
 * @param {Function} customFetch - Custom fetch function for server-side requests
 * @param {Object} cookies - Cookies object for server-side requests
 * @returns {Promise<boolean>} True if there are new projects, false otherwise
 */
export async function hasNewProjects(customFetch = null, cookies = null) {
	try {
		const result = await makeGraphQLRequest(
			HAS_NEW_PROJECTS_QUERY,
			{},
			'hasNewProjects',
			2, // Reduced retries for simple check
			customFetch,
			cookies
		);

		// Filter projects by status_id on client side
		const projects = result.projects?.data || [];
		const hasNew = projects.some((project) => project.status_id === '01K7HRKTSQV1894Y3JD9WV5KZX');
		return hasNew;
	} catch (err) {
		console.error('Check new projects failed:', err);
		// Return false on error to prevent UI breaking
		return false;
	}
}

/**
 * Factory function to create API client with server-side fetch support
 * @param {Function} fetch - SvelteKit fetch function
 * @param {Object} cookies - SvelteKit cookies object
 * @returns {Object} API client with bound fetch and cookies
 */
export function createProjectsApiWithFetch(fetch, cookies) {
	return {
		getProjects: (first, page) => getProjects(first, page, fetch, cookies),
		updateProject: (projectData) => updateProject(projectData, fetch, cookies),
		deleteProject: (projectId) => deleteProject(projectId, fetch, cookies),
		acceptProject: (projectId, userId, statusId) =>
			acceptProject(projectId, userId, statusId, fetch, cookies),
		refreshProjects: (first, page) => refreshProjects(first, page, fetch, cookies),
		getAllProjects: (first, page) => getAllProjects(first, page, fetch, cookies),
		getProjectsWithPagination: (first, page) =>
			getProjectsWithPagination(first, page, fetch, cookies),
		hasNewProjects: () => hasNewProjects(fetch, cookies)
	};
}
