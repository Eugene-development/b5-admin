// Mock data for suppliers
export async function load() {
	// В реальном приложении здесь будет API запрос
	const suppliers = [
		{
			id: 1,
			name: 'ООО "Поставщик 1"',
			legal_name: 'Общество с ограниченной ответственностью "Поставщик 1"',
			inn: '1234567890',
			email: 'supplier1@example.com',
			phone: '+7 (999) 123-45-67',
			contact_person: 'Иванов Иван Иванович',
			region: 'Москва',
			status: 'active',
			created_at: '2024-01-15T10:30:00Z'
		},
		{
			id: 2,
			name: 'ИП Петров',
			legal_name: 'Индивидуальный предприниматель Петров Петр Петрович',
			inn: '0987654321',
			email: 'petrov@example.com',
			phone: '+7 (999) 987-65-43',
			contact_person: 'Петров Петр Петрович',
			region: 'Санкт-Петербург',
			status: 'active',
			created_at: '2024-02-20T14:15:00Z'
		},
		{
			id: 3,
			name: 'ООО "Заблокированный поставщик"',
			legal_name: 'Общество с ограниченной ответственностью "Заблокированный поставщик"',
			inn: '5555555555',
			email: 'blocked@example.com',
			phone: '+7 (999) 555-55-55',
			contact_person: 'Сидоров Сидор Сидорович',
			region: 'Екатеринбург',
			status: 'banned',
			created_at: '2024-01-10T09:00:00Z'
		}
	];

	return {
		suppliers
	};
}