<script>
	import { onMount } from 'svelte';

	/**
	 * ProjectViewModal Component
	 *
	 * A modal component for viewing detailed project information.
	 * Provides a read-only view of all project data with proper accessibility.
	 *
	 * @param {boolean} isOpen - Controls modal visibility
	 * @param {Object} project - The project object to display
	 * @param {Function} onClose - Callback function for closing the modal
	 */
	let { isOpen = false, project = null, onClose } = $props();

	let modalElement = $state();
	let closeButtonElement = $state();
	let previousActiveElement;

	// Format date helper function
	function formatDate(dateString) {
		if (!dateString) return 'Не указана';
		return new Date(dateString).toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	// Format currency helper function
	function formatCurrency(amount, currency = 'RUB') {
		if (!amount && amount !== 0) return 'Не указана';
		return new Intl.NumberFormat('ru-RU', {
			style: 'currency',
			currency: currency,
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Format agent rate helper function
	function formatAgentRate(rate) {
		if (!rate && rate !== 0) return 'Не указана';
		return `${rate}%`;
	}

	// Get agent display text
	function getAgentDisplay(agent) {
		if (!agent) return 'Не назначен';
		return `${agent.email} (ID: ${agent.id})`;
	}

	// Check if date is overdue
	function isOverdue(dateString) {
		if (!dateString) return false;
		return new Date(dateString) < new Date();
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

	// Handle backdrop keydown for accessibility
	function handleBackdropKeydown(event) {
		if (event.key === 'Enter' || event.key === ' ') {
			if (event.target === event.currentTarget) {
				event.preventDefault();
				handleClose();
			}
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
			// Store the previously focused element
			previousActiveElement = document.activeElement;

			// Focus the close button when modal opens
			setTimeout(() => {
				if (closeButtonElement) {
					closeButtonElement.focus();
				}
			}, 100);

			// Add event listener for escape key
			document.addEventListener('keydown', handleKeydown);

			// Prevent body scroll
			document.body.style.overflow = 'hidden';
		} else {
			// Remove event listener
			document.removeEventListener('keydown', handleKeydown);

			// Restore body scroll
			document.body.style.overflow = '';

			// Restore focus to previously active element
			if (previousActiveElement) {
				previousActiveElement.focus();
			}
		}

		// Cleanup on component unmount
		return () => {
			document.removeEventListener('keydown', handleKeydown);
			document.body.style.overflow = '';
		};
	});
</script>

{#if isOpen && project}
	<div
		class="animate-fade animate-duration-100 animate-ease-linear fixed inset-0 z-50 overflow-y-auto"
		bind:this={modalElement}
		onclick={handleBackdropClick}
		onkeydown={handleBackdropKeydown}
		role="button"
		tabindex="0"
		aria-label="Close modal by clicking backdrop"
	>
		<div
			class="opacity-none flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
		>
			<!-- Backdrop -->
			<div
				class="fixed inset-0 bg-black/80 transition-opacity dark:bg-black/80"
				aria-hidden="true"
			></div>

			<!-- Modal Content -->
			<div
				class="relative mx-4 transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:mx-0 sm:my-8 sm:w-full sm:max-w-3xl sm:p-6 dark:bg-gray-800"
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
				tabindex="-1"
			>
				<!-- Modal Header -->
				<div class="mb-6 flex items-start justify-between">
					<div class="flex-1">
						<h3
							class="text-lg font-semibold leading-6 text-gray-900 dark:text-white"
							id="modal-title"
						>
							Просмотр проекта
						</h3>
						<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
							Детальная информация о проекте "{project.value || project.name || 'Без названия'}"
						</p>
					</div>
					<button
						type="button"
						class="ml-3 rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-500 dark:hover:text-gray-400"
						onclick={handleClose}
						bind:this={closeButtonElement}
						aria-label="Закрыть модальное окно"
					>
						<svg
							class="h-6 w-6"
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

				<!-- Project Information Grid -->
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<!-- Basic Information -->
					<div class="space-y-4">
						<h4
							class="text-md border-b border-gray-200 pb-2 font-medium text-gray-900 dark:border-gray-700 dark:text-white"
						>
							Основная информация
						</h4>

						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Название проекта</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{project.value || project.name || 'Не указано'}
							</dd>
						</div>

						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Город</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{project.city || 'Не указан'}
							</dd>
						</div>

						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Описание</dt>
							<dd class="mt-1 whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
								{project.description || 'Описание не предоставлено'}
							</dd>
						</div>

						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">ID проекта</dt>
							<dd class="mt-1 font-mono text-sm text-gray-900 dark:text-white">
								{project.id}
							</dd>
						</div>

						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Статус</dt>
							<dd class="mt-1">
								<span
									class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
									{project.is_active !== false
										? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
										: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}"
								>
									{project.is_active !== false ? 'Активный' : 'Неактивный'}
								</span>
							</dd>
						</div>
					</div>

					<!-- Contract Information -->
					<div class="space-y-4">
						<h4
							class="text-md border-b border-gray-200 pb-2 font-medium text-gray-900 dark:border-gray-700 dark:text-white"
						>
							Информация о договоре
						</h4>

						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Номер договора</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{project.contract_name || 'Не указан'}
							</dd>
						</div>

						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
								Дата заключения договора
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{formatDate(project.contract_date)}
							</dd>
						</div>

						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Сумма договора</dt>
							<dd class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
								{formatCurrency(project.contract_amount)}
							</dd>
						</div>

						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
								Планируемое завершение
							</dt>
							<dd
								class="mt-1 text-sm
								{isOverdue(project.planned_completion_date)
									? 'font-medium text-red-600 dark:text-red-400'
									: 'text-gray-900 dark:text-white'}"
							>
								{formatDate(project.planned_completion_date)}
								{#if isOverdue(project.planned_completion_date)}
									<span
										class="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/20 dark:text-red-400"
									>
										Просрочено
									</span>
								{/if}
							</dd>
						</div>
					</div>

					<!-- Agent Information -->
					<div class="space-y-4">
						<h4
							class="text-md border-b border-gray-200 pb-2 font-medium text-gray-900 dark:border-gray-700 dark:text-white"
						>
							Информация об агенте
						</h4>

						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
								Назначенный агент
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{getAgentDisplay(project.agent)}
							</dd>
						</div>

						{#if project.agent}
							<div>
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Имя агента</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{project.agent.name || 'Не указано'}
								</dd>
							</div>
						{/if}

						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Ставка агенту</dt>
							<dd class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
								{formatAgentRate(project.agent_percentage)}
							</dd>
						</div>
					</div>

					<!-- Timestamps -->
					<div class="space-y-4">
						<h4
							class="text-md border-b border-gray-200 pb-2 font-medium text-gray-900 dark:border-gray-700 dark:text-white"
						>
							Системная информация
						</h4>

						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Дата создания</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{formatDate(project.created_at)}
							</dd>
						</div>

						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
								Последнее обновление
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{formatDate(project.updated_at)}
							</dd>
						</div>
					</div>
				</div>

				<!-- Modal Footer -->
				<div class="mt-8 flex justify-end">
					<button
						type="button"
						onclick={handleClose}
						class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 active:bg-gray-700"
					>
						Закрыть
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
