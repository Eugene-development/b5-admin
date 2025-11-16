<script>
	import StatusBadge from './StatusBadge.svelte';

	let { isOpen = false, contract = null, onClose } = $props();

	let modalElement = $state();
	let previousActiveElement;

	// Format date helper function
	function formatDate(dateString) {
		if (!dateString) return 'Не указана';
		return new Date(dateString).toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Format datetime helper function
	function formatDateTime(dateString) {
		if (!dateString) return 'Не указана';
		return new Date(dateString).toLocaleString('ru-RU', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Format percentage
	function formatPercentage(value) {
		if (value === null || value === undefined) return '—';
		return `${parseFloat(value).toFixed(2)}%`;
	}

	// Get contract status
	function getContractStatus(contract) {
		return contract?.is_active ? 'active' : 'inactive';
	}

	// Handle escape key press
	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen) {
			handleClose();
		}
	}

	// Handle backdrop click
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}

	// Handle close action
	function handleClose() {
		if (onClose) {
			onClose();
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

	// Trap focus within modal
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

<!-- Modal backdrop and container -->
{#if isOpen && contract}
	<div
		class="fixed inset-0 z-50 animate-fade overflow-y-auto animate-duration-100 animate-ease-linear"
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
				bind:this={modalElement}
				class="relative mx-4 transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:mx-0 sm:my-8 sm:w-full sm:max-w-3xl sm:p-6 dark:bg-gray-800"
				onkeydown={handleTabKey}
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
				tabindex="-1"
			>
				<!-- Modal Header -->
				<div class="mb-6 flex items-start justify-between">
					<div class="flex-1">
						<h3
							class="text-lg leading-6 font-semibold text-gray-900 dark:text-white"
							id="modal-title"
						>
							Детали контракта
						</h3>
						<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
							{contract.contract_number || 'Без номера'}
						</p>
					</div>
					<StatusBadge status={getContractStatus(contract)} />
				</div>

				<!-- Content -->
				<div class="space-y-6">
					<!-- Basic Information -->
					<div>
						<h4 class="mb-3 text-sm font-medium text-gray-900 dark:text-white">
							Основная информация
						</h4>
						<dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Контракт</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
									{contract.contract_number || '—'}
								</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Статус</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
									{contract.is_active ? 'Активен' : 'Неактивен'}
								</dd>
							</div>
						</dl>
					</div>

					<!-- Related Entities -->
					<div>
						<h4 class="mb-3 text-sm font-medium text-gray-900 dark:text-white">
							Связанные сущности
						</h4>
						<dl class="space-y-4">
							<div>
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Проект</dt>
								<dd class="mt-1">
									<div class="text-sm font-medium text-gray-900 dark:text-gray-100">
										{contract.project?.value || 'Не указан'}
									</div>
									{#if contract.project?.region}
										<div class="text-sm text-gray-500 dark:text-gray-400">
											Регион: {contract.project.region}
										</div>
									{/if}
									{#if contract.project?.description}
										<div class="mt-1 text-sm text-gray-500 dark:text-gray-400">
											{contract.project.description}
										</div>
									{/if}
								</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Компания</dt>
								<dd class="mt-1">
									<div class="text-sm font-medium text-gray-900 dark:text-gray-100">
										{contract.company?.name || 'Не указана'}
									</div>
									{#if contract.company?.legal_name}
										<div class="text-sm text-gray-500 dark:text-gray-400">
											Юр. название: {contract.company.legal_name}
										</div>
									{/if}
									{#if contract.company?.inn}
										<div class="text-sm text-gray-500 dark:text-gray-400">
											ИНН: {contract.company.inn}
										</div>
									{/if}
									{#if contract.company?.region}
										<div class="text-sm text-gray-500 dark:text-gray-400">
											Регион: {contract.company.region}
										</div>
									{/if}
								</dd>
							</div>
						</dl>
					</div>

					<!-- Dates -->
					<div>
						<h4 class="mb-3 text-sm font-medium text-gray-900 dark:text-white">Даты</h4>
						<dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Дата</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
									{formatDate(contract.contract_date)}
								</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
									Планируемое завершение
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
									{formatDate(contract.planned_completion_date)}
								</dd>
							</div>
							{#if contract.actual_completion_date}
								<div>
									<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
										Фактическое завершение
									</dt>
									<dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
										{formatDate(contract.actual_completion_date)}
									</dd>
								</div>
							{/if}
						</dl>
					</div>

					<!-- Financial Terms -->
					<div>
						<h4 class="mb-3 text-sm font-medium text-gray-900 dark:text-white">
							Финансовые условия
						</h4>
						<dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Процент агента</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
									{formatPercentage(contract.agent_percentage)}
								</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
									Процент куратора
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
									{formatPercentage(contract.curator_percentage)}
								</dd>
							</div>
						</dl>
					</div>

					<!-- Metadata -->
					<div>
						<h4 class="mb-3 text-sm font-medium text-gray-900 dark:text-white">Метаданные</h4>
						<dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Дата создания</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
									{formatDateTime(contract.created_at)}
								</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
									Дата обновления
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
									{formatDateTime(contract.updated_at)}
								</dd>
							</div>
						</dl>
					</div>
				</div>

				<!-- Action buttons -->
				<div class="mt-6 flex justify-end">
					<button
						type="button"
						onclick={handleClose}
						class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 transition-colors duration-200 ring-inset hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:bg-gray-100 sm:py-2 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
					>
						Закрыть
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
