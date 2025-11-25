/**
 * Server-side load function for services page with httpOnly cookie authentication
 * Data is rendered on the server using JWT token from httpOnly cookies
 */

import { makeServerGraphQLRequest, createFallbackData, categorizeError, getUserFriendlyErrorMessage } from '$lib/api/server.js';

/**
 * GraphQL query to fetch all companies (will filter for services on server)
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
 * Load service companies data from GraphQL API
 */
async function loadServicesData(token, fetch) {
	const startTime = Date.now();

	try {
		console.log('📊 Services SSR: Starting data load...');

		// Make GraphQL request with JWT token from httpOnly cookie
		const data = await makeServerGraphQLRequest(token, COMPANIES_QUERY, {}, fetch);
		const allCompanies = data.companies?.data || [];

		// Filter only service companies based on status.slug
		const servicesData = allCompanies.filter(
			(company) => company.status?.slug === 'services'
		);

		// Transform data to match expected format
		const services = servicesData
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

		console.log(`✅ Services SSR: Loaded ${services.length} service companies in ${loadTime}ms`);

		return {
			services,
			error: null
		};
	} catch (error) {
		const errorType = categorizeError(error);
		const userMessage = getUserFriendlyErrorMessage(errorType, error.message);

		console.error('❌ Services SSR: Failed to load data:', {
			error: error.message,
			type: errorType,
			loadTime: Date.now() - startTime
		});

		return {
			services: [],
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
		console.log('🚀 Services SSR: Starting server-side load', {
			hasLocals: !!locals,
			hasUser: !!locals?.user,
			hasToken: !!locals?.token
		});

		// Check if user is authenticated via httpOnly cookie
		if (!locals?.user || !locals?.token) {
			console.log('⚠️ Services SSR: No authentication token found in httpOnly cookie');
			return {
				servicesData: {
					services: [],
					needsClientLoad: true
				}
			};
		}

		// Check if user has permission to access services page
		// User type can be in Russian ('Админ') or English slug ('admin')
		const userStatusSlug = locals.user.status?.slug || locals.user.type?.toLowerCase();
		const isAdmin = userStatusSlug === 'admin' || userStatusSlug === 'админ' || locals.user.type === 'Админ';

		if (!isAdmin) {
			console.log('⚠️ Services SSR: User does not have admin permissions', {
				userStatusSlug,
				userType: locals.user.type
			});
			return {
				servicesData: {
					services: [],
					error: {
						message: 'У вас нет прав доступа к этой странице',
						canRetry: false
					}
				}
			};
		}

		console.log('👤 Services SSR: Loading data for user:', locals.user.email);

		// Load services data
		const servicesData = await loadServicesData(locals.token, fetch);

		return {
			servicesData
		};
	} catch (err) {
		console.error('❌ Services SSR: Server load error:', {
			error: err.message,
			stack: err.stack
		});

		return {
			servicesData: {
				services: [],
				error: {
					message: 'Внутренняя ошибка при загрузке данных сервисных компаний',
					canRetry: true
				}
			}
		};
	}
}
