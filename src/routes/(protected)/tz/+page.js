// Mock data for technical specifications (TZ)
const mockTzData = [
	{
		id: 1,
		curator: 'Иванов Иван Иванович',
		curator_phone: '+7 (999) 123-45-67',
		description:
			'Разработка веб-приложения для управления заказами. Необходимо создать систему с возможностью добавления, редактирования и удаления заказов.',
		sketch_file: '/files/sketch1.pdf',
		sketch_filename: 'sketch_v1.pdf',
		comment: 'Срочный проект, требуется завершить до конца месяца',
		commercial_proposal: '/files/cp1.pdf',
		cp_filename: 'commercial_proposal_v1.pdf',
		created_at: '2024-01-15T10:30:00Z',
		updated_at: '2024-01-20T14:45:00Z',
		status: 'В работе'
	},
	{
		id: 2,
		curator: 'Петрова Анна Сергеевна',
		curator_phone: '+7 (999) 987-65-43',
		description: 'Создание мобильного приложения для iOS и Android',
		sketch_file: null,
		sketch_filename: null,
		comment: 'Требуется согласование дизайна',
		commercial_proposal: '/files/cp2.pdf',
		cp_filename: 'mobile_app_proposal.pdf',
		created_at: '2024-01-10T09:15:00Z',
		updated_at: '2024-01-18T16:20:00Z',
		status: 'Ожидание'
	},
	{
		id: 3,
		curator: 'Сидоров Петр Александрович',
		curator_phone: '+7 (999) 555-12-34',
		description: 'Интеграция с внешними API и настройка автоматизации процессов',
		sketch_file: '/files/sketch3.jpg',
		sketch_filename: 'api_schema.jpg',
		comment: null,
		commercial_proposal: null,
		cp_filename: null,
		created_at: '2024-01-05T11:00:00Z',
		updated_at: '2024-01-15T13:30:00Z',
		status: 'Завершено'
	}
];

/** @type {import('./$types').PageLoad} */
export async function load() {
	// Simulate API call delay
	await new Promise(resolve => setTimeout(resolve, 1000));
	
	return {
		tzList: mockTzData
	};
}