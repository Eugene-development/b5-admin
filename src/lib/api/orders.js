import { handleApiError } from '$lib/utils/toastStore.js';
import { getAuthHeaders } from './config.js';
import { getGraphQLEndpoint } from '$lib/config/api.js';

// Use dynamic GraphQL endpoint based on current domain
function getApiUrl() {
	return getGraphQLEndpoint();
}

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
				order_amount
				agent_percentage
				curator_percentage
				agent_bonus
				curator_bonus
				is_active
				is_urgent
				partner_payment_status_id
				status_id
				partnerPaymentStatus {
					id
					code
					name
				}
				status {
					id
					slug
					value
					color
					sort_order
				}
				comments {
					id
					value
					author_name
					created_at
				}
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
		const response = await fetch(getApiUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...getAuthHeaders()
			},
			credentials: 'include',
			body: JSON.stringify({
				query: mutation,
				variables: {
					input: {
						value: orderData.value,
						company_id: orderData.company_id,
						project_id: orderData.project_id,
						...(orderData.order_number && { order_number: orderData.order_number }),
						delivery_date: orderData.delivery_date,
						actual_delivery_date: orderData.actual_delivery_date,
						order_amount: orderData.order_amount,
						agent_percentage: orderData.agent_percentage,
						curator_percentage: orderData.curator_percentage,
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
export async function getOrders(first = 1000, page = 1, fetchFn = fetch) {
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
					order_amount
					agent_percentage
					curator_percentage
					agent_bonus
					curator_bonus
					is_active
					is_urgent
					partner_payment_status_id
					status_id
					partnerPaymentStatus {
						id
						code
						name
					}
					status {
						id
						slug
						value
						color
						sort_order
					}
					comments {
						id
						value
						author_name
						created_at
					}
					created_at
					updated_at
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
						region
						client {
							id
							name
							phones {
								id
								value
								contact_person
								is_primary
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

	try {
		const response = await fetchFn(getApiUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...getAuthHeaders()
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
				order_amount
				agent_percentage
				curator_percentage
				agent_bonus
				curator_bonus
				is_active
				is_urgent
				partner_payment_status_id
				status_id
				partnerPaymentStatus {
					id
					code
					name
				}
				status {
					id
					slug
					value
					color
					sort_order
				}
				comments {
					id
					value
					author_name
					created_at
				}
				created_at
				updated_at
			}
		}
	`;

	try {
		const response = await fetch(getApiUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...getAuthHeaders()
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
						order_amount: orderData.order_amount,
						agent_percentage: orderData.agent_percentage,
						curator_percentage: orderData.curator_percentage,
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
		const response = await fetch(getApiUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...getAuthHeaders()
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
export async function getCompaniesForDropdown(fetchFn = fetch) {
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
		const response = await fetchFn(getApiUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...getAuthHeaders()
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
export async function getProjectsForDropdown(fetchFn = fetch) {
	const query = `
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

	try {
		const response = await fetchFn(getApiUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...getAuthHeaders()
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

/**
 * Update an order position
 * @param {Object} positionData - Position data to update
 * @returns {Promise<Object>} Updated position
 */
export async function updateOrderPosition(positionData) {
	const mutation = `
		mutation UpdateOrderPosition($input: UpdateOrderPositionInput!) {
			updateOrderPosition(input: $input) {
				id
				order_id
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
	`;

	try {
		const response = await fetch(getApiUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...getAuthHeaders()
			},
			credentials: 'include',
			body: JSON.stringify({
				query: mutation,
				variables: {
					input: positionData
				}
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'Failed to update position');
		}

		return result.data.updateOrderPosition;
	} catch (error) {
		handleApiError(error, 'Не удалось обновить позицию');
		throw error;
	}
}

/**
 * Delete an order position
 * @param {string} positionId - Position ID
 * @returns {Promise<Object>} Deleted position
 */
export async function deleteOrderPosition(positionId) {
	const mutation = `
		mutation DeleteOrderPosition($id: ID!) {
			deleteOrderPosition(id: $id) {
				id
			}
		}
	`;

	try {
		const response = await fetch(getApiUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...getAuthHeaders()
			},
			credentials: 'include',
			body: JSON.stringify({
				query: mutation,
				variables: {
					id: positionId
				}
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'Failed to delete position');
		}

		return result.data.deleteOrderPosition;
	} catch (error) {
		handleApiError(error, 'Не удалось удалить позицию');
		throw error;
	}
}

/**
 * Create a new order position
 * @param {Object} positionData - Position data with order_id
 * @returns {Promise<Object>} Created position
 */
export async function createOrderPosition(positionData) {
	const mutation = `
		mutation CreateOrderPosition($input: CreateSingleOrderPositionInput!) {
			createOrderPosition(input: $input) {
				id
				order_id
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
	`;

	try {
		const response = await fetch(getApiUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...getAuthHeaders()
			},
			credentials: 'include',
			body: JSON.stringify({
				query: mutation,
				variables: {
					input: positionData
				}
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'Failed to create position');
		}

		return result.data.createOrderPosition;
	} catch (error) {
		handleApiError(error, 'Не удалось создать позицию');
		throw error;
	}
}

/**
 * Get all order statuses
 * @returns {Promise<Array>} List of order statuses
 */
export async function getOrderStatuses(fetchFn = fetch) {
	const query = `
		query GetOrderStatuses {
			orderStatuses {
				id
				slug
				value
				color
				sort_order
			}
		}
	`;

	try {
		const response = await fetchFn(getApiUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...getAuthHeaders()
			},
			credentials: 'include',
			body: JSON.stringify({ query })
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'Failed to fetch order statuses');
		}

		return result.data.orderStatuses || [];
	} catch (error) {
		handleApiError(error, 'Не удалось загрузить статусы заказов');
		throw error;
	}
}

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {string} statusSlug - New status slug
 * @returns {Promise<Object>} Updated order with new status
 */
export async function updateOrderStatus(orderId, statusSlug) {
	const mutation = `
		mutation UpdateOrderStatus($orderId: ID!, $statusSlug: String!) {
			updateOrderStatus(order_id: $orderId, status_slug: $statusSlug) {
				id
				status_id
				status {
					id
					slug
					value
					color
					sort_order
				}
			}
		}
	`;

	try {
		const response = await fetch(getApiUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...getAuthHeaders()
			},
			credentials: 'include',
			body: JSON.stringify({
				query: mutation,
				variables: {
					orderId,
					statusSlug
				}
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'Failed to update order status');
		}

		return result.data.updateOrderStatus;
	} catch (error) {
		handleApiError(error, 'Не удалось обновить статус заказа');
		throw error;
	}
}

/**
 * Factory function to create API client with server-side fetch support
 * @param {Function} fetch - SvelteKit fetch function
 * @param {Object} cookies - SvelteKit cookies object
 * @returns {Object} API client with bound fetch and cookies
 */
export function createOrdersApiWithFetch(fetch, cookies) {
	return {
		getOrders: (first, page) => getOrders(first, page, fetch),
		createOrder: (orderData) => createOrder(orderData),
		updateOrder: (orderData) => updateOrder(orderData),
		deleteOrder: (orderId) => deleteOrder(orderId),
		refreshOrders: () => refreshOrders(),
		createOrderPosition: (positionData) => createOrderPosition(positionData),
		updateOrderPosition: (positionData) => updateOrderPosition(positionData),
		deleteOrderPosition: (positionId) => deleteOrderPosition(positionId),
		getOrderStatuses: () => getOrderStatuses(fetch),
		addOrderComment: (orderId, value) => addOrderComment(orderId, value),
		updateOrderComment: (commentId, value) => updateOrderComment(commentId, value)
	};
}

/**
 * Add a comment to an order
 * @param {string} orderId - Order ID
 * @param {string} value - Comment text
 * @returns {Promise<Object>} Created comment
 */
export async function addOrderComment(orderId, value) {
	const mutation = `
		mutation AddOrderComment($order_id: ID!, $value: String!) {
			addOrderComment(order_id: $order_id, value: $value) {
				id
				value
				author_name
				created_at
			}
		}
	`;

	try {
		const response = await fetch(getApiUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...getAuthHeaders()
			},
			credentials: 'include',
			body: JSON.stringify({
				query: mutation,
				variables: { order_id: orderId, value }
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'Failed to add comment');
		}

		return result.data.addOrderComment;
	} catch (error) {
		handleApiError(error, 'Не удалось добавить комментарий');
		throw error;
	}
}

/**
 * Update an order comment
 * @param {string} commentId - Comment ID
 * @param {string} value - New comment text
 * @returns {Promise<Object>} Updated comment
 */
export async function updateOrderComment(commentId, value) {
	const mutation = `
		mutation UpdateOrderComment($id: ID!, $value: String!) {
			updateOrderComment(id: $id, value: $value) {
				id
				value
				author_name
				created_at
			}
		}
	`;

	try {
		const response = await fetch(getApiUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...getAuthHeaders()
			},
			credentials: 'include',
			body: JSON.stringify({
				query: mutation,
				variables: { id: commentId, value }
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'Failed to update comment');
		}

		return result.data.updateOrderComment;
	} catch (error) {
		handleApiError(error, 'Не удалось обновить комментарий');
		throw error;
	}
}
