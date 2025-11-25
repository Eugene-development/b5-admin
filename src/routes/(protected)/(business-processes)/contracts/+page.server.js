/**
 * Server-side load function for contracts page with httpOnly cookie authentication
 */

import { makeServerGraphQLRequest, categorizeError, getUserFriendlyErrorMessage } from '$lib/api/server.js';

const CONTRACTS_QUERY = `
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

async function loadContractsData(token, fetch) {
	try {
		console.log('📊 Contracts SSR: Starting data load...');
		const data = await makeServerGraphQLRequest(token, CONTRACTS_QUERY, { first: 1000, page: 1 }, fetch);
		const contracts = data.contracts?.data || [];
		console.log(`✅ Contracts SSR: Loaded ${contracts.length} contracts`);
		return { contracts, error: null };
	} catch (error) {
		console.error('❌ Contracts SSR: Failed:', error.message);
		return { contracts: [], error: { message: getUserFriendlyErrorMessage(categorizeError(error), error.message), canRetry: true } };
	}
}

export async function load({ locals, fetch }) {
	if (!locals?.user || !locals?.token) {
		return { contractsData: { contracts: [], needsClientLoad: true } };
	}
	const contractsData = await loadContractsData(locals.token, fetch);
	return { contractsData };
}
