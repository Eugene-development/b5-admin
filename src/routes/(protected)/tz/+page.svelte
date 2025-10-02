<script>
	import { onMount } from 'svelte';
	import TzTable from '$lib/components/TzTable.svelte';
	import TzViewModal from '$lib/components/TzViewModal.svelte';

	// State
	let tzList = [];
	let isLoading = false;
	let searchTerm = '';
	let hasSearched = false;
	let updateCounter = 0;

	// Modal state
	let isViewModalOpen = false;
	let selectedTz = null;

	// Mock data for demonstration
	const mockTzData = [
		{
			id: 1,
			curator: 'Иванов Иван Иванович',
			curator_phone: '+7 (999) 123-45-67',
			description: 'Разработка веб-приложения для управления заказами. Необходимо создать систему с возможностью добавления, редактирования и удаления заказов.',
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

	onMount(() => {
		loadTzData();
	});

	function loadTzData() {
		isLoading = true;
		// Simulate API call
		setTimeout(() => {
			tzList = mockTzData;
			isLoading = false;
			updateCounter++;
		}, 1000);
	}

	function handleViewTz(tz) {
		console.log('Opening modal for TZ:', tz);
		selectedTz = tz;
		isViewModalOpen = true;
		console.log('Modal state:', { isViewModalOpen, selectedTz });
	}

	function handleEditTz(tz) {
		// TODO: Implement edit functionality
		console.log('Edit TZ:', tz);
		alert(`Редактирование техзадания #${tz.id} будет реализовано позже`);
	}

	function handleDeleteTz(tz) {
		if (confirm(`Вы уверены, что хотите удалить техзадание #${tz.id}?`)) {
			// TODO: Implement delete functionality
			console.log('Delete TZ:', tz);
			alert(`Удаление техзадания #${tz.id} будет реализовано позже`);
		}
	}

	function closeViewModal() {
		console.log('Closing modal');
		isViewModalOpen = false;
		selectedTz = null;
	}

	function handleSearch() {
		hasSearched = true;
		// TODO: Implement search functionality
		console.log('Search term:', searchTerm);
	}
</script>

<svelte:head>
	<title>Техзадания - B5 Admin</title>
	<meta name="description" content="Управление техническими заданиями" />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8">
			<div class="md:flex md:items-center md:justify-between">
				<div class="min-w-0 flex-1">
					<h1 class="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl">
						Техзадания
					</h1>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Управление техническими заданиями и спецификациями
					</p>
				</div>
				<div class="mt-4 flex md:ml-4 md:mt-0">
					<button
						type="button"
						class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
					>
						<svg class="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
							<path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
						</svg>
						Создать ТЗ
					</button>
				</div>
			</div>
		</div>

		<!-- Search -->
		<div class="mb-6">
			<div class="flex flex-1 justify-center lg:ml-6 lg:justify-end">
				<div class="w-full max-w-lg lg:max-w-xs">
					<label for="search" class="sr-only">Поиск техзаданий</label>
					<div class="relative">
						<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
							<svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
							</svg>
						</div>
						<input
							id="search"
							name="search"
							class="block w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500"
							placeholder="Поиск техзаданий..."
							type="search"
							bind:value={searchTerm}
							on:input={handleSearch}
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Table -->
		<div class="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
			<TzTable
				{tzList}
				{isLoading}
				{searchTerm}
				{hasSearched}
				{updateCounter}
				onViewTz={handleViewTz}
				onEditTz={handleEditTz}
				onDeleteTz={handleDeleteTz}
			/>
		</div>
	</div>
</div>

<!-- View Modal -->
<TzViewModal
	isOpen={isViewModalOpen}
	tz={selectedTz}
	onClose={closeViewModal}
/>


