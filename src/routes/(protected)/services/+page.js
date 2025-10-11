const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/graphql';

/**
 * Load service companies from GraphQL API
 */
export async function load() {
	const query = `
		query GetCompanies {
			companies(first: 1000) {
				data {
					id
					name
					legal_name
					inn
					region
					bun
					is_active
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

		// Transform data to match expected format
		const services = result.data.companies.data.map((company) => ({
			...company,
			status: company.bun ? 'banned' : company.is_active ? 'active' : 'inactive',
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
