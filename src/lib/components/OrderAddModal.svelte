<script>
	import { onMount } from 'svelte';

	let {
		isOpen = false,
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
		value: '',
		company_id: '',
		project_id: '',
		is_active: false,
		is_urgent: false
	});

	// Order positions state
	let positions = $state([]);

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

	// Reset form when modal opens
	$effect(() => {
		if (isOpen) {
			formData = {
				value: '',
				company_id: '',
				project_id: '',
				is_active: false,
				is_urgent: false
			};
			positions = [];
			errors = {};
		}
	});

	// Add new position
	function addPosition() {
		positions = [
			...positions,
			{
				id: Date.now(),
				value: '',
				article: '',
				price: '',
				count: 1
			}
		];
	}

	// Remove position
	function removePosition(id) {
		positions = positions.filter((p) => p.id !== id);
	}

	// Update position field
	function updatePosition(id, field, value) {
		positions = positions.map((p) => (p.id === id ? { ...p, [field]: value } : p));
	}

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

	// Handle save action
	async function handleSave() {
		if (onSave && !isLoading && isFormValid) {
			const orderData = {
				value: formData.value.trim() || 'Не указан',
				company_id: formData.company_id,
				project_id: formData.project_id,
				is_active: formData.is_active,
				is_urgent: formData.is_urgent,
				positions: positions.map((p) => ({
					value: p.value.trim(),
					article: p.article.trim(),
					price: parseFloat(p.price),
					count: parseInt(p.count),
					supplier: null,
					expected_delivery_date: null,
					actual_delivery_date: null,
					is_active: true,
					is_urgent: false
				}))
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
				class="relative mx-4 transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:mx-0 sm:my-8 sm:w-full sm:max-w-4xl sm:p-6 dark:bg-gray-800"
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
						Добавить заказ
					</h3>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Заполните информацию о новом заказе и его позициях
					</p>
				</div>

				<form onsubmit={handleSubmit} class="space-y-6">
					<!-- Order Information -->
					<div class="space-y-4">
						<h4 class="text-sm font-medium text-gray-900 dark:text-white">Информация о заказе</h4>

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
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
								for="order-value"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Комментарий
							</label>
							<input
								type="text"
								id="order-value"
								bind:value={formData.value}
								disabled={isLoading}
								placeholder="Не указан"
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							/>
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
							<div class="space-y-4">
								{#each positions as position, index (position.id)}
									<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
										<div class="mb-3 flex items-center justify-between">
											<span class="text-sm font-medium text-gray-700 dark:text-gray-300">
												Позиция #{index + 1}
											</span>
											<button
												type="button"
												onclick={() => removePosition(position.id)}
												disabled={isLoading}
												aria-label="Удалить позицию #{index + 1}"
												class="text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
											>
												<svg
													class="h-5 w-5"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													aria-hidden="true"
												>
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
												<label
													for="position-value-{position.id}"
													class="block text-sm font-medium text-gray-700 dark:text-gray-300"
												>
													Наименование <span class="text-red-500">*</span>
												</label>
												<input
													type="text"
													id="position-value-{position.id}"
													bind:value={position.value}
													oninput={(e) => updatePosition(position.id, 'value', e.target.value)}
													disabled={isLoading}
													required
													class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
												/>
											</div>

											<div>
												<label
													for="position-article-{position.id}"
													class="block text-sm font-medium text-gray-700 dark:text-gray-300"
												>
													Артикул <span class="text-red-500">*</span>
												</label>
												<input
													type="text"
													id="position-article-{position.id}"
													bind:value={position.article}
													oninput={(e) => updatePosition(position.id, 'article', e.target.value)}
													disabled={isLoading}
													required
													class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
												/>
											</div>

											<div>
												<label
													for="position-price-{position.id}"
													class="block text-sm font-medium text-gray-700 dark:text-gray-300"
												>
													Цена <span class="text-red-500">*</span>
												</label>
												<input
													type="number"
													id="position-price-{position.id}"
													bind:value={position.price}
													oninput={(e) => updatePosition(position.id, 'price', e.target.value)}
													disabled={isLoading}
													required
													min="0"
													step="1"
													class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
												/>
											</div>

											<div>
												<label
													for="position-count-{position.id}"
													class="block text-sm font-medium text-gray-700 dark:text-gray-300"
												>
													Количество <span class="text-red-500">*</span>
												</label>
												<input
													type="number"
													id="position-count-{position.id}"
													bind:value={position.count}
													oninput={(e) => updatePosition(position.id, 'count', e.target.value)}
													disabled={isLoading}
													required
													min="1"
													class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
												/>
											</div>
										</div>

										<div class="mt-3 flex items-center justify-end">
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
							{isLoading ? 'Сохранение...' : 'Добавить заказ'}
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
