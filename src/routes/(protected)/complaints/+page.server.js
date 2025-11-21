import { createComplaintsApiWithFetch } from '$lib/api/complaints.js';
import { createContractsApiWithFetch } from '$lib/api/contracts.js';
import { createOrdersApiWithFetch } from '$lib/api/orders.js';

export async function load({ fetch, cookies }) {
	// JWT tokens are stored in localStorage and not available on server
	// Return empty data immediately and let client load data via onMount
	// This prevents 401 errors during SSR
	return {
		complaintsData: Promise.resolve({
			complaints: [],
			contracts: [],
			orders: [],
			error: null
		})
	};
}
