import { gql, request } from 'graphql-request';
import { handleAuthError } from '$lib/utils/authErrorHandler.js';
import { getGraphQLEndpoint } from '$lib/config/api.js';

// GraphQL query for project statuses
const PROJECT_STATUSES_QUERY = gql`
	query GetProjectStatuses {
		projectStatuses {
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
	}
`;

// Helper function to make GraphQL requests with proper error handling
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
			const timeoutId = setTimeout(() => controller.abort(), 10000);

			const fetchFunction =
				customFetch || (typeof window !== 'undefined' ? window.fetch : globalThis.fetch);

			const headers = {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			};

			const graphqlEndpoint = getGraphQLEndpoint();
			const response = await fetchFunction(graphqlEndpoint, {
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

			if (result.errors && result.errors.length > 0) {
				throw new Error(result.errors[0].message || 'GraphQL query failed');
			}

			return result.data;
		} catch (err) {
			lastError = err;
			console.error(`❌ GraphQL Error in ${operationName} (attempt ${attempt}/${retries}):`, err);

			if (!customFetch && handleAuthError(err, '/projects')) {
				throw err;
			}

			if (err.response?.status === 403) {
				throw err;
			}

			if (attempt === retries) {
				throw err;
			}

			const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError;
}

// Function to get all project statuses
export async function getProjectStatuses(customFetch = null, cookies = null) {
	try {
		const result = await makeGraphQLRequest(
			PROJECT_STATUSES_QUERY,
			{},
			'getProjectStatuses',
			3,
			customFetch,
			cookies
		);
		return result.projectStatuses || [];
	} catch (err) {
		console.error('Get project statuses failed:', err);
		throw err;
	}
}

/**
 * Factory function to create API client with server-side fetch support
 * @param {Function} fetch - SvelteKit fetch function
 * @param {Object} cookies - SvelteKit cookies object
 * @returns {Object} API client with bound fetch and cookies
 */
export function createProjectStatusesApiWithFetch(fetch, cookies) {
	return {
		getProjectStatuses: () => getProjectStatuses(fetch, cookies)
	};
}
