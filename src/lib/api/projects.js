import { gql, request } from 'graphql-request';
import { getAuthHeaders } from './config.js';
import { handleAuthError } from '$lib/utils/authErrorHandler.js';

// GraphQL queries and mutations
const PROJECTS_QUERY = gql`
	query GetProjects($first: Int!, $page: Int) {
		projects(first: $first, page: $page) {
			data {
				id
				value
				agent_id
				agent {
					id
					name
					email
					city
					status
				}
				city
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
			agent_id
			agent {
				id
				name
				email
			}
			city
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

// Helper function to make GraphQL requests with proper error handling, authentication, and retry logic
async function makeGraphQLRequest(
	query,
	variables = {},
	operationName = 'GraphQL operation',
	retries = 3
) {
	let lastError;

	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

			// Get authentication headers
			const authHeaders = getAuthHeaders();
			const headers = {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...authHeaders
			};

			const result = await request(import.meta.env.VITE_B5_API_URL, query, variables, headers);

			clearTimeout(timeoutId);
			return result;
		} catch (err) {
			lastError = err;
			console.error(`GraphQL Error in ${operationName} (attempt ${attempt}/${retries}):`, err);

			// Handle authentication errors
			if (handleAuthError(err, '/projects')) {
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
export async function getProjects(first = 1000, page = 1) {
	try {
		const variables = { first, page };
		const result = await makeGraphQLRequest(PROJECTS_QUERY, variables, 'getProjects');
		return result.projects?.data || [];
	} catch (err) {
		console.error('Get projects failed:', err);
		throw err;
	}
}

// Function to update a project
export async function updateProject(projectData) {
	try {
		const result = await makeGraphQLRequest(
			UPDATE_PROJECT_MUTATION,
			{ input: projectData },
			'updateProject'
		);
		return result.updateProject;
	} catch (err) {
		console.error('Update project failed:', err);
		throw err;
	}
}

// Function to delete a project
export async function deleteProject(projectId) {
	try {
		const result = await makeGraphQLRequest(
			DELETE_PROJECT_MUTATION,
			{ id: projectId },
			'deleteProject'
		);
		return result.deleteProject;
	} catch (err) {
		console.error('Delete project failed:', err);
		throw err;
	}
}

// Function to refresh projects data (alias for getProjects for consistency with agents.js)
export async function refreshProjects(first = 1000, page = 1) {
	try {
		const variables = { first, page };
		const result = await makeGraphQLRequest(PROJECTS_QUERY, variables, 'refreshProjects');
		return result.projects?.data || [];
	} catch (err) {
		console.error('Refresh projects failed:', err);
		throw err;
	}
}

// Function to get all projects (alias for getProjects for consistency)
export async function getAllProjects(first = 1000, page = 1) {
	try {
		const variables = { first, page };
		const result = await makeGraphQLRequest(PROJECTS_QUERY, variables, 'getAllProjects');
		return result.projects?.data || [];
	} catch (err) {
		console.error('Get all projects failed:', err);
		throw err;
	}
}

// Function to get projects with pagination info
export async function getProjectsWithPagination(first = 1000, page = 1) {
	try {
		const variables = { first, page };
		const result = await makeGraphQLRequest(PROJECTS_QUERY, variables, 'getProjectsWithPagination');
		return {
			data: result.projects?.data || [],
			paginatorInfo: result.projects?.paginatorInfo || null
		};
	} catch (err) {
		console.error('Get projects with pagination failed:', err);
		throw err;
	}
}
