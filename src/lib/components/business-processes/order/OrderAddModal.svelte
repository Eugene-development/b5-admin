<script>
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

	let formData = $state({
		value: '',
		company_id: '',
		project_id: '',
		order_amount: '',
		agent_percentage: '5',
		curator_percentage: '5',
		is_active: false,
		is_urgent: false
	});

	let positions = $state([]);

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

	$effect(() => {
		if (isOpen) {
			formData = {
				value: '',
				company_id: '',
				project_id: '',
				order_amount: '',
				agent_percentage: '5',
				curator_percentage: '5',
				is_active: false,
				is_urgent: false
			};
			positions = [];
			errors = {};
		}
	});

	function addPosition() {
		positions = [...positions, { id: Date.now(), value: '', article: '', price: '', count: 1 }];
	}

	function removePosition(id) {
		positions = positions.filter((p) => p.id !== id);
	}

	function updatePosition(id, field, value) {
		positions = positions.map((p) => (p.id === id ? { ...p, [field]: value } : p));
	}

	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen && !isLoading) handleCancel();
	}

	function handleBackdropClick(event) {
		if (event.target === event.currentTarget && !isLoading) handleCancel();
	}

	function handleSubmit(event) {
		event.preventDefault();
		if (isFormValid && !isLoading) handleSave();
	}

	async function handleSave() {
		if (onSave && !isLoading && isFormValid) {
			const orderData = {
				value: formData.value.trim() || 'Не указан',
				company_id: formData.company_id,
				project_id: formData.project_id,
				order_amount: formData.order_amount ? parseFloat(formData.order_amount) : null,
				agent_percentage: parseFloat(formData.agent_percentage) || 5,
				curator_percentage: parseFloat(formData.curator_percentage) || 5,
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

	function handleCancel() {
		if (onCancel && !isLoading) onCancel();
	}

	$effect(() => {
		if (isOpen) {
			previousActiveElement = document.activeElement;
			setTimeout(() => {
				if (firstInputElement) firstInputElement.focus();
			}, 100);
			document.addEventListener('keydown', handleKeydown);
			document.body.style.overflow = 'hidden';
		} else {
			document.removeEventListener('keydown', handleKeydown);
			document.body.style.overflow = '';
			if (previousActiveElement) previousActiveElement.focus();
		}
		return () => {
			document.removeEventListener('keydown', handleKeydown);
			document.body.style.overflow = '';
		};
	});

	function handleTabKey(event) {
		if (!isOpen) return;
		const focusableElements = modalElement?.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		if (!focusableElements || focusableElements.length === 0) return;
		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];
		if (event.key === 'Tab') {
			if (event.shiftKey) {
				if (document.activeElement === firstElement) {
					event.preventDefault();
					lastElement.focus();
				}
			} else {
				if (document.activeElement === lastElement) {
					event.preventDefault();
					firstElement.focus();
				}
			}
		}
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
		<div
			class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
			onclick={handleBackdropClick}
			aria-hidden="true"
		></div>

		<div class="flex min-h-full items-center justify-center p-4">
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				bind:this={modalElement}
				class="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-gray-900"
				onkeydown={handleTabKey}
				tabindex="-1"
				role="document"
			>
				<!-- Header with gradient -->
				<div
					class="relative overflow-hidden bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-500 px-6 py-5"
				>
					<div class="bg-grid-white/10 absolute inset-0"></div>
					<div class="relative flex items-start justify-between">
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm"
							>
								<svg
									class="h-5 w-5 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 6v6m0 0v6m0-6h6m-6 0H6"
									/>
								</svg>
							</div>
							<div>
								<h2 class="text-xl font-bold text-white">Добавить заказ</h2>
								<!-- <p class="mt-0.5 text-sm text-amber-100">Заполните информацию о новом заказе</p> -->
							</div>
						</div>
						<button
							type="button"
							onclick={handleCancel}
							disabled={isLoading}
							aria-label="Закрыть"
							class="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white disabled:opacity-50"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/></svg
							>
						</button>
					</div>
				</div>

				<!-- Form Content -->
				<form onsubmit={handleSubmit} class="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
					<div class="space-y-6">
						<!-- Order Information -->
						<div
							class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
						>
							<h3
								class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
							>
								<svg
									class="h-4 w-4 text-amber-500"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								Информация о заказе
							</h3>
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label
										for="company-id"
										class="block text-sm font-medium text-gray-700 dark:text-gray-300"
										>Поставщик <span class="text-red-500">*</span></label
									>
									<select
										bind:this={firstInputElement}
										id="company-id"
										bind:value={formData.company_id}
										disabled={isLoading}
										required
										class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									>
										<option value="">Не указан</option>
										{#each companies as company}<option value={company.id}>{company.name}</option
											>{/each}
									</select>
								</div>
								<div>
									<label
										for="project-id"
										class="block text-sm font-medium text-gray-700 dark:text-gray-300"
										>Проект <span class="text-red-500">*</span></label
									>
									<select
										id="project-id"
										bind:value={formData.project_id}
										disabled={isLoading}
										required
										class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									>
										<option value="">Не указан</option>
										{#each projects as project}<option value={project.id}
												>{project.value || 'Без названия'}</option
											>{/each}
									</select>
								</div>
							</div>
							<div class="mt-4">
								<label
									for="order-value"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
									>Комментарий</label
								>
								<input
									type="text"
									id="order-value"
									bind:value={formData.value}
									disabled={isLoading}
									placeholder="Не указан"
									class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
								/>
							</div>
							<div class="mt-4 flex items-center gap-6">
								<label class="flex items-center gap-2">
									<input
										type="checkbox"
										bind:checked={formData.is_active}
										disabled={isLoading}
										class="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700"
									/>
									<span class="text-sm text-gray-700 dark:text-gray-300">Активен</span>
								</label>
								<label class="flex items-center gap-2">
									<input
										type="checkbox"
										bind:checked={formData.is_urgent}
										disabled={isLoading}
										class="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700"
									/>
									<span class="text-sm text-gray-700 dark:text-gray-300">Срочный</span>
								</label>
							</div>
						</div>

						<!-- Bonus Fields -->
						<div
							class="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:border-amber-800 dark:from-amber-900/30 dark:to-orange-900/30"
						>
							<h3
								class="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300"
							>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								Бонусы агента и куратора
							</h3>
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
								<div>
									<label
										for="order-amount"
										class="block text-sm font-medium text-gray-700 dark:text-gray-300"
										>Сумма закупки (₽)</label
									>
									<input
										type="number"
										id="order-amount"
										bind:value={formData.order_amount}
										disabled={isLoading}
										min="0"
										step="0.01"
										placeholder="Не указана"
										class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
								<div>
									<label
										for="agent-percentage"
										class="block text-sm font-medium text-gray-700 dark:text-gray-300"
										>% агента</label
									>
									<input
										type="number"
										id="agent-percentage"
										bind:value={formData.agent_percentage}
										disabled={isLoading}
										min="0"
										max="100"
										step="0.01"
										class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
								<div>
									<label
										for="curator-percentage"
										class="block text-sm font-medium text-gray-700 dark:text-gray-300"
										>% куратора</label
									>
									<input
										type="number"
										id="curator-percentage"
										bind:value={formData.curator_percentage}
										disabled={isLoading}
										min="0"
										max="100"
										step="0.01"
										class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
							</div>
							<p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
								Бонусы будут рассчитаны автоматически при активации заказа
							</p>
						</div>

						<!-- Order Positions -->
						<div
							class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
						>
							<div class="mb-4 flex items-center justify-between">
								<h3
									class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
								>
									<svg
										class="h-4 w-4 text-amber-500"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
										/>
									</svg>
									Позиции заказа <span class="text-red-500">*</span>
								</h3>
								<button
									type="button"
									onclick={addPosition}
									disabled={isLoading}
									class="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-500 disabled:opacity-50"
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 4v16m8-8H4"
										/></svg
									>
									Добавить
								</button>
							</div>

							{#if positions.length === 0}
								<div
									class="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-600"
								>
									<p class="text-sm text-gray-500 dark:text-gray-400">
										Нажмите "Добавить" чтобы добавить позиции в заказ
									</p>
								</div>
							{:else}
								<div class="space-y-3">
									{#each positions as position, index (position.id)}
										<div
											class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800"
										>
											<div class="mb-2 flex items-center justify-between">
												<span class="text-xs font-medium text-gray-500 dark:text-gray-400"
													>Позиция #{index + 1}</span
												>
												<button
													type="button"
													onclick={() => removePosition(position.id)}
													disabled={isLoading}
													aria-label="Удалить позицию"
													class="text-red-500 hover:text-red-700 disabled:opacity-50"
												>
													<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
														><path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M6 18L18 6M6 6l12 12"
														/></svg
													>
												</button>
											</div>
											<div
												class="grid gap-3"
												style="grid-template-columns: 2.33fr 1fr 0.66fr 0.5fr;"
											>
												<div>
													<input
														type="text"
														bind:value={position.value}
														oninput={(e) => updatePosition(position.id, 'value', e.target.value)}
														disabled={isLoading}
														required
														placeholder="Наименование *"
														class="block w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
													/>
												</div>
												<div>
													<input
														type="text"
														bind:value={position.article}
														oninput={(e) => updatePosition(position.id, 'article', e.target.value)}
														disabled={isLoading}
														required
														placeholder="Артикул *"
														class="block w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
													/>
												</div>
												<div>
													<input
														type="number"
														bind:value={position.price}
														oninput={(e) => updatePosition(position.id, 'price', e.target.value)}
														disabled={isLoading}
														required
														min="0"
														step="1"
														placeholder="Цена *"
														class="block w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
													/>
												</div>
												<div>
													<input
														type="number"
														bind:value={position.count}
														oninput={(e) => updatePosition(position.id, 'count', e.target.value)}
														disabled={isLoading}
														required
														min="1"
														placeholder="Кол-во *"
														class="block w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
													/>
												</div>
											</div>
											<div
												class="mt-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300"
											>
												Итого: {position.price && position.count
													? ((parseFloat(position.price) || 0) * position.count).toFixed(0)
													: '0'} ₽
											</div>
										</div>
									{/each}
								</div>
								<div class="mt-4 rounded-lg bg-gray-100 p-3 dark:bg-gray-700">
									<div class="flex items-center justify-between">
										<span class="text-sm font-medium text-gray-700 dark:text-gray-300"
											>Общая сумма:</span
										>
										<span class="text-lg font-bold text-gray-900 dark:text-white"
											>{positions
												.reduce((sum, p) => sum + (parseFloat(p.price) || 0) * p.count, 0)
												.toFixed(0)} ₽</span
										>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</form>

				<!-- Footer -->
				<div
					class="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50"
				>
					<div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
						<button
							type="button"
							onclick={handleCancel}
							disabled={isLoading}
							class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
						>
							Отмена
						</button>
						<button
							type="submit"
							onclick={handleSubmit}
							disabled={isLoading || !isFormValid}
							class="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-gray-900"
						>
							{#if isLoading}
								<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"
									><circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle><path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path></svg
								>
							{/if}
							{isLoading ? 'Сохранение...' : 'Добавить заказ'}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
