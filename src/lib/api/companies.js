import { handleApiError } from '$lib/utils/toastStore.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/graphql';

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
				bun
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
				Accept: 'application/json'
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
						bun: false,
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
			throw new Error(result.errors[0]?.message || 'Failed to create company');
		}

		return result.data.createCompany;
	} catch (error) {
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
		mutation CreateCompanyPhone($company_id: ID!, $input: CreateCompanyPhoneInput!) {
			createCompanyPhone(company_id: $company_id, input: $input) {
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
				Accept: 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify({
				query: mutation,
				variables: {
					company_id: companyId,
					input: {
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
		mutation CreateCompanyEmail($company_id: ID!, $input: CreateCompanyEmailInput!) {
			createCompanyEmail(company_id: $company_id, input: $input) {
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
				Accept: 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify({
				query: mutation,
				variables: {
					company_id: companyId,
					input: {
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
			throw new Error(result.errors[0]?.message || 'Failed to fetch companies');
		}

		return result.data.companies.data;
	} catch (error) {
		handleApiError(error, 'Не удалось загрузить компании');
		throw error;
	}
}
