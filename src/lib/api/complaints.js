import { gql } from 'graphql-request';
import { getGraphQLEndpoint } from '$lib/config/api.js';

// GraphQL queries and mutations
const COMPLAINTS_QUERY = gql`
	query GetComplaints($first: Int!, $page: Int) {
		complaints(first: $first, page: $page) {
			data {
				id
				contract_id
				order_id
				title
				description
				is_active
				planned_resolution_date
				responsible_person
				guilty_party
				priority
				status
				resolution_notes
				actual_resolution_date
				created_at
				updated_at
				contract {
					id
					contract_number
					project {
						id
						value
					}
					company {
						id
						name
					}
				}
				order {
					id
					order_number
					value
					company {
						id
						name
					}
					project {
						id
						value
					}
				}
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

const CREATE_COMPLAINT_MUTATION = gql`
	mutation CreateComplaint($input: CreateComplaintInput!) {
		createComplaint(input: $input) {
			id
			contract_id
			order_id
			title
			description
			is_active
			planned_resolution_date
			responsible_person
			guilty_party
			priority
			status
			resolution_notes
			actual_resolution_date
			created_at
			updated_at
			contract {
				id
				contract_number
				project {
					id
					value
				}
				company {
					id
					name
				}
			}
			order {
				id
				order_number
				value
				company {
					id
					name
				}
				project {
					id
					value
				}
			}
		}
	}
`;

const UPDATE_COMPLAINT_MUTATION = gql`
	mutation UpdateComplaint($input: UpdateComplaintInput!) {
		updateComplaint(input: $input) {
			id
			contract_id
			order_id
			title
			description
			is_active
			planned_resolution_date
			responsible_person
			guilty_party
			priority
			status
			resolution_notes
			actual_resolution_date
			created_at
			updated_at
			contract {
				id
				contract_number
				project {
					id
					value
				}
				company {
					id
					name
				}
			}
			order {
				id
				order_number
				value
				company {
					id
					name
				}
				project {
					id
					value
				}
			}
		}
	}
`;

const DELETE_COMPLAINT_MUTATION = gql`
	mutation DeleteComplaint($id: ID!) {
		deleteComplaint(id: $id) {
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

// Function to get all complaints
export async function getComplaints(first = 1000, page = 1, customFetch = null, cookies = null) {
	try {
		const variables = { first, page };
		const result = await makeGraphQLRequest(
			COMPLAINTS_QUERY,
			variables,
			'getComplaints',
			3,
			customFetch,
			cookies
		);
		const complaints = result.complaints?.data || [];
		// Filter out any invalid complaints
		return complaints.filter((complaint) => complaint && complaint.id);
	} catch (err) {
		console.error('Get complaints failed:', err);
		throw err;
	}
}

// Function to create a complaint
export async function createComplaint(complaintData, customFetch = null, cookies = null) {
	try {
		console.log('Creating complaint with data:', complaintData);
		const result = await makeGraphQLRequest(
			CREATE_COMPLAINT_MUTATION,
			{ input: complaintData },
			'createComplaint',
			3,
			customFetch,
			cookies
		);
		console.log('Create complaint result:', result);
		const complaint = result.createComplaint;
		if (!complaint || !complaint.id) {
			console.error('Invalid complaint returned:', complaint);
			throw new Error('Invalid complaint data returned from server');
		}
		console.log('Created complaint:', complaint);
		return complaint;
	} catch (err) {
		console.error('Create complaint failed:', err);
		throw err;
	}
}

// Function to update a complaint
export async function updateComplaint(complaintData, customFetch = null, cookies = null) {
	try {
		console.log('Updating complaint with data:', complaintData);
		const result = await makeGraphQLRequest(
			UPDATE_COMPLAINT_MUTATION,
			{ input: complaintData },
			'updateComplaint',
			3,
			customFetch,
			cookies
		);
		console.log('Update complaint result:', result);
		const complaint = result.updateComplaint;
		if (!complaint || !complaint.id) {
			console.error('Invalid complaint returned:', complaint);
			throw new Error('Invalid complaint data returned from server');
		}
		console.log('Updated complaint:', complaint);
		return complaint;
	} catch (err) {
		console.error('Update complaint failed:', err);
		throw err;
	}
}

// Function to delete a complaint
export async function deleteComplaint(complaintId, customFetch = null, cookies = null) {
	try {
		const result = await makeGraphQLRequest(
			DELETE_COMPLAINT_MUTATION,
			{ id: complaintId },
			'deleteComplaint',
			3,
			customFetch,
			cookies
		);
		return result.deleteComplaint;
	} catch (err) {
		console.error('Delete complaint failed:', err);
		throw err;
	}
}

// Function to refresh complaints data
export async function refreshComplaints(
	first = 1000,
	page = 1,
	customFetch = null,
	cookies = null
) {
	try {
		const variables = { first, page };
		const result = await makeGraphQLRequest(
			COMPLAINTS_QUERY,
			variables,
			'refreshComplaints',
			3,
			customFetch,
			cookies
		);
		const complaints = result.complaints?.data || [];
		// Filter out any invalid complaints
		return complaints.filter((complaint) => complaint && complaint.id);
	} catch (err) {
		console.error('Refresh complaints failed:', err);
		throw err;
	}
}

/**
 * Factory function to create API client with server-side fetch support
 * @param {Function} fetch - SvelteKit fetch function
 * @param {Object} cookies - SvelteKit cookies object
 * @returns {Object} API client with bound fetch and cookies
 */
export function createComplaintsApiWithFetch(fetch, cookies) {
	return {
		getComplaints: (first, page) => getComplaints(first, page, fetch, cookies),
		createComplaint: (complaintData) => createComplaint(complaintData, fetch, cookies),
		updateComplaint: (complaintData) => updateComplaint(complaintData, fetch, cookies),
		deleteComplaint: (complaintId) => deleteComplaint(complaintId, fetch, cookies),
		refreshComplaints: (first, page) => refreshComplaints(first, page, fetch, cookies)
	};
}
