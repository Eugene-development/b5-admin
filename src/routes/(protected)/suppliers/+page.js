const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/graphql';

/**
 * Load suppliers from GraphQL API
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
				suppliers: [],
				error: {
					message: result.errors[0]?.message || 'Не удалось загрузить данные',
					canRetry: true
				}
			};
		}

		// Filter companies by status slug 'suppliers'
		const suppliersData = result.data.companies.data.filter(
			(company) => company.status?.slug === 'suppliers'
		);

		// Transform data to match expected format
		const suppliers = suppliersData.map((company) => ({
			...company,
			status: company.ban ? 'banned' : company.is_active ? 'active' : 'inactive',
			// Get primary phone or first phone
			phone: company.phones?.find((p) => p.is_primary)?.value || company.phones?.[0]?.value,
			// Get primary email or first email
			email: company.emails?.find((e) => e.is_primary)?.value || company.emails?.[0]?.value,
			// Get contact person from primary phone or email
			contact_person:
				company.phones?.find((p) => p.is_primary)?.contact_person ||
				company.emails?.find((e) => e.is_primary)?.contact_person ||
				company.phones?.[0]?.contact_person ||
				company.emails?.[0]?.contact_person
		}));

		return {
			suppliers
		};
	} catch (error) {
		console.error('Failed to load suppliers:', error);
		return {
			suppliers: [],
			error: {
				message: 'Не удалось загрузить данные поставщиков',
				canRetry: true
			}
		};
	}
}