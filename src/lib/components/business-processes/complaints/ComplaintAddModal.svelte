<script>
	import { addErrorToast } from '$lib/utils/toastStore.js';

	let {
		isOpen = false,
		onSave = () => {},
		onCancel = () => {},
		isLoading = false,
		contracts = [],
		orders = []
	} = $props();

	// Ensure contracts and orders are always arrays
	const safeContracts = $derived(Array.isArray(contracts) ? contracts : []);
	const safeOrders = $derived(Array.isArray(orders) ? orders : []);

	// Form state
	let formData = $state({
		title: '',
		description: '',
		contract_id: '',
		order_id: '',
		responsible_person: '',
		guilty_party: '',
		planned_resolution_date: '',
		actual_resolution_date: '',
		priority: 'medium',
		status: 'open',
		resolution_notes: '',
		is_active: true
	});

	// Reset form when modal opens
	$effect(() => {
		if (isOpen) {
			formData = {
				title: '',
				description: '',
				contract_id: '',
				order_id: '',
				responsible_person: '',
				guilty_party: '',
				planned_resolution_date: '',
				actual_resolution_date: '',
				priority: 'medium',
				status: 'open',
				resolution_notes: '',
				is_active: true
			};
		}
	});

	// Handle form submission
	function handleSubmit(event) {
		event.preventDefault();

		// Validate required fields
		if (!formData.title.trim()) {
			addErrorToast('Название обязательно для заполнения');
			return;
		}

		// Prepare data for submission
		const submitData = {
			title: formData.title.trim(),
			description: formData.description.trim() || null,
			contract_id: formData.contract_id || null,
			order_id: formData.order_id || null,
			responsible_person: formData.responsible_person.trim() || null,
			guilty_party: formData.guilty_party.trim() || null,
			planned_resolution_date: formData.planned_resolution_date || null,
			actual_resolution_date: formData.actual_resolution_date || null,
			priority: formData.priority,
			status: formData.status,
			resolution_notes: formData.resolution_notes.trim() || null,
			is_active: formData.is_active
		};

		onSave(submitData);
	}

	// Handle cancel
	function handleCancel() {
		onCancel();
	}

	// Handle backdrop click
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget && !isLoading) {
			handleCancel();
		}
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 animate-fade overflow-y-auto animate-duration-100 animate-ease-linear"
		aria-labelledby="modal-title"
		role="dialog"
		aria-modal="true"
	>
		<div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
			<!-- Backdrop -->
			<div
				class="fixed inset-0 bg-black/80 transition-opacity dark:bg-black/80"
				onclick={handleBackdropClick}
				aria-hidden="true"
			></div>

			<!-- Modal panel -->
			<div
				class="relative w-full transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:max-w-2xl dark:bg-gray-800"
			>
				<form onsubmit={handleSubmit}>
					<!-- Header -->
					<div
						class="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800"
					>
						<div class="flex items-center justify-between">
							<h3
								class="text-lg leading-6 font-semibold text-gray-900 dark:text-white"
								id="modal-title"
							>
								Добавить рекламацию
							</h3>
							<button
								type="button"
								onclick={handleCancel}
								disabled={isLoading}
								class="rounded-md text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-gray-300"
							>
								<span class="sr-only">Закрыть</span>
								<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
					</div>

					<!-- Body -->
					<div
						class="max-h-[calc(100vh-16rem)] overflow-y-auto bg-white px-6 py-4 dark:bg-gray-800"
					>
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<!-- Title (required) -->
							<div class="sm:col-span-2">
								<label
									for="title"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Название <span class="text-red-500">*</span>
								</label>
								<input
									type="text"
									id="title"
									bind:value={formData.title}
									required
									disabled={isLoading}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
									placeholder="Краткое описание проблемы"
								/>
							</div>

							<!-- Description -->
							<div class="sm:col-span-2">
								<label
									for="description"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Описание
								</label>
								<textarea
									id="description"
									bind:value={formData.description}
									rows="3"
									disabled={isLoading}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
									placeholder="Подробное описание рекламации"
								></textarea>
							</div>

							<!-- Contract -->
							<div>
								<label
									for="contract_id"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Контракт
								</label>
								<select
									id="contract_id"
									bind:value={formData.contract_id}
									disabled={isLoading}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
								>
									<option value="">Не выбрано</option>
									{#each safeContracts as contract}
										<option value={contract.id}>
											{contract.contract_number || contract.id}
										</option>
									{/each}
								</select>
							</div>

							<!-- Order -->
							<div>
								<label
									for="order_id"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Заказ
								</label>
								<select
									id="order_id"
									bind:value={formData.order_id}
									disabled={isLoading}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
								>
									<option value="">Не выбрано</option>
									{#each safeOrders as order}
										<option value={order.id}>
											{order.order_number || order.id}
										</option>
									{/each}
								</select>
							</div>

							<!-- Responsible Person -->
							<div>
								<label
									for="responsible_person"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Ответственный
								</label>
								<input
									type="text"
									id="responsible_person"
									bind:value={formData.responsible_person}
									disabled={isLoading}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
									placeholder="ФИО ответственного"
								/>
							</div>

							<!-- Guilty Party -->
							<div>
								<label
									for="guilty_party"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Виновная сторона
								</label>
								<input
									type="text"
									id="guilty_party"
									bind:value={formData.guilty_party}
									disabled={isLoading}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
									placeholder="Кто виноват"
								/>
							</div>

							<!-- Priority -->
							<div>
								<label
									for="priority"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Приоритет
								</label>
								<select
									id="priority"
									bind:value={formData.priority}
									disabled={isLoading}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
								>
									<option value="low">Низкий</option>
									<option value="medium">Средний</option>
									<option value="high">Высокий</option>
									<option value="critical">Критический</option>
								</select>
							</div>

							<!-- Status -->
							<div>
								<label
									for="status"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Статус
								</label>
								<select
									id="status"
									bind:value={formData.status}
									disabled={isLoading}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
								>
									<option value="open">Открыта</option>
									<option value="in_progress">В работе</option>
									<option value="resolved">Решена</option>
									<option value="closed">Закрыта</option>
								</select>
							</div>

							<!-- Planned Resolution Date -->
							<div>
								<label
									for="planned_resolution_date"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Плановая дата решения
								</label>
								<input
									type="date"
									id="planned_resolution_date"
									bind:value={formData.planned_resolution_date}
									disabled={isLoading}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
								/>
							</div>

							<!-- Actual Resolution Date -->
							<div>
								<label
									for="actual_resolution_date"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Фактическая дата решения
								</label>
								<input
									type="date"
									id="actual_resolution_date"
									bind:value={formData.actual_resolution_date}
									disabled={isLoading}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
								/>
							</div>

							<!-- Resolution Notes -->
							<div class="sm:col-span-2">
								<label
									for="resolution_notes"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Заметки о решении
								</label>
								<textarea
									id="resolution_notes"
									bind:value={formData.resolution_notes}
									rows="2"
									disabled={isLoading}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
									placeholder="Как была решена проблема"
								></textarea>
							</div>

							<!-- Is Active -->
							<div class="sm:col-span-2">
								<div class="flex items-center">
									<input
										type="checkbox"
										id="is_active"
										bind:checked={formData.is_active}
										disabled={isLoading}
										class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700"
									/>
									<label
										for="is_active"
										class="ml-2 block text-sm text-gray-700 dark:text-gray-300"
									>
										Активна
									</label>
								</div>
							</div>
						</div>
					</div>

					<!-- Footer -->
					<div
						class="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900"
					>
						<div class="flex justify-end space-x-3">
							<button
								type="button"
								onclick={handleCancel}
								disabled={isLoading}
								class="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
							>
								Отмена
							</button>
							<button
								type="submit"
								disabled={isLoading}
								class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
									Сохранение...
								{:else}
									Сохранить
								{/if}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
