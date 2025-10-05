import { gql, request } from 'graphql-request';
import { getAuthHeaders } from './config.js';
import { handleAuthError } from '$lib/utils/authErrorHandler.js';
import { GRAPHQL_ENDPOINT } from '$lib/config/api.js';

// GraphQL queries and mutations
const USERS_QUERY = gql`
	{
		users {
			id
			region
			name
			email
			email_verified_at
			created_at
			updated_at
			status
		}
	}
`;

const BAN_USER_MUTATION = gql`
	mutation BanUser($id: ID!) {
		banUser(id: $id) {
			id
			status
		}
	}
`;

const UNBAN_USER_MUTATION = gql`
	mutation UnbanUser($id: ID!) {
		unbanUser(id: $id) {
			id
			status
		}
	}
`;

const DELETE_USER_MUTATION = gql`
	mutation DeleteUser($id: ID!) {
		deleteUser(id: $id) {
			id
			name
			email
			deleted
		}
	}
`;

// Helper function to make GraphQL requests with proper error handling, authentication, and SvelteKit fetch support
async function makeGraphQLRequest(query, variables = {}, operationName = 'GraphQL operation', customFetch = null, cookies = null) {
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

		// Use custom fetch if provided (for SvelteKit SSR support)
		const requestConfig = customFetch ? { fetch: customFetch } : {};
		
		// Use the configured GraphQL endpoint (now with status field support)
		const result = await request(GRAPHQL_ENDPOINT, query, variables, headers, requestConfig);

		clearTimeout(timeoutId);
		return result;
	} catch (err) {
		console.error(`GraphQL Error in ${operationName}:`, err);
		
		// Handle authentication errors
		handleAuthError(err, '/agents');
		
		throw err;
	}
}

// Function to ban a user
export async function banUser(agentId, customFetch = null, cookies = null) {
	try {
		const result = await makeGraphQLRequest(BAN_USER_MUTATION, { id: agentId }, 'banUser', customFetch, cookies);
		return result.banUser;
	} catch (err) {
		console.error('Ban request failed:', err);
		throw err;
	}
}

// Function to unban a user
export async function unbanUser(agentId, customFetch = null, cookies = null) {
	try {
		const result = await makeGraphQLRequest(UNBAN_USER_MUTATION, { id: agentId }, 'unbanUser', customFetch, cookies);
		return result.unbanUser;
	} catch (err) {
		console.error('Unban request failed:', err);
		throw err;
	}
}

// Function to delete a user
export async function deleteUser(agentId, customFetch = null, cookies = null) {
	try {
		const result = await makeGraphQLRequest(DELETE_USER_MUTATION, { id: agentId }, 'deleteUser', customFetch, cookies);
		return result.deleteUser;
	} catch (err) {
		console.error('Delete request failed:', err);
		throw err;
	}
}

// Function to refresh users data
export async function refreshUsers(customFetch = null, cookies = null) {
	try {
		const result = await makeGraphQLRequest(USERS_QUERY, {}, 'refreshUsers', customFetch, cookies);
		return result.users || [];
	} catch (err) {
		console.error('Refresh users failed:', err);
		throw err;
	}
}

// Function to get all users (for initial load)
export async function getAllUsers(customFetch = null, cookies = null) {
	try {
		const result = await makeGraphQLRequest(USERS_QUERY, {}, 'getAllUsers', customFetch, cookies);
		return result.users || [];
	} catch (err) {
		console.error('Get all users failed:', err);
		throw err;
	}
}

// Function to get users with pagination support (fallback to simple query since users doesn't support pagination)
export async function getUsersWithPagination(first = 1000, page = 1, customFetch = null, cookies = null) {
	try {
		// Users API doesn't support pagination, so we use the simple query and simulate pagination structure
		const result = await makeGraphQLRequest(USERS_QUERY, {}, 'getUsersWithPagination', customFetch, cookies);
		const users = result.users || [];
		
		// Simulate pagination structure to match projects API pattern
		return {
			data: users,
			paginatorInfo: {
				currentPage: 1,
				lastPage: 1,
				total: users.length,
				perPage: users.length,
				hasMorePages: false,
				count: users.length,
				firstItem: users.length > 0 ? 1 : null,
				lastItem: users.length
			}
		};
	} catch (err) {
		console.error('Get users with pagination failed:', err);
		throw err;
	}
}
