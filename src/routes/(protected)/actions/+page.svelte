<script>
	import { onMount } from 'svelte';
	import ActionTable from '$lib/components/ActionTable.svelte';
	import ActionViewModal from '$lib/components/ActionViewModal.svelte';

	// State management
	let actions = [];
	let isLoading = false;
	let isRefreshing = false;
	let searchTerm = '';
	let hasSearched = false;
	let updateCounter = 0;

	// Modal state
	let selectedAction = null;
	let isViewModalOpen = false;

	// Mock data for demonstration
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

	onMount(() => {
		loadActions();
	});

	function loadActions() {
		isLoading = true;
		// Simulate API call
		setTimeout(() => {
			actions = mockActions;
			isLoading = false;
			updateCounter++;
		}, 500);
	}

	function handleViewAction(action) {
		selectedAction = action;
		isViewModalOpen = true;
	}

	function handleEditAction(action) {
		console.log('Edit action:', action);
		// TODO: Implement edit functionality
		alert(`Редактирование акции: ${action.action_name}`);
	}

	function handleDeleteAction(action) {
		if (confirm(`Вы уверены, что хотите удалить акцию "${action.action_name}"?`)) {
			console.log('Delete action:', action);
			// TODO: Implement delete functionality
			alert(`Акция "${action.action_name}" удалена`);
		}
	}

	function closeViewModal() {
		isViewModalOpen = false;
		selectedAction = null;
	}

	function handleSearch() {
		hasSearched = true;
		isLoading = true;
		
		setTimeout(() => {
			if (searchTerm.trim()) {
				actions = mockActions.filter(action => 
					action.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					action.action_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					action.region.toLowerCase().includes(searchTerm.toLowerCase())
				);
			} else {
				actions = mockActions;
				hasSearched = false;
			}
			isLoading = false;
			updateCounter++;
		}, 300);
	}

	function clearSearch() {
		searchTerm = '';
		hasSearched = false;
		actions = mockActions;
		updateCounter++;
	}

	function refreshData() {
		isRefreshing = true;
		// Simulate API call
		setTimeout(() => {
			actions = mockActions;
			isRefreshing = false;
			updateCounter++;
			// В реальном приложении здесь будет показано уведомление об успешном обновлении
			console.log('Данные успешно обновлены');
		}, 800);
	}
</script>

<svelte:head>
	<title>Акции - B5 Admin</title>
	<meta name="description" content="Управление акциями системы" />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<div class="px-4 py-8 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-7xl">
			<!-- Header with Refresh Button -->
			<div class="mb-8 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
				<div class="flex-auto">
					<h1 class="text-3xl font-bold text-gray-900 dark:text-white sm:text-2xl">Акции</h1>
					<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
						Управление акциями и промо-кампаниями системы
					</p>
				</div>
				<div class="flex-none">
					<button
						type="button"
						onclick={refreshData}
						disabled={isRefreshing}
						class="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 ease-in-out hover:bg-cyan-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
						aria-label="Обновить данные акций с сервера"
					>
						{#if isRefreshing}
							<svg
								class="mr-2 h-4 w-4 animate-spin"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								aria-hidden="true"
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
						{/if}
						{isRefreshing ? 'Обновляю...' : 'Обновить данные'}
					</button>
				</div>
			</div>

			<!-- Search and Actions Bar -->
			<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<!-- Search -->
				<div class="flex flex-1 items-center space-x-4">
					<div class="relative flex-1 max-w-md">
						<input
							type="text"
							bind:value={searchTerm}
							oninput={handleSearch}
							placeholder="Поиск по компании, акции или региону..."
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
							class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
						>
							Очистить
						</button>
					{/if}
				</div>

				<!-- Add Action Button -->
				<div class="flex items-center space-x-3">
					<button
						type="button"
						class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
					>
						<svg
							class="mr-2 h-4 w-4"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						Добавить акцию
					</button>
				</div>
			</div>

			<!-- Results Summary -->
			{#if hasSearched}
				<div class="mb-4 text-sm text-gray-600 dark:text-gray-400">
					{#if actions.length === 0}
						Акции не найдены по запросу "{searchTerm}"
					{:else}
						Найдено {actions.length} акци{actions.length === 1 ? 'я' : actions.length < 5 ? 'и' : 'й'} по запросу "{searchTerm}"
					{/if}
				</div>
			{/if}

			<!-- Actions Table -->
			<ActionTable
				{actions}
				{isLoading}
				{searchTerm}
				{hasSearched}
				{updateCounter}
				onViewAction={handleViewAction}
				onEditAction={handleEditAction}
				onDeleteAction={handleDeleteAction}
			/>
		</div>
	</div>
</div>

<!-- View Modal -->
<ActionViewModal
	action={selectedAction}
	isOpen={isViewModalOpen}
	onClose={closeViewModal}
/>


