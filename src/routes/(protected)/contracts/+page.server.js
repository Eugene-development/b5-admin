import { createContractsApiWithFetch } from '$lib/api/contracts.js';

export async function load({ fetch, cookies }) {
	// JWT tokens are stored in localStorage and not available on server
	// Return empty data immediately and let client load data via onMount
	// This prevents 401 errors during SSR
	return {
		contractsData: Promise.resolve({
			contracts: [],
			error: null
		})
	};
}
