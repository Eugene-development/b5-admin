/**
 * Server-side load function for order page with httpOnly cookie authentication
 */

import { makeServerGraphQLRequest, categorizeError, getUserFriendlyErrorMessage } from '$lib/api/server.js';

const ORDERS_QUERY = `
	query GetOrders($first: Int!, $page: Int) {
		orders(first: $first, page: $page) {
			data {
				id
				value
				company_id
				project_id
				order_number
				delivery_date
				actual_delivery_date
				is_active
				is_urgent
				created_at
				updated_at
				company {
					id
					name
					legal_name
				}
				project {
					id
					value
					contract_name
				}
				positions {
					id
					value
					article
					price
					count
					total_price
					supplier
					expected_delivery_date
					actual_delivery_date
					is_active
					is_urgent
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
	query GetCompanies {
		companies(first: 1000) {
			data {
				id
				name
				legal_name
			}
		}
	}
`;

const PROJECTS_QUERY = `
	query GetProjects {
		projects(first: 1000) {
			data {
				id
				value
				contract_number
			}
		}
	}
`;

async function loadOrdersData(token, fetch) {
	try {
		console.log('📊 Orders SSR: Starting data load...');
		
		// Load orders, companies and projects in parallel
		const [ordersData, companiesData, projectsData] = await Promise.all([
			makeServerGraphQLRequest(token, ORDERS_QUERY, { first: 1000, page: 1 }, fetch),
			makeServerGraphQLRequest(token, COMPANIES_QUERY, {}, fetch),
			makeServerGraphQLRequest(token, PROJECTS_QUERY, {}, fetch)
		]);
		
		const rawOrders = ordersData.orders?.data || [];
		const companies = companiesData.companies?.data || [];
		const projects = projectsData.projects?.data || [];
		
		// Sort by created_at descending (newest first)
		const orders = [...rawOrders].sort((a, b) => {
			const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
			const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
			return dateB - dateA;
		});
		
		console.log(`✅ Orders SSR: Loaded ${orders.length} orders, ${companies.length} companies, ${projects.length} projects`);
		return { orders, companies, projects, error: null };
	} catch (error) {
		console.error('❌ Orders SSR: Failed:', error.message);
		return { orders: [], companies: [], projects: [], error: { message: getUserFriendlyErrorMessage(categorizeError(error), error.message), canRetry: true } };
	}
}

export async function load({ locals, fetch }) {
	if (!locals?.user || !locals?.token) {
		return { ordersData: { orders: [], companies: [], projects: [], needsClientLoad: true } };
	}
	const ordersData = await loadOrdersData(locals.token, fetch);
	return { ordersData };
}
