import { createComplaintsApiWithFetch } from '$lib/api/complaints.js';
import { createContractsApiWithFetch } from '$lib/api/contracts.js';
import { createOrdersApiWithFetch } from '$lib/api/orders.js';

export async function load({ fetch, cookies }) {
	// Create API clients with server-side fetch
	const complaintsApi = createComplaintsApiWithFetch(fetch, cookies);
	const contractsApi = createContractsApiWithFetch(fetch, cookies);
	const ordersApi = createOrdersApiWithFetch(fetch, cookies);

	// Return promises that will be streamed to the client
	return {
		complaintsData: (async () => {
			try {
				const [complaints, contracts, orders] = await Promise.all([
					complaintsApi.getComplaints(1000, 1),
					contractsApi.getContracts(1000, 1),
					ordersApi.getOrders(1000, 1)
				]);

				return {
					complaints,
					contracts,
					orders,
					error: null
				};
			} catch (error) {
				console.error('Failed to load complaints data:', error);
				return {
					complaints: [],
					contracts: [],
					orders: [],
					error: {
						message: error.message || 'Не удалось загрузить данные рекламаций',
						canRetry: true
					}
				};
			}
		})()
	};
}
