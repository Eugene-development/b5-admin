<script>
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
	import ServiceTable from '$lib/components/ServiceTable.svelte';
	import ServiceViewModal from '$lib/components/ServiceViewModal.svelte';
	import { onMount } from 'svelte';

	// State
	let services = [];
	let isLoading = false;
	let searchTerm = '';
	let hasSearched = false;
	let updateCounter = 0;

	// Modal state
	let selectedService = null;
	let isViewModalOpen = false;

	// Mock data for demonstration
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

	// Load services
	async function loadServices() {
		isLoading = true;
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			services = mockServices;
		} catch (error) {
			console.error('Error loading services:', error);
		} finally {
			isLoading = false;
		}
	}

	// Search services
	function handleSearch() {
		hasSearched = true;
		if (searchTerm.trim()) {
			services = mockServices.filter(service =>
				service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				service.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				service.legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				service.inn.includes(searchTerm) ||
				service.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
				service.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
				service.region.toLowerCase().includes(searchTerm.toLowerCase())
			);
		} else {
			services = mockServices;
			hasSearched = false;
		}
		updateCounter++;
	}

	// Clear search
	function clearSearch() {
		searchTerm = '';
		services = mockServices;
		hasSearched = false;
		updateCounter++;
	}

	// Handle service actions
	function handleBanService(service) {
		console.log('Ban/Unban service:', service);
		// Update service status
		const index = services.findIndex(s => s.id === service.id);
		if (index !== -1) {
			services[index].status = services[index].status === 'banned' ? 'active' : 'banned';
			updateCounter++;
		}
	}

	function handleDeleteService(service) {
		if (confirm(`Вы уверены, что хотите удалить сервис "${service.company_name}"?`)) {
			console.log('Delete service:', service);
			services = services.filter(s => s.id !== service.id);
			updateCounter++;
		}
	}

	function handleViewService(service) {
		selectedService = service;
		isViewModalOpen = true;
	}

	function handleEditService(service) {
		console.log('Edit service:', service);
		// Here you would navigate to edit page or open edit modal
		alert(`Редактирование сервиса "${service.company_name}" (функция в разработке)`);
	}

	function closeViewModal() {
		isViewModalOpen = false;
		selectedService = null;
	}

	// Load data on mount
	onMount(() => {
		loadServices();
	});
</script>

<ProtectedRoute>
	{#snippet children()}
		<div class="space-y-6">
			<!-- Header -->
			<div>
				<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Сервисы</h1>
				<p class="mt-2 text-gray-600 dark:text-gray-400">
					Управление сервисами и поставщиками услуг в системе.
				</p>
			</div>

			<!-- Search and Actions -->
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex flex-1 items-center space-x-4">
					<div class="relative flex-1 max-w-md">
						<input
							type="text"
							bind:value={searchTerm}
							oninput={handleSearch}
							placeholder="Поиск по услуге, компании, ИНН, email..."
							class="block w-full rounded-md border-gray-300 pl-10 pr-3 py-2 text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
						/>
						<div class="absolute inset-y-0 left-0 flex items-center pl-3">
							<svg
								class="h-5 w-5 text-gray-400"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
						</div>
					</div>
					{#if hasSearched}
						<button
							type="button"
							onclick={clearSearch}
							class="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
						>
							Очистить
						</button>
					{/if}
				</div>
				<div class="flex items-center space-x-3">
					<button
						type="button"
						onclick={loadServices}
						disabled={isLoading}
						class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-700"
					>
						{#if isLoading}
							<svg
								class="mr-2 h-4 w-4 animate-spin"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
						{:else}
							<svg
								class="mr-2 h-4 w-4"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
						{/if}
						Обновить
					</button>
					<button
						type="button"
						class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
					>
						<svg
							class="mr-2 h-4 w-4"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						Добавить сервис
					</button>
				</div>
			</div>

			<!-- Services Table -->
			<ServiceTable
				{services}
				{isLoading}
				{searchTerm}
				{hasSearched}
				{updateCounter}
				onBanService={handleBanService}
				onDeleteService={handleDeleteService}
				onViewService={handleViewService}
				onEditService={handleEditService}
			/>
		</div>

		<!-- View Modal -->
		<ServiceViewModal
			service={selectedService}
			isOpen={isViewModalOpen}
			onClose={closeViewModal}
		/>
	{/snippet}
</ProtectedRoute>
