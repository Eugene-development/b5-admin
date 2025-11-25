/**
 * Server-side load function for delivery page with httpOnly cookie authentication
 * Data is rendered on the server using JWT token from httpOnly cookies
 */

import { makeServerGraphQLRequest, createFallbackData, categorizeError, getUserFriendlyErrorMessage } from '$lib/api/server.js';

/**
 * GraphQL query to fetch all companies (will filter for delivery on server)
 */
const COMPANIES_QUERY = `
	query GetCompanies {
		companies(first: 1000) {
			data {
				id
				name
				legal_name
				inn
				region
				ban
				is_active
				status_id
				status {
					id
					value
					slug
					color
					icon
				}
				created_at
				updated_at
				phones {
					id
					value
					contact_person
					is_primary
				}
				emails {
					id
					value
					contact_person
					is_primary
				}
			}
		}
	}
`;

/**
 * Load delivery companies data from GraphQL API
 */
async function loadDeliveryData(token, fetch) {
	const startTime = Date.now();

	try {
		console.log('📊 Delivery SSR: Starting data load...');

		// Make GraphQL request with JWT token from httpOnly cookie
		const data = await makeServerGraphQLRequest(token, COMPANIES_QUERY, {}, fetch);
		const allCompanies = data.companies?.data || [];

		// Filter only delivery companies based on status.slug
		const deliveryData = allCompanies.filter(
			(company) => company.status?.slug === 'delivery'
		);

		// Transform data to match expected format
		const delivery = deliveryData
			.map((company) => ({
				...company,
				status: company.ban ? 'banned' : company.is_active ? 'active' : 'inactive',
				phone: company.phones?.find((p) => p.is_primary)?.value || company.phones?.[0]?.value,
				email: company.emails?.find((e) => e.is_primary)?.value || company.emails?.[0]?.value,
				contact_person:
					company.phones?.find((p) => p.is_primary)?.contact_person ||
					company.emails?.find((e) => e.is_primary)?.contact_person ||
					company.phones?.[0]?.contact_person ||
					company.emails?.[0]?.contact_person
			}))
			.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

		const loadTime = Date.now() - startTime;

		console.log(`✅ Delivery SSR: Loaded ${delivery.length} delivery companies in ${loadTime}ms`);

		return {
			delivery,
			error: null
		};
	} catch (error) {
		const errorType = categorizeError(error);
		const userMessage = getUserFriendlyErrorMessage(errorType, error.message);

		console.error('❌ Delivery SSR: Failed to load data:', {
			error: error.message,
			type: errorType,
			loadTime: Date.now() - startTime
		});

		return {
			delivery: [],
			error: {
				message: userMessage,
				canRetry: errorType !== 'auth'
			}
		};
	}
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, fetch }) {
	try {
		console.log('🚀 Delivery SSR: Starting server-side load', {
			hasLocals: !!locals,
			hasUser: !!locals?.user,
			hasToken: !!locals?.token
		});

		// Check if user is authenticated via httpOnly cookie
		if (!locals?.user || !locals?.token) {
			console.log('⚠️ Delivery SSR: No authentication token found in httpOnly cookie');
			return {
				deliveryData: {
					delivery: [],
					needsClientLoad: true
				}
			};
		}

		// Check if user has permission to access delivery page
		// User type can be in Russian ('Админ') or English slug ('admin')
		const userStatusSlug = locals.user.status?.slug || locals.user.type?.toLowerCase();
		const isAdmin = userStatusSlug === 'admin' || userStatusSlug === 'админ' || locals.user.type === 'Админ';

		if (!isAdmin) {
			console.log('⚠️ Delivery SSR: User does not have admin permissions', {
				userStatusSlug,
				userType: locals.user.type
			});
			return {
				deliveryData: {
					delivery: [],
					error: {
						message: 'У вас нет прав доступа к этой странице',
						canRetry: false
					}
				}
			};
		}

		console.log('👤 Delivery SSR: Loading data for user:', locals.user.email);

		// Load delivery data
		const deliveryData = await loadDeliveryData(locals.token, fetch);

		return {
			deliveryData
		};
	} catch (err) {
		console.error('❌ Delivery SSR: Server load error:', {
			error: err.message,
			stack: err.stack
		});

		return {
			deliveryData: {
				delivery: [],
				error: {
					message: 'Внутренняя ошибка при загрузке данных служб доставки',
					canRetry: true
				}
			}
		};
	}
}
