import { gql } from 'graphql-request';
import { GRAPHQL_ENDPOINT } from '$lib/config/api.js';

// GraphQL queries and mutations
const CONTRACTS_QUERY = gql`
	query GetContracts($first: Int!, $page: Int) {
		contracts(first: $first, page: $page) {
			data {
				id
				project_id
				company_id
				project {
					id
					value
					region
					description
				}
				company {
					id
					name
					legal_name
					inn
					region
				}
				contract_number
				contract_date
				planned_completion_date
				actual_completion_date
				contract_amount
				agent_percentage
				curator_percentage
				is_active
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

const CREATE_CONTRACT_MUTATION = gql`
	mutation CreateContract($input: CreateContractInput!) {
		createContract(input: $input) {
			id
			project_id
			company_id
			project {
				id
				value
				region
				description
			}
			company {
				id
				name
				legal_name
				inn
				region
			}
			contract_number
			contract_date
			planned_completion_date
			actual_completion_date
			contract_amount
			agent_percentage
			curator_percentage
			is_active
			created_at
			updated_at
		}
	}
`;

const UPDATE_CONTRACT_MUTATION = gql`
	mutation UpdateContract($input: UpdateContractInput!) {
		updateContract(input: $input) {
			id
			project_id
			company_id
			project {
				id
				value
				region
				description
			}
			company {
				id
				name
				legal_name
				inn
				region
			}
			contract_number
			contract_date
			planned_completion_date
			actual_completion_date
			contract_amount
			agent_percentage
			curator_percentage
			is_active
			created_at
			updated_at
		}
	}
`;

const DELETE_CONTRACT_MUTATION = gql`
	mutation DeleteContract($id: ID!) {
		deleteContract(id: $id) {
			id
		}
	}
`;

// Helper function to make GraphQL requests with proper error handling and retry logic
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
				console.error(`GraphQL errors in ${operationName}:`, result.errors);
				throw new Error(result.errors[0].message || 'GraphQL query failed');
			}

			// Check if data exists
			if (!result.data) {
				console.error(`No data returned from ${operationName}:`, result);
				throw new Error('No data returned from GraphQL query');
			}

			return result.data;
		} catch (err) {
			lastError = err;
			console.error(`❌ GraphQL Error in ${operationName} (attempt ${attempt}/${retries}):`, {
				error: err.message,
				type: err.constructor.name
			});

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

// Function to get all contracts
export async function getContracts(first = 1000, page = 1, customFetch = null, cookies = null) {
	try {
		const variables = { first, page };
		const result = await makeGraphQLRequest(
			CONTRACTS_QUERY,
			variables,
			'getContracts',
			3,
			customFetch,
			cookies
		);
		const contracts = result.contracts?.data || [];
		// Filter out any invalid contracts
		return contracts.filter((contract) => contract && contract.id);
	} catch (err) {
		console.error('Get contracts failed:', err);
		throw err;
	}
}

// Function to create a contract
export async function createContract(contractData, customFetch = null, cookies = null) {
	try {
		console.log('Creating contract with data:', contractData);
		const result = await makeGraphQLRequest(
			CREATE_CONTRACT_MUTATION,
			{ input: contractData },
			'createContract',
			3,
			customFetch,
			cookies
		);
		console.log('Create contract result:', result);
		const contract = result.createContract;
		if (!contract || !contract.id) {
			console.error('Invalid contract returned:', contract);
			throw new Error('Invalid contract data returned from server');
		}
		console.log('Created contract:', contract);
		return contract;
	} catch (err) {
		console.error('Create contract failed:', err);
		throw err;
	}
}

// Function to update a contract
export async function updateContract(contractData, customFetch = null, cookies = null) {
	try {
		console.log('Updating contract with data:', contractData);
		const result = await makeGraphQLRequest(
			UPDATE_CONTRACT_MUTATION,
			{ input: contractData },
			'updateContract',
			3,
			customFetch,
			cookies
		);
		console.log('Update contract result:', result);
		const contract = result.updateContract;
		if (!contract || !contract.id) {
			console.error('Invalid contract returned:', contract);
			throw new Error('Invalid contract data returned from server');
		}
		console.log('Updated contract:', contract);
		return contract;
	} catch (err) {
		console.error('Update contract failed:', err);
		throw err;
	}
}

// Function to delete a contract
export async function deleteContract(contractId, customFetch = null, cookies = null) {
	try {
		const result = await makeGraphQLRequest(
			DELETE_CONTRACT_MUTATION,
			{ id: contractId },
			'deleteContract',
			3,
			customFetch,
			cookies
		);
		return result.deleteContract;
	} catch (err) {
		console.error('Delete contract failed:', err);
		throw err;
	}
}

// Function to refresh contracts data
export async function refreshContracts(first = 1000, page = 1, customFetch = null, cookies = null) {
	try {
		const variables = { first, page };
		const result = await makeGraphQLRequest(
			CONTRACTS_QUERY,
			variables,
			'refreshContracts',
			3,
			customFetch,
			cookies
		);
		const contracts = result.contracts?.data || [];
		// Filter out any invalid contracts
		return contracts.filter((contract) => contract && contract.id);
	} catch (err) {
		console.error('Refresh contracts failed:', err);
		throw err;
	}
}

/**
 * Factory function to create API client with server-side fetch support
 * @param {Function} fetch - SvelteKit fetch function
 * @param {Object} cookies - SvelteKit cookies object
 * @returns {Object} API client with bound fetch and cookies
 */
export function createContractsApiWithFetch(fetch, cookies) {
	return {
		getContracts: (first, page) => getContracts(first, page, fetch, cookies),
		createContract: (contractData) => createContract(contractData, fetch, cookies),
		updateContract: (contractData) => updateContract(contractData, fetch, cookies),
		deleteContract: (contractId) => deleteContract(contractId, fetch, cookies),
		refreshContracts: (first, page) => refreshContracts(first, page, fetch, cookies)
	};
}
