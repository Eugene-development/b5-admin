import { handleApiError } from '$lib/utils/toastStore.js';
import { getAuthHeaders } from './config.js';
import { getGraphQLEndpoint } from '$lib/config/api.js';

/**
 * API модуль для работы с заявками на выплату бонусов
 * Feature: bonus-payments
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.1
 */

// Use dynamic GraphQL endpoint based on current domain
function getApiUrl() {
	return getGraphQLEndpoint();
}

/**
 * Получить все заявки на выплату с пагинацией
 * @param {number} first - Количество записей на странице
 * @param {number} page - Номер страницы
 * @param {Object} filters - Фильтры (status_id, date_from, date_to)
 * @param {Function} fetchFn - Функция fetch
 * @returns {Promise<Object>} Данные с пагинацией
 */
export async function getBonusPaymentRequests(first = 20, page = 1, filters = {}, fetchFn = fetch) {
	const query = `
		query GetBonusPaymentRequests($first: Int, $page: Int, $status_id: ID, $date_from: DateTime, $date_to: DateTime) {
			bonusPaymentRequests(first: $first, page: $page, filters: { status_id: $status_id, date_from: $date_from, date_to: $date_to }) {
				data {
					id
					agent_id
					agent {
						id
						name
						email
					}
					amount
					payment_method
					card_number
					phone_number
					contact_info
					comment
					status_id
					status {
						id
						code
						name
						color
					}
					payment_date
					created_at
					updated_at
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
				variables: { 
					first, 
					page, 
					status_id: filters.status_id || null,
					date_from: filters.date_from || null,
					date_to: filters.date_to || null
				}
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'Failed to fetch bonus payment requests');
		}

		return result.data.bonusPaymentRequests;
	} catch (error) {
		handleApiError(error, 'Не удалось загрузить заявки на выплату');
		throw error;
	}
}

/**
 * Получить все статусы заявок на выплату
 * @param {Function} fetchFn - Функция fetch
 * @returns {Promise<Array>} Список статусов
 */
export async function getBonusPaymentStatuses(fetchFn = fetch) {
	const query = `
		query GetBonusPaymentStatuses {
			bonusPaymentStatuses {
				id
				code
				name
				description
				color
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
			throw new Error(result.errors[0]?.message || 'Failed to fetch bonus payment statuses');
		}

		return result.data.bonusPaymentStatuses || [];
	} catch (error) {
		handleApiError(error, 'Не удалось загрузить статусы заявок');
		throw error;
	}
}

/**
 * Обновить статус заявки на выплату
 * @param {string} requestId - ID заявки
 * @param {string} statusCode - Код нового статуса
 * @returns {Promise<Object>} Обновлённая заявка
 */
export async function updateBonusPaymentRequestStatus(requestId, statusCode) {
	const mutation = `
		mutation UpdateBonusPaymentRequestStatus($requestId: ID!, $statusCode: String!) {
			updateBonusPaymentRequestStatus(request_id: $requestId, status_code: $statusCode) {
				id
				agent_id
				agent {
					id
					name
					email
				}
				amount
				payment_method
				card_number
				phone_number
				contact_info
				comment
				status_id
				status {
					id
					code
					name
					color
				}
				payment_date
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
					requestId,
					statusCode
				}
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'Failed to update bonus payment request status');
		}

		return result.data.updateBonusPaymentRequestStatus;
	} catch (error) {
		handleApiError(error, 'Не удалось обновить статус заявки');
		throw error;
	}
}

/**
 * Обновить список заявок
 * @returns {Promise<Object>} Данные с пагинацией
 */
export async function refreshBonusPaymentRequests() {
	return getBonusPaymentRequests(100, 1);
}

/**
 * Factory function для создания API клиента с поддержкой server-side fetch
 * @param {Function} fetch - SvelteKit fetch function
 * @returns {Object} API клиент
 */
export function createBonusPaymentsApiWithFetch(fetch) {
	return {
		getBonusPaymentRequests: (first, page, filters) => getBonusPaymentRequests(first, page, filters, fetch),
		getBonusPaymentStatuses: () => getBonusPaymentStatuses(fetch),
		updateBonusPaymentRequestStatus: (requestId, statusCode) => updateBonusPaymentRequestStatus(requestId, statusCode),
		refreshBonusPaymentRequests: () => refreshBonusPaymentRequests()
	};
}
