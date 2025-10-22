import { createTechnicalSpecificationsApiWithFetch } from '$lib/api/technicalSpecifications.js';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, cookies }) {
	try {
		const api = createTechnicalSpecificationsApiWithFetch(fetch, cookies);
		const tzList = await api.getTechnicalSpecifications();

		return {
			tzList: tzList || [],
			error: null
		};
	} catch (error) {
		console.error('Failed to load technical specifications:', error);
		return {
			tzList: [],
			error: {
				message: error.message || 'Не удалось загрузить техзадания',
				canRetry: true
			}
		};
	}
}