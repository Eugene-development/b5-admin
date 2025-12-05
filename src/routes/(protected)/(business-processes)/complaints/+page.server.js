/**
 * Server-side load function for complaints page with httpOnly cookie authentication
 */

import { makeServerGraphQLRequest, categorizeError, getUserFriendlyErrorMessage } from '$lib/api/server.js';

const COMPLAINTS_QUERY = `
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

async function loadComplaintsData(token, fetch) {
	try {
		console.log('📊 Complaints SSR: Starting data load...');
		const data = await makeServerGraphQLRequest(token, COMPLAINTS_QUERY, { first: 1000, page: 1 }, fetch);
		const rawComplaints = data.complaints?.data || [];
		
		// Sort by created_at descending (newest first)
		const complaints = [...rawComplaints].sort((a, b) => {
			const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
			const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
			return dateB - dateA;
		});
		
		console.log(`✅ Complaints SSR: Loaded ${complaints.length} complaints`);
		return { complaints, contracts: [], orders: [], error: null };
	} catch (error) {
		console.error('❌ Complaints SSR: Failed:', error.message);
		return { complaints: [], contracts: [], orders: [], error: { message: getUserFriendlyErrorMessage(categorizeError(error), error.message), canRetry: true } };
	}
}

export async function load({ locals, fetch }) {
	if (!locals?.user || !locals?.token) {
		return { complaintsData: { complaints: [], contracts: [], orders: [], needsClientLoad: true } };
	}
	const complaintsData = await loadComplaintsData(locals.token, fetch);
	return { complaintsData };
}
