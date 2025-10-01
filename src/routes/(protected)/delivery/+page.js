// Mock data for delivery companies
export async function load() {
	// В реальном приложении здесь будет API запрос
	const deliveryCompanies = [
		{
			id: 1,
			name: 'ООО "Быстрая доставка"',
			legal_name: 'Общество с ограниченной ответственностью "Быстрая доставка"',
			inn: '4444444444',
			email: 'fast@delivery.com',
			phone: '+7 (999) 444-44-44',
			contact_person: 'Быстров Быстр Быстрович',
			region: 'Москва',
			status: 'active',
			created_at: '2024-01-30T12:00:00Z'
		},
		{
			id: 2,
			name: 'ИП Курьер',
			legal_name: 'Индивидуальный предприниматель Курьер Курьерский Курьерович',
			inn: '6666666666',
			email: 'courier@example.com',
			phone: '+7 (999) 666-66-66',
			contact_person: 'Курьер Курьерский Курьерович',
			region: 'Санкт-Петербург',
			status: 'active',
			created_at: '2024-02-05T13:30:00Z'
		},
		{
			id: 3,
			name: 'ООО "Медленная доставка"',
			legal_name: 'Общество с ограниченной ответственностью "Медленная доставка"',
			inn: '7777777777',
			email: 'slow@delivery.com',
			phone: '+7 (999) 777-77-77',
			contact_person: 'Медленов Медлен Медленович',
			region: 'Краснодар',
			status: 'suspended',
			created_at: '2024-01-12T15:45:00Z'
		}
	];

	return {
		deliveryCompanies
	};
}