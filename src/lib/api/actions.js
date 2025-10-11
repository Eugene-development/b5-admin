import { handleApiError } from '$lib/utils/toastStore.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/graphql';

/**
 * Create a new action
 * @param {Object} actionData - Action data
 * @returns {Promise<Object>} Created action
 */
export async function createAction(actionData) {
	const mutation = `
		mutation CreateAction($input: CreateActionInput!) {
			createAction(input: $input) {
				id
				name
				description
				start
				end
				company_id
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
						name: actionData.name,
						description: actionData.description,
						start: actionData.start || null,
						end: actionData.end || null,
						company_id: actionData.company_id,
						is_active: actionData.is_active
					}
				}
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			const errorMessage = result.errors[0]?.message || 'Failed to create action';
			throw new Error(errorMessage);
		}

		return result.data.createAction;
	} catch (error) {
		handleApiError(error, 'Не удалось создать акцию');
		throw error;
	}
}

/**
 * Update an existing action
 * @param {Object} actionData - Action data to update
 * @returns {Promise<Object>} Updated action
 */
export async function updateAction(actionData) {
	const mutation = `
		mutation UpdateAction($input: UpdateActionInput!) {
			updateAction(input: $input) {
				id
				name
				description
				start
				end
				company_id
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
						id: actionData.id,
						name: actionData.name || undefined,
						description: actionData.description || undefined,
						start: actionData.start || undefined,
						end: actionData.end || undefined,
						company_id: actionData.company_id || undefined,
						is_active: actionData.is_active
					}
				}
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'Failed to update action');
		}

		return result.data.updateAction;
	} catch (error) {
		handleApiError(error, 'Не удалось обновить акцию');
		throw error;
	}
}

/**
 * Delete an action
 * @param {string} actionId - Action ID
 * @returns {Promise<Object>} Deleted action
 */
export async function deleteAction(actionId) {
	const mutation = `
		mutation DeleteAction($id: ID!) {
			deleteAction(id: $id) {
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
				Accept: 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify({
				query: mutation,
				variables: {
					id: actionId
				}
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'Failed to delete action');
		}

		return result.data.deleteAction;
	} catch (error) {
		handleApiError(error, 'Не удалось удалить акцию');
		throw error;
	}
}

/**
 * Refresh actions list
 * @returns {Promise<Array>} List of actions
 */
export async function refreshActions() {
	const query = `
		query GetActions {
			actions(first: 1000) {
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
					total
					count
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
			throw new Error(result.errors[0]?.message || 'Failed to fetch actions');
		}

		return result.data.actions.data;
	} catch (error) {
		handleApiError(error, 'Не удалось загрузить акции');
		throw error;
	}
}

/**
 * Get companies for action creation
 * @returns {Promise<Array>} List of companies
 */
export async function getCompaniesForActions() {
	const query = `
		query GetCompanies {
			companies(first: 1000) {
				data {
					id
					name
					legal_name
					region
					is_active
					bun
				}
				paginatorInfo {
					total
					count
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
			throw new Error(result.errors[0]?.message || 'Failed to fetch companies');
		}

		// Filter only active and not banned companies
		return result.data.companies.data.filter(company => company.is_active && !company.bun);
	} catch (error) {
		handleApiError(error, 'Не удалось загрузить список компаний');
		throw error;
	}
}
