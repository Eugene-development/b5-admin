import { createContractsApiWithFetch } from '$lib/api/contracts.js';

export async function load({ fetch, cookies }) {
	// Create API client with server-side fetch
	const contractsApi = createContractsApiWithFetch(fetch, cookies);

	// Return a promise that will be streamed to the client
	return {
		contractsData: (async () => {
			try {
				const contracts = await contractsApi.getContracts(1000, 1);
				return {
					contracts,
					error: null
				};
			} catch (error) {
				console.error('Failed to load contracts:', error);
				return {
					contracts: [],
					error: {
						message: error.message || 'Не удалось загрузить контракты',
						canRetry: true
					}
				};
			}
		})()
	};
}
