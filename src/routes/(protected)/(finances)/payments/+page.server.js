import { createBonusPaymentsApiWithFetch } from '$lib/api/bonusPayments.js';

/**
 * Server-side load function для страницы выплат
 * Feature: bonus-payments
 * Requirements: 6.1
 */
export async function load({ fetch }) {
	try {
		const api = createBonusPaymentsApiWithFetch(fetch);

		// Загружаем заявки и статусы параллельно
		const [requestsData, statuses] = await Promise.all([
			api.getBonusPaymentRequests(100, 1),
			api.getBonusPaymentStatuses()
		]);

		return {
			paymentsData: {
				requests: requestsData.data || [],
				paginatorInfo: requestsData.paginatorInfo || null,
				statuses: statuses || [],
				error: null
			}
		};
	} catch (error) {
		console.error('Failed to load payments data:', error);
		return {
			paymentsData: {
				requests: [],
				paginatorInfo: null,
				statuses: [],
				error: {
					message: error.message || 'Не удалось загрузить данные',
					canRetry: true
				}
			}
		};
	}
}
