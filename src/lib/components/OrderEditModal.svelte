<script>
	import { onMount } from 'svelte';

	let {
		isOpen = false,
		order = null,
		onSave,
		onCancel,
		isLoading = false,
		companies = [],
		projects = []
	} = $props();

	let modalElement = $state();
	let firstInputElement = $state();
	let previousActiveElement;

	// Form data state
	let formData = $state({
		id: '',
		value: '',
		company_id: '',
		project_id: '',
		order_number: '',
		delivery_date: '',
		actual_delivery_date: '',
		is_active: true,
		is_urgent: false
	});

	// Order positions state
	let positions = $state([]);
	let deletedPositionIds = $state([]);

	// Form validation state
	let errors = $state({});
	let isFormValid = $derived(
		formData.company_id !== '' &&
		formData.project_id !== '' &&
		positions.length > 0 &&
		positions.every(
			(p) =>
				p.value.trim() &&
				p.article.trim() &&
				p.price !== '' &&
				parseFloat(p.price) > 0 &&
				p.count > 0
		) &&
		Object.keys(errors).length === 0
	);

	// Reset form when modal opens or order changes
	$effect(() => {
		if (isOpen && order) {
			formData = {
				id: order.id,
				value: order.value || '',
				company_id: order.company_id || '',
				project_id: order.project_id || '',
				order_number: order.order_number || '',
				delivery_date: order.delivery_date || '',
				actual_delivery_date: order.actual_delivery_date || '',
				is_active: order.is_active ?? true,
				is_urgent: order.is_urgent ?? false
			};
			
			// Load existing positions
			positions = order.positions ? order.positions.map(p => ({
				id: p.id,
				value: p.value || '',
				article: p.article || '',
				price: p.price || '',
				count: p.count || 1,
				is_active: p.is_active ?? true,
				is_urgent: p.is_urgent ?? false,
				isExisting: true // Mark as existing position
			})) : [];
			
			deletedPositionIds = [];
			errors = {};
		}
	});

	// Handle escape key press
	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen && !isLoading) {
			handleCancel();
		}
	}

	// Handle backdrop click
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget && !isLoading) {
			handleCancel();
		}
	}

	// Handle form submission
	function handleSubmit(event) {
		event.preventDefault();
		if (isFormValid && !isLoading) {
			handleSave();
		}
	}

	// Add new position
	function addPosition() {
		positions = [
			...positions,
			{
				id: `new-${Date.now()}`,
				value: '',
				article: '',
				price: '',
				count: 1,
				is_active: true,
				is_urgent: false,
				isExisting: false // Mark as new position
			}
		];
	}

	// Remove position
	function removePosition(position) {
		if (position.isExisting) {
			// Mark existing position for deletion
			deletedPositionIds = [...deletedPositionIds, position.id];
		}
		positions = positions.filter((p) => p.id !== position.id);
	}

	// Update position field
	function updatePosition(id, field, value) {
		positions = positions.map((p) => (p.id === id ? { ...p, [field]: value } : p));
	}

	// Handle save action
	async function handleSave() {
		if (onSave && !isLoading && isFormValid) {
			const orderData = {
				id: formData.id,
				value: formData.value.trim() || 'Не указан',
				company_id: formData.company_id,
				project_id: formData.project_id,
				order_number: formData.order_number.trim(),
				delivery_date: formData.delivery_date || null,
				actual_delivery_date: formData.actual_delivery_date || null,
				is_active: formData.is_active,
				is_urgent: formData.is_urgent,
				positions: positions.map((p) => ({
					id: p.isExisting ? p.id : undefined,
					value: p.value.trim(),
					article: p.article.trim(),
					price: parseFloat(p.price),
					count: parseInt(p.count),
					is_active: p.is_active,
					is_urgent: p.is_urgent,
					isExisting: p.isExisting
				})),
				deletedPositionIds
			};

			onSave(orderData);
		}
	}

	// Handle cancel action
	function handleCancel() {
		if (onCancel && !isLoading) {
			onCancel();
		}
	}

	// Focus management
	$effect(() => {
		if (isOpen) {
			previousActiveElement = document.activeElement;

			setTimeout(() => {
				if (firstInputElement) {
					firstInputElement.focus();
				}
			}, 100);

			document.addEventListener('keydown', handleKeydown);
			document.body.style.overflow = 'hidden';
		} else {
			document.removeEventListener('keydown', handleKeydown);
			document.body.style.overflow = '';

			if (previousActiveElement) {
				previousActiveElement.focus();
			}
		}

		return () => {
			document.removeEventListener('keydown', handleKeydown);
			document.body.style.overflow = '';
		};
	});
</script>

{#if isOpen}
	<div
		class="animate-fade animate-duration-100 animate-ease-linear fixed inset-0 z-50 overflow-y-auto"
	>
		<div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
			<div
				class="fixed inset-0 bg-black/80 transition-opacity dark:bg-black/80"
				onclick={handleBackdropClick}
				aria-hidden="true"
			></div>

			<div
				bind:this={modalElement}
				class="relative mx-4 transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:mx-0 sm:my-8 sm:w-full sm:max-w-5xl sm:p-6 dark:bg-gray-800"
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
				tabindex="-1"
			>
				<div class="mb-6">
					<h3
						class="text-lg font-semibold leading-6 text-gray-900 dark:text-white"
						id="modal-title"
					>
						Редактировать заказ
					</h3>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Обновите информацию о заказе
					</p>
				</div>

				<form onsubmit={handleSubmit} class="space-y-6">
					<!-- Order Information -->
					<div class="space-y-4">
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label
									for="company-id"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Поставщик <span class="text-red-500">*</span>
								</label>
								<select
									bind:this={firstInputElement}
									id="company-id"
									bind:value={formData.company_id}
									disabled={isLoading}
									required
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								>
									<option value="">Не указан</option>
									{#each companies as company}
										<option value={company.id}>{company.name}</option>
									{/each}
								</select>
							</div>

							<div>
								<label
									for="project-id"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Клиент <span class="text-red-500">*</span>
								</label>
								<select
									id="project-id"
									bind:value={formData.project_id}
									disabled={isLoading}
									required
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								>
									<option value="">Не указан</option>
									{#each projects as project}
										<option value={project.id}>{project.value || project.name}</option>
									{/each}
								</select>
							</div>
						</div>

						<div>
							<label
								for="order-number"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Номер заказа
							</label>
							<input
								type="text"
								id="order-number"
								bind:value={formData.order_number}
								disabled={isLoading}
								readonly
								class="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							/>
							<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
								Номер заказа нельзя изменить
							</p>
						</div>

						<div>
							<label
								for="order-value"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Комментарий
							</label>
							<textarea
								id="order-value"
								bind:value={formData.value}
								disabled={isLoading}
								rows="3"
								placeholder="Не указан"
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							></textarea>
						</div>

						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label
									for="delivery-date"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Планируемая дата поставки
								</label>
								<input
									type="date"
									id="delivery-date"
									bind:value={formData.delivery_date}
									disabled={isLoading}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								/>
							</div>

							<div>
								<label
									for="actual-delivery-date"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Фактическая дата поставки
								</label>
								<input
									type="date"
									id="actual-delivery-date"
									bind:value={formData.actual_delivery_date}
									disabled={isLoading}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								/>
							</div>
						</div>

						<div class="flex items-center space-x-6">
							<label class="flex items-center">
								<input
									type="checkbox"
									bind:checked={formData.is_active}
									disabled={isLoading}
									class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
								/>
								<span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Активен</span>
							</label>

							<label class="flex items-center">
								<input
									type="checkbox"
									bind:checked={formData.is_urgent}
									disabled={isLoading}
									class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
								/>
								<span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Срочный</span>
							</label>
						</div>
					</div>

					<!-- Order Positions -->
					<div class="space-y-4 border-t border-gray-200 pt-6 dark:border-gray-700">
						<div class="flex items-center justify-between">
							<h4 class="text-sm font-medium text-gray-900 dark:text-white">
								Позиции заказа <span class="text-red-500">*</span>
							</h4>
							<button
								type="button"
								onclick={addPosition}
								disabled={isLoading}
								class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<svg class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4v16m8-8H4"
									/>
								</svg>
								Добавить позицию
							</button>
						</div>

						{#if positions.length === 0}
							<div
								class="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-600"
							>
								<p class="text-sm text-gray-500 dark:text-gray-400">
									Нажмите "Добавить позицию" чтобы добавить товары или услуги в заказ
								</p>
							</div>
						{:else}
							<div class="max-h-96 space-y-4 overflow-y-auto">
								{#each positions as position, index (position.id)}
									<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
										<div class="mb-3 flex items-center justify-between">
											<span class="text-sm font-medium text-gray-700 dark:text-gray-300">
												Позиция #{index + 1}
												{#if position.isExisting}
													<span class="ml-2 text-xs text-gray-500 dark:text-gray-400">(существующая)</span>
												{:else}
													<span class="ml-2 text-xs text-green-600 dark:text-green-400">(новая)</span>
												{/if}
											</span>
											<button
												type="button"
												onclick={() => removePosition(position)}
												disabled={isLoading}
												class="text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
												aria-label="Удалить позицию"
											>
												<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M6 18L18 6M6 6l12 12"
													/>
												</svg>
											</button>
										</div>

										<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
											<div>
												<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
													Наименование <span class="text-red-500">*</span>
												</label>
												<input
													type="text"
													bind:value={position.value}
													oninput={(e) => updatePosition(position.id, 'value', e.target.value)}
													disabled={isLoading}
													required
													class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
												/>
											</div>

											<div>
												<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
													Артикул <span class="text-red-500">*</span>
												</label>
												<input
													type="text"
													bind:value={position.article}
													oninput={(e) => updatePosition(position.id, 'article', e.target.value)}
													disabled={isLoading}
													required
													class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
												/>
											</div>

											<div>
												<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
													Цена <span class="text-red-500">*</span>
												</label>
												<input
													type="number"
													bind:value={position.price}
													oninput={(e) => updatePosition(position.id, 'price', e.target.value)}
													disabled={isLoading}
													required
													min="0"
													step="1"
													class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
												/>
											</div>

											<div>
												<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
													Количество <span class="text-red-500">*</span>
												</label>
												<input
													type="number"
													bind:value={position.count}
													oninput={(e) => updatePosition(position.id, 'count', e.target.value)}
													disabled={isLoading}
													required
													min="1"
													class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
												/>
											</div>
										</div>

										<div class="mt-3 flex items-center justify-between">
											<div class="flex items-center space-x-4">
												<label class="flex items-center">
													<input
														type="checkbox"
														bind:checked={position.is_active}
														oninput={(e) => updatePosition(position.id, 'is_active', e.target.checked)}
														disabled={isLoading}
														class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
													/>
													<span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Активна</span>
												</label>

												<label class="flex items-center">
													<input
														type="checkbox"
														bind:checked={position.is_urgent}
														oninput={(e) => updatePosition(position.id, 'is_urgent', e.target.checked)}
														disabled={isLoading}
														class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
													/>
													<span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Срочная</span>
												</label>
											</div>
											<div class="text-sm font-medium text-gray-900 dark:text-white">
												Итого: {position.price && position.count
													? ((parseFloat(position.price) || 0) * position.count).toFixed(0)
													: '0'} ₽
											</div>
										</div>
									</div>
								{/each}
							</div>

							<div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-950">
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-gray-700 dark:text-gray-300">
										Общая сумма заказа:
									</span>
									<span class="text-lg font-bold text-gray-900 dark:text-white">
										{positions
											.reduce((sum, p) => sum + (parseFloat(p.price) || 0) * p.count, 0)
											.toFixed(0)} ₽
									</span>
								</div>
							</div>
						{/if}
					</div>

					<!-- Action buttons -->
					<div
						class="flex flex-col space-y-3 border-t border-gray-200 pt-6 sm:flex-row-reverse sm:space-x-3 sm:space-y-0 sm:space-x-reverse dark:border-gray-700"
					>
						<button
							type="submit"
							disabled={isLoading || !isFormValid}
							class="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2"
						>
							{#if isLoading}
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
							{isLoading ? 'Сохранение...' : 'Сохранить изменения'}
						</button>

						<button
							type="button"
							onclick={handleCancel}
							disabled={isLoading}
							class="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-colors duration-200 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600 dark:active:bg-gray-600"
						>
							Отмена
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
