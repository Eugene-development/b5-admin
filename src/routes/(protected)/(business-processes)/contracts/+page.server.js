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
				status_id
				project {
					id
					value
					region
					description
					client {
						id
						name
						phones {
							value
						}
					}
				}
				company {
					id
					name
					legal_name
					inn
					region
				}
				status {
					id
					value
					slug
					color
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

async function loadContractsData(token, fetch, hostname) {
	try {
		console.log('📊 Contracts SSR: Starting data load...');
		const data = await makeServerGraphQLRequest(token, CONTRACTS_QUERY, { first: 1000, page: 1 }, fetch, hostname);
		const contracts = data.contracts?.data || [];
		console.log(`✅ Contracts SSR: Loaded ${contracts.length} contracts`);
		return { contracts, error: null };
	} catch (error) {
		console.error('❌ Contracts SSR: Failed:', error.message);
		return { contracts: [], error: { message: getUserFriendlyErrorMessage(categorizeError(error), error.message), canRetry: true } };
	}
}

export async function load({ locals, fetch, url }) {
	console.log('🚀 Contracts SSR: load function called', {
		hostname: url.hostname,
		hasUser: !!locals?.user,
		hasToken: !!locals?.token
	});
	
	if (!locals?.user || !locals?.token) {
		console.log('⚠️ Contracts SSR: No auth, returning empty data');
		return { 
			contractsData: { 
				contracts: [], 
				needsClientLoad: true 
			} 
		};
	}
	
	// Load data and return it directly (not as a promise)
	try {
		const contractsData = await loadContractsData(locals.token, fetch, url.hostname);
		console.log('✅ Contracts SSR: Returning data', {
			contractsCount: contractsData.contracts?.length || 0,
			hasError: !!contractsData.error
		});
		
		return { contractsData };
	} catch (error) {
		console.error('❌ Contracts SSR: Unexpected error:', error);
		return {
			contractsData: {
				contracts: [],
				error: { message: 'Неожиданная ошибка при загрузке данных', canRetry: true }
			}
		};
	}
}
