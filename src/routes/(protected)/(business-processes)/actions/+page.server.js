/**
 * Server-side load function for actions page with httpOnly cookie authentication
 */

import { makeServerGraphQLRequest, categorizeError, getUserFriendlyErrorMessage } from '$lib/api/server.js';

const ACTIONS_QUERY = `
	query GetActions($first: Int!, $page: Int) {
		actions(first: $first, page: $page) {
			data {
				id
				name
				description
				start
				end
				company_id
				is_active
				created_at
				updated_at
				company {
					id
					name
					legal_name
					region
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

const COMPANIES_QUERY = `
	query GetCompanies($first: Int!, $page: Int) {
		companies(first: $first, page: $page) {
			data {
				id
				name
				legal_name
				region
				is_active
				ban
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

async function loadActionsData(token, fetch) {
	try {
		console.log('📊 Actions SSR: Starting data load...');

		// Load actions and companies in parallel
		const [actionsResult, companiesResult] = await Promise.all([
			makeServerGraphQLRequest(token, ACTIONS_QUERY, { first: 1000, page: 1 }, fetch),
			makeServerGraphQLRequest(token, COMPANIES_QUERY, { first: 1000, page: 1 }, fetch)
		]);

		const rawActions = actionsResult.actions?.data || [];
		const allCompanies = companiesResult.companies?.data || [];

		// Filter only active and not banned companies
		const companies = allCompanies.filter((company) => company.is_active && !company.ban);

		// Sort actions by created_at descending (newest first)
		const sortedActions = [...rawActions].sort((a, b) => {
			const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
			const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
			return dateB - dateA;
		});

		// Transform actions data to match table format
		const actions = sortedActions.map((action) => ({
			id: action.id,
			company_name: action.company?.name || 'Не указано',
			action_name: action.name,
			phone: action.company?.phone || '',
			contact_person: action.company?.contact_person || '',
			region: action.company?.region || 'Не указан',
			start_date: action.start,
			end_date: action.end,
			description: action.description,
			comment: action.is_active ? 'Акция активна' : 'Акция неактивна',
			is_active: action.is_active,
			company_id: action.company_id,
			created_at: action.created_at,
			updated_at: action.updated_at,
			// Keep original data for editing
			_original: action
		}));

		console.log(`✅ Actions SSR: Loaded ${actions.length} actions and ${companies.length} companies`);

		return { actions, companies, error: null };
	} catch (error) {
		console.error('❌ Actions SSR: Failed:', error.message);
		return { actions: [], companies: [], error: { message: getUserFriendlyErrorMessage(categorizeError(error), error.message), canRetry: true } };
	}
}

export async function load({ locals, fetch }) {
	if (!locals?.user || !locals?.token) {
		return { actionsData: { actions: [], companies: [], needsClientLoad: true } };
	}
	const actionsData = await loadActionsData(locals.token, fetch);
	return { actionsData };
}
