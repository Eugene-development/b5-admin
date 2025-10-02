import { browser } from '$app/environment';
import { error } from '@sveltejs/kit';
import { hasOrderAccess } from '$lib/utils/domainAccess.svelte.js';

export async function load({ fetch }) {
	// Проверяем доступ к странице order только для разрешенных доменов
	if (browser && !hasOrderAccess()) {
		throw error(403, {
			message: 'Доступ к странице заказов запрещен для данного домена'
		});
	}

	try {
		// Здесь будет запрос к API для получения заказов
		// Пока используем моковые данные
		const orders = [
			{
				id: 1,
				supplier: 'ООО "Поставщик 1"',
				phone: '+7 (999) 123-45-67',
				deal: 'Поставка оборудования',
				comment: 'Срочный заказ, требуется доставка до конца недели',
				status: 'active',
				amount: 150000,
				created_at: '2025-01-15T10:30:00Z',
				updated_at: '2025-01-20T14:20:00Z',
				items: [
					{
						name: 'Компьютер Dell',
						description: 'Офисный компьютер',
						quantity: 5,
						price: 25000
					},
					{
						name: 'Монитор Samsung',
						description: '24 дюйма',
						quantity: 5,
						price: 15000
					}
				]
			},
			{
				id: 2,
				supplier: 'ИП Иванов И.И.',
				phone: '+7 (999) 987-65-43',
				deal: 'Канцелярские товары',
				comment: 'Регулярная поставка офисных принадлежностей',
				status: 'pending',
				amount: 25000,
				created_at: '2025-01-18T09:15:00Z',
				updated_at: '2025-01-18T09:15:00Z'
			},
			{
				id: 3,
				supplier: 'ООО "Техносервис"',
				phone: '+7 (999) 555-44-33',
				deal: 'Ремонт оборудования',
				comment: '',
				status: 'completed',
				amount: 75000,
				created_at: '2025-01-10T16:45:00Z',
				updated_at: '2025-01-22T11:30:00Z'
			}
		];

		return {
			orders
		};
	} catch (error) {
		console.error('Error loading orders:', error);
		return {
			orders: []
		};
	}
}