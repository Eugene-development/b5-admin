import { gql, GraphQLClient } from 'graphql-request';
import { handleAuthError } from '$lib/utils/authErrorHandler.js';
import { getGraphQLEndpoint } from '$lib/config/api.js';

// GraphQL queries and mutations
const USERS_QUERY = gql`
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

const UPDATE_USER_MUTATION = gql`
	mutation UpdateUser($input: UpdateUserInput!) {
		updateUser(input: $input) {
			id
			name
			email
			phones {
				id
				value
				is_primary
			}
			region
			status_id
			userStatus {
				id
				value
				slug
				color
				icon
			}
			status
			created_at
			updated_at
		}
	}
`;

// Note: User creation is handled through the auth API (registerUser)
// not through GraphQL, so we don't have a CREATE_USER_MUTATION here

// Helper function to make GraphQL requests with proper error handling, authentication, and SvelteKit fetch support
async function makeGraphQLRequest(
	query,
	variables = {},
	operationName = 'GraphQL operation',
	customFetch = null,
	cookies = null
) {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

		// Get dynamic GraphQL endpoint
		const graphqlEndpoint = getGraphQLEndpoint();
		
		// Debug logging
		console.log(`🌐 [${operationName}] GraphQL endpoint:`, graphqlEndpoint);

		const headers = {
			'Content-Type': 'application/json',
			Accept: 'application/json'
		};

		// Create GraphQL client with headers (graphql-request v7 way)
		const client = new GraphQLClient(graphqlEndpoint, {
			headers: headers
		});

		// Use the configured GraphQL endpoint (now with status field support)
		const result = await client.request(query, variables);

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
		const result = await makeGraphQLRequest(
			BAN_USER_MUTATION,
			{ id: agentId },
			'banUser',
			customFetch,
			cookies
		);
		return result.banUser;
	} catch (err) {
		console.error('Ban request failed:', err);
		throw err;
	}
}

// Function to unban a user
export async function unbanUser(agentId, customFetch = null, cookies = null) {
	try {
		const result = await makeGraphQLRequest(
			UNBAN_USER_MUTATION,
			{ id: agentId },
			'unbanUser',
			customFetch,
			cookies
		);
		return result.unbanUser;
	} catch (err) {
		console.error('Unban request failed:', err);
		throw err;
	}
}

// Function to delete a user
export async function deleteUser(agentId, customFetch = null, cookies = null) {
	try {
		const result = await makeGraphQLRequest(
			DELETE_USER_MUTATION,
			{ id: agentId },
			'deleteUser',
			customFetch,
			cookies
		);
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
export async function getUsersWithPagination(
	first = 1000,
	page = 1,
	customFetch = null,
	cookies = null
) {
	try {
		// Users API doesn't support pagination, so we use the simple query and simulate pagination structure
		const result = await makeGraphQLRequest(
			USERS_QUERY,
			{},
			'getUsersWithPagination',
			customFetch,
			cookies
		);
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

// Function to update a user
export async function updateUser(userData, customFetch = null, cookies = null) {
	try {
		const result = await makeGraphQLRequest(
			UPDATE_USER_MUTATION,
			{ input: userData },
			'updateUser',
			customFetch,
			cookies
		);
		return result.updateUser;
	} catch (err) {
		console.error('Update user failed:', err);
		throw err;
	}
}

// Function to get all user statuses
export async function getUserStatuses(customFetch = null, cookies = null) {
	const query = gql`
		query GetUserStatuses {
			activeUserStatuses {
				id
				value
				slug
				description
				color
				icon
				sort_order
				is_default
			}
		}
	`;

	try {
		const result = await makeGraphQLRequest(query, {}, 'getUserStatuses', customFetch, cookies);
		return result.activeUserStatuses || [];
	} catch (err) {
		console.error('Get user statuses failed:', err);
		throw err;
	}
}

// Function to create a new user via auth API and then update status
export async function createUser(userData, customFetch = null, cookies = null) {
	try {
		// Import registerUser from auth API
		const { registerUser } = await import('./auth.js');

		// Register the user through auth API
		const registerData = {
			name: userData.name,
			email: userData.email,
			password: userData.password,
			password_confirmation: userData.password_confirmation,
			region: userData.region,
			terms_accepted: true // Auto-accept terms for admin-created users
		};

		const result = await registerUser(registerData);

		if (!result.success) {
			throw new Error(result.message || 'Failed to create user');
		}

		// If status_id is provided, update the user's status
		if (userData.status_id && result.user) {
			try {
				const updatedUser = await updateUser(
					{
						id: result.user.id,
						status_id: userData.status_id
					},
					customFetch,
					cookies
				);
				return updatedUser;
			} catch (updateError) {
				console.error('Failed to update user status after creation:', updateError);
				// Return the created user even if status update fails
				return result.user;
			}
		}

		return result.user;
	} catch (err) {
		console.error('Create user failed:', err);
		throw err;
	}
}
