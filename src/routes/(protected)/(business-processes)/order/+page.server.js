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
				order_amount
				agent_percentage
				curator_percentage
				agent_bonus
				curator_bonus
				is_active
				is_urgent
				status_id
				partner_payment_status_id
				created_at
				updated_at
				status {
					id
					value
					slug
					color
				}
				partnerPaymentStatus {
					id
					name
				}
				company {
					id
					name
					legal_name
					phones {
						id
						value
						contact_person
						is_primary
					}
				}
				project {
					id
					value
					contract_name
					region
					client {
						id
						name
						phones {
							value
						}
					}
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

async function loadOrdersData(token, fetch, hostname) {
	try {
		console.log('📊 Orders SSR: Starting data load...');
		
		// Load orders, companies and projects in parallel
		const [ordersData, companiesData, projectsData] = await Promise.all([
			makeServerGraphQLRequest(token, ORDERS_QUERY, { first: 1000, page: 1 }, fetch, hostname),
			makeServerGraphQLRequest(token, COMPANIES_QUERY, {}, fetch, hostname),
			makeServerGraphQLRequest(token, PROJECTS_QUERY, {}, fetch, hostname)
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

export async function load({ locals, fetch, url }) {
	console.log('🚀 Orders SSR: load function called', {
		hostname: url.hostname,
		hasUser: !!locals?.user,
		hasToken: !!locals?.token
	});
	
	if (!locals?.user || !locals?.token) {
		console.log('⚠️ Orders SSR: No auth, returning empty data');
		return { 
			ordersData: { 
				orders: [], 
				companies: [], 
				projects: [], 
				needsClientLoad: true 
			} 
		};
	}
	
	// Load data and return it directly (not as a promise)
	try {
		const ordersData = await loadOrdersData(locals.token, fetch, url.hostname);
		console.log('✅ Orders SSR: Returning data', {
			ordersCount: ordersData.orders?.length || 0,
			companiesCount: ordersData.companies?.length || 0,
			projectsCount: ordersData.projects?.length || 0,
			hasError: !!ordersData.error
		});
		
		return { ordersData };
	} catch (error) {
		console.error('❌ Orders SSR: Unexpected error:', error);
		return {
			ordersData: {
				orders: [],
				companies: [],
				projects: [],
				error: { message: 'Неожиданная ошибка при загрузке данных', canRetry: true }
			}
		};
	}
}
