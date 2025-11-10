const API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/graphql`;

/**
 * Load service companies from GraphQL API with streaming
 */
async function loadServicesData(fetch) {
	const query = `
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

	try {
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify({ query })
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			console.error('GraphQL errors:', result.errors);
			return {
				services: [],
				error: {
					message: result.errors[0]?.message || 'Не удалось загрузить данные',
					canRetry: true
				}
			};
		}

		// Filter companies by status slug 'services'
		const servicesData = result.data.companies.data.filter(
			(company) => company.status?.slug === 'services'
		);

		// Transform data to match expected format
		const services = servicesData.map((company) => ({
			...company,
			status: company.ban ? 'banned' : company.is_active ? 'active' : 'inactive',
			phone: company.phones?.find((p) => p.is_primary)?.value || company.phones?.[0]?.value,
			email: company.emails?.find((e) => e.is_primary)?.value || company.emails?.[0]?.value,
			contact_person:
				company.phones?.find((p) => p.is_primary)?.contact_person ||
				company.emails?.find((e) => e.is_primary)?.contact_person ||
				company.phones?.[0]?.contact_person ||
				company.emails?.[0]?.contact_person
		}));

		return {
			services
		};
	} catch (error) {
		console.error('Failed to load services:', error);
		return {
			services: [],
			error: {
				message: 'Не удалось загрузить данные сервисов',
				canRetry: true
			}
		};
	}
}

export async function load({ fetch }) {
	return {
		servicesData: loadServicesData(fetch)
	};
}
