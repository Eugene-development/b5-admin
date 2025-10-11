import { handleApiError } from '$lib/utils/toastStore.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/graphql';

/**
 * Create a new order with positions
 * @param {Object} orderData - Order data with positions
 * @returns {Promise<Object>} Created order
 */
export async function createOrder(orderData) {
	const mutation = `
		mutation CreateOrder($input: CreateOrderInput!) {
			createOrder(input: $input) {
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
						value: orderData.value,
						company_id: orderData.company_id,
						project_id: orderData.project_id,
						order_number: orderData.order_number,
						delivery_date: orderData.delivery_date,
						actual_delivery_date: orderData.actual_delivery_date,
						is_active: orderData.is_active,
						is_urgent: orderData.is_urgent,
						positions: orderData.positions
					}
				}
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			const errorMessage = result.errors[0]?.message || 'Failed to create order';
			
			if (errorMessage.includes('Duplicate entry') && errorMessage.includes('order_number')) {
				throw new Error('Заказ с таким номером уже существует в системе');
			}
			
			throw new Error(errorMessage);
		}

		return result.data.createOrder;
	} catch (error) {
		if (error.message.includes('Заказ с таким номером уже существует')) {
			handleApiError(error, error.message);
		} else {
			handleApiError(error, 'Не удалось создать заказ');
		}
		throw error;
	}
}

/**
 * Get all orders
 * @param {number} first - Number of orders to fetch
 * @param {number} page - Page number
 * @returns {Promise<Array>} List of orders
 */
export async function getOrders(first = 1000, page = 1) {
	const query = `
		query GetOrders($first: Int!, $page: Int!) {
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

	try {
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify({
				query,
				variables: { first, page }
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'Failed to fetch orders');
		}

		return result.data.orders.data;
	} catch (error) {
		handleApiError(error, 'Не удалось загрузить заказы');
		throw error;
	}
}

/**
 * Update an existing order
 * @param {Object} orderData - Order data to update
 * @returns {Promise<Object>} Updated order
 */
export async function updateOrder(orderData) {
	const mutation = `
		mutation UpdateOrder($input: UpdateOrderInput!) {
			updateOrder(input: $input) {
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
						id: orderData.id,
						value: orderData.value,
						company_id: orderData.company_id,
						project_id: orderData.project_id,
						order_number: orderData.order_number,
						delivery_date: orderData.delivery_date,
						actual_delivery_date: orderData.actual_delivery_date,
						is_active: orderData.is_active,
						is_urgent: orderData.is_urgent
					}
				}
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'Failed to update order');
		}

		return result.data.updateOrder;
	} catch (error) {
		handleApiError(error, 'Не удалось обновить заказ');
		throw error;
	}
}

/**
 * Delete an order
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Deleted order
 */
export async function deleteOrder(orderId) {
	const mutation = `
		mutation DeleteOrder($id: ID!) {
			deleteOrder(id: $id) {
				id
				order_number
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
					id: orderId
				}
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'Failed to delete order');
		}

		return result.data.deleteOrder;
	} catch (error) {
		handleApiError(error, 'Не удалось удалить заказ');
		throw error;
	}
}

/**
 * Refresh orders list
 * @returns {Promise<Array>} List of orders
 */
export async function refreshOrders() {
	return getOrders(1000, 1);
}

/**
 * Get all companies for dropdown
 * @returns {Promise<Array>} List of companies
 */
export async function getCompaniesForDropdown() {
	const query = `
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

/**
 * Get all projects for dropdown
 * @returns {Promise<Array>} List of projects
 */
export async function getProjectsForDropdown() {
	const query = `
		query GetProjects {
			projects(first: 1000) {
				data {
					id
					value
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
			throw new Error(result.errors[0]?.message || 'Failed to fetch projects');
		}

		return result.data.projects.data;
	} catch (error) {
		handleApiError(error, 'Не удалось загрузить проекты');
		throw error;
	}
}
