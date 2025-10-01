// Mock data for contractors
export async function load() {
	// В реальном приложении здесь будет API запрос
	const contractors = [
		{
			id: 1,
			name: 'ООО "Подрядчик 1"',
			legal_name: 'Общество с ограниченной ответственностью "Подрядчик 1"',
			inn: '1111111111',
			email: 'contractor1@example.com',
			phone: '+7 (999) 111-11-11',
			contact_person: 'Козлов Козел Козлович',
			region: 'Новосибирск',
			status: 'active',
			created_at: '2024-01-25T11:45:00Z'
		},
		{
			id: 2,
			name: 'ИП Строитель',
			legal_name: 'Индивидуальный предприниматель Строитель Строй Строевич',
			inn: '2222222222',
			email: 'builder@example.com',
			phone: '+7 (999) 222-22-22',
			contact_person: 'Строитель Строй Строевич',
			region: 'Казань',
			status: 'active',
			created_at: '2024-02-10T16:20:00Z'
		},
		{
			id: 3,
			name: 'ООО "Неактивный подрядчик"',
			legal_name: 'Общество с ограниченной ответственностью "Неактивный подрядчик"',
			inn: '3333333333',
			email: 'inactive@example.com',
			phone: '+7 (999) 333-33-33',
			contact_person: 'Неактивов Неактив Неактивович',
			region: 'Ростов-на-Дону',
			status: 'inactive',
			created_at: '2024-01-05T08:30:00Z'
		}
	];

	return {
		contractors
	};
}