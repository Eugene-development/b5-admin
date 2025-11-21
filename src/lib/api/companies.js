import { handleApiError, addWarningToast } from '$lib/utils/toastStore.js';

const API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/graphql`;

export class DuplicateInnError extends Error {
	constructor(message) {
		super(message);
		this.name = 'DuplicateInnError';
	}
}

/**
 * Create a new company with phones and emails
 * @param {Object} companyData - Company data
 * @returns {Promise<Object>} Created company
 */
export async function createCompany(companyData) {
	const mutation = `
		mutation CreateCompany($input: CreateCompanyInput!) {
			createCompany(input: $input) {
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
			}
		}
	`;

	try {
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...authHeaders
			},
			credentials: 'include',
			body: JSON.stringify({
				query: mutation,
				variables: {
					input: {
						name: companyData.name,
						legal_name: companyData.legal_name,
						inn: companyData.inn,
						region: companyData.region || null,
						status_id: companyData.status_id || null,
						ban: false,
						is_active: true
					}
				}
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			const errorMessage = result.errors[0]?.message || 'Failed to create company';
			const extensions = result.errors[0]?.extensions;

			// Check for duplicate INN error (validation or database constraint)
			const isDuplicateInn =
				(errorMessage.includes('Duplicate entry') &&
					errorMessage.includes('companies_inn_unique')) ||
				errorMessage.includes('inn has already been taken') ||
				(errorMessage.includes('inn') && errorMessage.includes('already')) ||
				(extensions?.validation && extensions.validation['input.inn']);

			if (isDuplicateInn) {
				const duplicateError = new DuplicateInnError(
					'Компания с таким ИНН уже существует в системе'
				);
				addWarningToast(duplicateError.message, { duration: 6000 });
				throw duplicateError;
			}

			throw new Error(errorMessage);
		}

		return result.data.createCompany;
	} catch (error) {
		// Check if it's a duplicate INN error
		if (error instanceof DuplicateInnError) {
			throw error;
		}
		handleApiError(error, 'Не удалось создать компанию');
		throw error;
	}
}

/**
 * Create a company phone
 * @param {string} companyId - Company ID
 * @param {Object} phoneData - Phone data
 * @returns {Promise<Object>} Created phone
 */
export async function createCompanyPhone(companyId, phoneData) {
	const mutation = `
		mutation CreateCompanyPhone($input: CreateCompanyPhoneInput!) {
			createCompanyPhone(input: $input) {
				id
				company_id
				value
				contact_person
				is_primary
				created_at
				updated_at
			}
		}
	`;

	try {
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...authHeaders
			},
			credentials: 'include',
			body: JSON.stringify({
				query: mutation,
				variables: {
					input: {
						company_id: companyId,
						value: phoneData.value,
						contact_person: phoneData.contact_person || null,
						is_primary: phoneData.is_primary || false
					}
				}
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'Failed to create company phone');
		}

		return result.data.createCompanyPhone;
	} catch (error) {
		handleApiError(error, 'Не удалось добавить телефон');
		throw error;
	}
}

/**
 * Create a company email
 * @param {string} companyId - Company ID
 * @param {Object} emailData - Email data
 * @returns {Promise<Object>} Created email
 */
export async function createCompanyEmail(companyId, emailData) {
	const mutation = `
		mutation CreateCompanyEmail($input: CreateCompanyEmailInput!) {
			createCompanyEmail(input: $input) {
				id
				company_id
				value
				contact_person
				is_primary
				created_at
				updated_at
			}
		}
	`;

	try {
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...authHeaders
			},
			credentials: 'include',
			body: JSON.stringify({
				query: mutation,
				variables: {
					input: {
						company_id: companyId,
						value: emailData.value,
						contact_person: emailData.contact_person || null,
						is_primary: emailData.is_primary || false
					}
				}
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'Failed to create company email');
		}

		return result.data.createCompanyEmail;
	} catch (error) {
		handleApiError(error, 'Не удалось добавить email');
		throw error;
	}
}

/**
 * Update an existing company
 * @param {Object} companyData - Company data to update
 * @returns {Promise<Object>} Updated company
 */
export async function updateCompany(companyData) {
	const mutation = `
		mutation UpdateCompany($input: UpdateCompanyInput!) {
			updateCompany(input: $input) {
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
			}
		}
	`;

	try {
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...authHeaders
			},
			credentials: 'include',
			body: JSON.stringify({
				query: mutation,
				variables: {
					input: {
						id: companyData.id,
						name: companyData.name || undefined,
						legal_name: companyData.legal_name || undefined,
						inn: companyData.inn || undefined,
						region: companyData.region || undefined,
						ban: companyData.ban,
						is_active: companyData.is_active,
						status_id: companyData.status_id || undefined
					}
				}
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'Failed to update company');
		}

		return result.data.updateCompany;
	} catch (error) {
		handleApiError(error, 'Не удалось обновить компанию');
		throw error;
	}
}

/**
 * Ban or unban a company
 * @param {string} companyId - Company ID
 * @param {boolean} shouldBan - True to ban, false to unban
 * @returns {Promise<Object>} Updated company
 */
export async function toggleCompanyBan(companyId, shouldBan) {
	const mutation = `
		mutation UpdateCompany($input: UpdateCompanyInput!) {
			updateCompany(input: $input) {
				id
				name
				legal_name
				inn
				region
				ban
				is_active
				created_at
				updated_at
			}
		}
	`;

	try {
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...authHeaders
			},
			credentials: 'include',
			body: JSON.stringify({
				query: mutation,
				variables: {
					input: {
						id: companyId,
						ban: shouldBan
					}
				}
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'Failed to update company ban status');
		}

		return result.data.updateCompany;
	} catch (error) {
		handleApiError(
			error,
			shouldBan ? 'Не удалось забанить компанию' : 'Не удалось разбанить компанию'
		);
		throw error;
	}
}

/**
 * Delete a company
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Deleted company
 */
export async function deleteCompany(companyId) {
	const mutation = `
		mutation DeleteCompany($id: ID!) {
			deleteCompany(id: $id) {
				id
				name
			}
		}
	`;

	try {
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...authHeaders
			},
			credentials: 'include',
			body: JSON.stringify({
				query: mutation,
				variables: {
					id: companyId
				}
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'Failed to delete company');
		}

		return result.data.deleteCompany;
	} catch (error) {
		handleApiError(error, 'Не удалось удалить компанию');
		throw error;
	}
}

/**
 * Refresh companies list
 * @returns {Promise<Array>} List of companies
 */
export async function refreshCompanies() {
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
						sort_order
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
				Accept: 'application/json',
				...authHeaders
			},
			credentials: 'include',
			body: JSON.stringify({ query })
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'Failed to fetch companies');
		}

		return result.data.companies.data;
	} catch (error) {
		handleApiError(error, 'Не удалось загрузить компании');
		throw error;
	}
}

/**
 * Get all company statuses
 * @returns {Promise<Array>} List of company statuses
 */
export async function getCompanyStatuses() {
	const query = `
		query GetCompanyStatuses {
			activeCompanyStatuses {
				id
				value
				slug
				description
				color
				icon
				sort_order
				is_default
			}
		}
	`;

	try {
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...authHeaders
			},
			credentials: 'include',
			body: JSON.stringify({ query })
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'Failed to fetch company statuses');
		}

		return result.data.activeCompanyStatuses;
	} catch (error) {
		handleApiError(error, 'Не удалось загрузить статусы компаний');
		throw error;
	}
}
