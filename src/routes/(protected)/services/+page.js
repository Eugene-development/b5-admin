// Mock data for services
const mockServices = [
	{
		id: 1,
		service_name: 'Разработка веб-приложений',
		company_name: 'ООО "Техносервис"',
		legal_name: 'Общество с ограниченной ответственностью "Техносервис"',
		inn: '7707083893',
		email: 'info@technoservice.ru',
		phone: '+7 (495) 123-45-67',
		contact_person: 'Иванов Иван Иванович',
		region: 'Москва',
		status: 'active',
		characteristics: 'IT-услуги, разработка ПО',
		description: 'Компания занимается разработкой программного обеспечения',
		created_at: '2024-01-15T10:30:00Z',
		updated_at: '2024-02-01T14:20:00Z'
	},
	{
		id: 2,
		service_name: 'Бухгалтерский учет',
		company_name: 'ИП Петров',
		legal_name: 'Индивидуальный предприниматель Петров Петр Петрович',
		inn: '123456789012',
		email: 'petrov@example.com',
		phone: '+7 (812) 987-65-43',
		contact_person: 'Петров Петр Петрович',
		region: 'Санкт-Петербург',
		status: 'banned',
		characteristics: 'Консалтинг, аудит',
		description: 'Консалтинговые услуги для малого бизнеса',
		created_at: '2024-01-20T09:15:00Z',
		updated_at: '2024-01-25T16:45:00Z'
	},
	{
		id: 3,
		service_name: 'Строительство домов',
		company_name: 'АО "Стройком"',
		legal_name: 'Акционерное общество "Строительная компания"',
		inn: '7701234567',
		email: 'contact@stroykom.ru',
		phone: '+7 (495) 555-12-34',
		contact_person: 'Сидорова Анна Владимировна',
		region: 'Московская область',
		status: 'active',
		characteristics: 'Строительство, проектирование',
		description: 'Строительная компания полного цикла',
		created_at: '2024-02-01T11:00:00Z',
		updated_at: '2024-02-05T13:30:00Z'
	}
];

/** @type {import('./$types').PageLoad} */
export async function load() {
	// Simulate API call delay
	await new Promise(resolve => setTimeout(resolve, 1000));
	
	return {
		services: mockServices
	};
}