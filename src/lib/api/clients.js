import { gql, GraphQLClient } from 'graphql-request';
import { handleAuthError } from '$lib/utils/authErrorHandler.js';
import { getGraphQLEndpoint } from '$lib/config/api.js';

// GraphQL queries and mutations for Clients
const CLIENTS_QUERY = gql`
	{
		clients {
			id
			name
			birthday
			ban
			status_id
			phones {
				id
				value
				is_primary
			}
			projects {
				id
				value
				contract_number
				status_id
				agent {
					id
					name
					email
				}
			}
			created_at
			updated_at
		}
	}
`;

const CLIENT_QUERY = gql`
	query GetClient($id: ID!) {
		client(id: $id) {
			id
			name
			birthday
			ban
			status_id
			phones {
				id
				value
				is_primary
			}
			projects {
				id
				value
				contract_number
				status_id
				agent {
					id
					name
					email
				}
			}
			created_at
			updated_at
		}
	}
`;

// Helper function to make GraphQL requests with proper error handling, authentication, and SvelteKit fetch support
async function makeGraphQLRequest(
	query,
	variables = {},
	operationName = 'GraphQL operation',
	customFetch = null
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

		// Use the configured GraphQL endpoint
		const result = await client.request(query, variables);

		clearTimeout(timeoutId);
		return result;
	} catch (err) {
		console.error(`GraphQL Error in ${operationName}:`, err);

		// Handle authentication errors
		handleAuthError(err, '/clients');

		throw err;
	}
}

// Function to get all clients
export async function getAllClients(customFetch = null) {
	try {
		const result = await makeGraphQLRequest(CLIENTS_QUERY, {}, 'getAllClients', customFetch);
		return result.clients || [];
	} catch (err) {
		console.error('Get all clients failed:', err);
		throw err;
	}
}

// Function to get a single client by ID
export async function getClient(clientId, customFetch = null) {
	try {
		const result = await makeGraphQLRequest(
			CLIENT_QUERY,
			{ id: clientId },
			'getClient',
			customFetch
		);
		return result.client;
	} catch (err) {
		console.error('Get client failed:', err);
		throw err;
	}
}

// Function to refresh clients data
export async function refreshClients(customFetch = null) {
	try {
		const result = await makeGraphQLRequest(CLIENTS_QUERY, {}, 'refreshClients', customFetch);
		return result.clients || [];
	} catch (err) {
		console.error('Refresh clients failed:', err);
		throw err;
	}
}

// Function to get clients with pagination support (simulated since clients query doesn't support pagination)
export async function getClientsWithPagination(first = 1000, page = 1, customFetch = null) {
	try {
		// Clients API doesn't support pagination, so we use the simple query and simulate pagination structure
		const result = await makeGraphQLRequest(
			CLIENTS_QUERY,
			{},
			'getClientsWithPagination',
			customFetch
		);
		const clients = result.clients || [];

		// Simulate pagination structure to match projects API pattern
		return {
			data: clients,
			paginatorInfo: {
				currentPage: 1,
				lastPage: 1,
				total: clients.length,
				perPage: clients.length,
				hasMorePages: false,
				count: clients.length,
				firstItem: clients.length > 0 ? 1 : null,
				lastItem: clients.length
			}
		};
	} catch (err) {
		console.error('Get clients with pagination failed:', err);
		throw err;
	}
}

// GraphQL mutation for updating client with phones
const UPDATE_CLIENT_MUTATION = gql`
	mutation UpdateClientWithPhones($input: UpdateClientWithPhonesInput!) {
		updateClientWithPhones(input: $input) {
			id
			name
			birthday
			ban
			status_id
			phones {
				id
				value
				is_primary
			}
			projects {
				id
				value
				contract_number
				status_id
				agent {
					id
					name
					email
				}
			}
			created_at
			updated_at
		}
	}
`;

// Function to update a client with phones
export async function updateClient(input, customFetch = null) {
	try {
		const result = await makeGraphQLRequest(
			UPDATE_CLIENT_MUTATION,
			{ input },
			'updateClient',
			customFetch
		);
		return result.updateClientWithPhones;
	} catch (err) {
		console.error('Update client failed:', err);
		throw err;
	}
}
