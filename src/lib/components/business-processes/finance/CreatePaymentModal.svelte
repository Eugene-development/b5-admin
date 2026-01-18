<script>
	import { createAgentPayment, getAvailableBonusesForPayment } from '$lib/api/finances.js';
	import { addSuccessToast, handleApiError } from '$lib/utils/toastStore.js';

	let { isOpen = false, agents = [], paymentMethods = [], onClose, onPaymentCreated } = $props();

	let modalElement = $state();
	let previousActiveElement;

	// Form state
	let selectedAgentId = $state('');
	let selectedMethodId = $state('');
	let referenceNumber = $state('');
	let selectedBonusIds = $state([]);

	// Data state
	let availableBonuses = $state([]);
	let isLoadingBonuses = $state(false);
	let isCreating = $state(false);

	// Computed
	let totalAmount = $derived(
		availableBonuses
			.filter((b) => selectedBonusIds.includes(b.id))
			.reduce((sum, b) => sum + parseFloat(b.commission_amount || 0), 0)
	);

	let isFormValid = $derived(selectedAgentId && selectedMethodId && selectedBonusIds.length > 0);

	// Load bonuses when agent changes
	$effect(() => {
		if (selectedAgentId && isOpen) {
			loadBonuses();
		} else {
			availableBonuses = [];
			selectedBonusIds = [];
		}
	});

	async function loadBonuses() {
		isLoadingBonuses = true;
		try {
			availableBonuses = await getAvailableBonusesForPayment(selectedAgentId);
		} catch (error) {
			console.error('Failed to load bonuses:', error);
			availableBonuses = [];
		} finally {
			isLoadingBonuses = false;
		}
	}

	// Toggle bonus selection
	function toggleBonus(bonusId) {
		if (selectedBonusIds.includes(bonusId)) {
			selectedBonusIds = selectedBonusIds.filter((id) => id !== bonusId);
		} else {
			selectedBonusIds = [...selectedBonusIds, bonusId];
		}
	}

	// Select all bonuses
	function selectAllBonuses() {
		selectedBonusIds = availableBonuses.map((b) => b.id);
	}

	// Deselect all bonuses
	function deselectAllBonuses() {
		selectedBonusIds = [];
	}

	// Handle form submission
	async function handleSubmit(event) {
		event.preventDefault();
		if (!isFormValid || isCreating) return;

		isCreating = true;
		try {
			const payment = await createAgentPayment({
				agent_id: selectedAgentId,
				bonus_ids: selectedBonusIds,
				method_id: selectedMethodId,
				reference_number: referenceNumber || null
			});
			addSuccessToast('Выплата создана');
			if (onPaymentCreated) {
				onPaymentCreated(payment);
			}
			handleClose();
		} catch (error) {
			console.error('Failed to create payment:', error);
		} finally {
			isCreating = false;
		}
	}

	// Handle close
	function handleClose() {
		selectedAgentId = '';
		selectedMethodId = '';
		referenceNumber = '';
		selectedBonusIds = [];
		availableBonuses = [];
		if (onClose) onClose();
	}

	// Format currency
	function formatCurrency(amount) {
		return new Intl.NumberFormat('ru-RU', {
			style: 'currency',
			currency: 'RUB',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Format date
	function formatDate(dateString) {
		if (!dateString) return '—';
		return new Date(dateString).toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Handle escape key
	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen && !isCreating) {
			handleClose();
		}
	}

	// Handle backdrop click
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget && !isCreating) {
			handleClose();
		}
	}

	// Focus management
	$effect(() => {
		if (isOpen) {
			previousActiveElement = document.activeElement;
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
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
			<!-- Backdrop -->
			<div
				class="fixed inset-0 bg-black/80 transition-opacity"
				onclick={handleBackdropClick}
				aria-hidden="true"
			></div>

			<!-- Modal panel -->
			<div
				bind:this={modalElement}
				class="relative w-full transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:max-w-3xl sm:p-6 dark:bg-gray-800"
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
			>
				<!-- Header -->
				<div class="mb-6">
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white" id="modal-title">
						Создание выплаты
					</h3>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Выберите агента и бонусы для выплаты
					</p>
				</div>

				<form onsubmit={handleSubmit} class="space-y-6">
					<!-- Agent Selection -->
					<div>
						<label
							for="agent-select"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Агент <span class="text-red-500">*</span>
						</label>
						<select
							id="agent-select"
							bind:value={selectedAgentId}
							disabled={isCreating}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							required
						>
							<option value="">Выберите агента</option>
							{#each agents as agent}
								<option value={agent.id}>
									{agent.name} ({agent.email}) — {formatCurrency(
										agent.available_bonuses_total || 0
									)}
								</option>
							{/each}
						</select>
					</div>

					<!-- Payment Method -->
					<div>
						<label
							for="method-select"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Способ выплаты <span class="text-red-500">*</span>
						</label>
						<select
							id="method-select"
							bind:value={selectedMethodId}
							disabled={isCreating}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							required
						>
							<option value="">Выберите способ</option>
							{#each paymentMethods as method}
								<option value={method.id}>{method.name}</option>
							{/each}
						</select>
					</div>

					<!-- Reference Number -->
					<div>
						<label
							for="reference-number"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Номер документа
						</label>
						<input
							type="text"
							id="reference-number"
							bind:value={referenceNumber}
							disabled={isCreating}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							placeholder="Опционально"
						/>
					</div>

					<!-- Bonuses Selection -->
					{#if selectedAgentId}
						<div>
							<div class="mb-2 flex items-center justify-between">
								<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
									Бонусы для выплаты <span class="text-red-500">*</span>
								</label>
								{#if availableBonuses.length > 0}
									<div class="flex space-x-2">
										<button
											type="button"
											onclick={selectAllBonuses}
											class="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
										>
											Выбрать все
										</button>
										<button
											type="button"
											onclick={deselectAllBonuses}
											class="text-xs text-gray-600 hover:text-gray-500 dark:text-gray-400"
										>
											Снять выбор
										</button>
									</div>
								{/if}
							</div>

							{#if isLoadingBonuses}
								<div class="flex items-center justify-center py-8">
									<svg class="h-6 w-6 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
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
								</div>
							{:else if availableBonuses.length === 0}
								<div class="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
									<p class="text-sm text-yellow-700 dark:text-yellow-300">
										У этого агента нет доступных к выплате бонусов
									</p>
								</div>
							{:else}
								<div
									class="max-h-64 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-600"
								>
									{#each availableBonuses as bonus (bonus.id)}
										<label
											class="flex cursor-pointer items-center justify-between border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
										>
											<div class="flex items-center">
												<input
													type="checkbox"
													checked={selectedBonusIds.includes(bonus.id)}
													onchange={() => toggleBonus(bonus.id)}
													disabled={isCreating}
													class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
												/>
												<div class="ml-3">
													<div class="text-sm font-medium text-gray-900 dark:text-white">
														{bonus.source_type === 'contract' ? 'Договор' : 'Закупка'}
														{#if bonus.project_name}
															— {bonus.project_name}
														{/if}
													</div>
													<div class="text-xs text-gray-500 dark:text-gray-400">
														Доступен с {formatDate(bonus.available_at)}
													</div>
												</div>
											</div>
											<div class="text-sm font-semibold text-gray-900 dark:text-white">
												{formatCurrency(bonus.commission_amount)}
											</div>
										</label>
									{/each}
								</div>
							{/if}
						</div>
					{/if}

					<!-- Total Amount -->
					{#if selectedBonusIds.length > 0}
						<div class="rounded-lg bg-indigo-50 p-4 dark:bg-indigo-900/20">
							<div class="flex items-center justify-between">
								<span class="text-sm font-medium text-indigo-700 dark:text-indigo-300">
									Итого к выплате ({selectedBonusIds.length} бонус{selectedBonusIds.length === 1
										? ''
										: selectedBonusIds.length < 5
											? 'а'
											: 'ов'})
								</span>
								<span class="text-lg font-bold text-indigo-700 dark:text-indigo-300">
									{formatCurrency(totalAmount)}
								</span>
							</div>
						</div>
					{/if}

					<!-- Actions -->
					<div
						class="flex flex-col space-y-3 sm:flex-row-reverse sm:space-x-3 sm:space-y-0 sm:space-x-reverse"
					>
						<button
							type="submit"
							disabled={!isFormValid || isCreating}
							class="inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
						>
							{#if isCreating}
								<svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
								Создание...
							{:else}
								Создать выплату
							{/if}
						</button>
						<button
							type="button"
							onclick={handleClose}
							disabled={isCreating}
							class="inline-flex w-full items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 sm:w-auto dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
						>
							Отмена
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
