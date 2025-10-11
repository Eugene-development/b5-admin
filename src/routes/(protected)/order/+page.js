import { browser } from '$app/environment';
import { error } from '@sveltejs/kit';
import { hasOrderAccess } from '$lib/utils/domainAccess.svelte.js';
import { getOrders, getCompaniesForDropdown, getProjectsForDropdown } from '$lib/api/orders.js';

export async function load({ fetch }) {
	// Проверяем доступ к странице order только для разрешенных доменов
	if (browser && !hasOrderAccess()) {
		throw error(403, {
			message: 'Доступ к странице заказов запрещен для данного домена'
		});
	}

	try {
		// Загружаем данные параллельно
		const [orders, companies, projects] = await Promise.all([
			getOrders(1000, 1).catch((err) => {
				console.error('Error loading orders:', err);
				return [];
			}),
			getCompaniesForDropdown().catch((err) => {
				console.error('Error loading companies:', err);
				return [];
			}),
			getProjectsForDropdown().catch((err) => {
				console.error('Error loading projects:', err);
				return [];
			})
		]);

		return {
			orders,
			companies,
			projects
		};
	} catch (err) {
		console.error('Error loading order page data:', err);
		return {
			orders: [],
			companies: [],
			projects: [],
			error: {
				message: 'Не удалось загрузить данные страницы заказов'
			}
		};
	}
}
