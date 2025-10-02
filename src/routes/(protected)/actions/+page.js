// Mock data for actions
const mockActions = [
	{
		id: 1,
		company_name: 'ООО "Рога и Копыта"',
		action_name: 'Скидка 20% на все товары',
		phone: '+7 (495) 123-45-67',
		contact_person: 'Иванов Иван Иванович',
		region: 'Москва',
		start_date: '2025-02-01',
		end_date: '2025-02-28',
		description: 'Специальная акция для постоянных клиентов. Скидка действует на весь ассортимент товаров.',
		comment: 'Акция проводится в рамках празднования 10-летия компании',
		created_at: '2025-01-15',
		updated_at: '2025-01-20'
	},
	{
		id: 2,
		company_name: 'ИП Петров',
		action_name: 'Бесплатная доставка',
		phone: '+7 (812) 987-65-43',
		contact_person: 'Петров Петр Петрович',
		region: 'Санкт-Петербург',
		start_date: '2025-02-10',
		end_date: '2025-03-10',
		description: 'Бесплатная доставка при заказе от 3000 рублей',
		comment: 'Тестовая акция для оценки эффективности',
		created_at: '2025-01-18',
		updated_at: '2025-01-25'
	},
	{
		id: 3,
		company_name: 'ООО "Техносервис"',
		action_name: '2+1 на ремонт техники',
		phone: '+7 (495) 555-12-34',
		contact_person: 'Сидорова Анна Владимировна',
		region: 'Московская область',
		start_date: '2025-02-15',
		end_date: '2025-04-15',
		description: 'При заказе ремонта двух устройств, третье - бесплатно',
		comment: 'Акция действует только для бытовой техники',
		created_at: '2025-01-22',
		updated_at: '2025-01-30'
	}
];

/** @type {import('./$types').PageLoad} */
export async function load() {
	// Simulate API call delay
	await new Promise(resolve => setTimeout(resolve, 500));
	
	return {
		actions: mockActions
	};
}