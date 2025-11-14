<script>
	let {
		isOpen = false,
		complaint = null,
		onClose = () => {}
	} = $props();

	// Get priority badge classes
	function getPriorityBadgeClasses(priority) {
		const baseClasses = 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset';
		
		switch (priority) {
			case 'low':
				return `${baseClasses} bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20`;
			case 'medium':
				return `${baseClasses} bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30`;
			case 'high':
				return `${baseClasses} bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-500 dark:ring-yellow-400/20`;
			case 'critical':
				return `${baseClasses} bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/20`;
			default:
				return `${baseClasses} bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20`;
		}
	}

	// Get priority label
	function getPriorityLabel(priority) {
		switch (priority) {
			case 'low':
				return 'Низкий';
			case 'medium':
				return 'Средний';
			case 'high':
				return 'Высокий';
			case 'critical':
				return 'Критический';
			default:
				return priority;
		}
	}

	// Get status badge classes
	function getStatusBadgeClasses(status) {
		const baseClasses = 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset';
		
		switch (status) {
			case 'open':
				return `${baseClasses} bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30`;
			case 'in_progress':
				return `${baseClasses} bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-500 dark:ring-yellow-400/20`;
			case 'resolved':
				return `${baseClasses} bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20`;
			case 'closed':
				return `${baseClasses} bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20`;
			default:
				return `${baseClasses} bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20`;
		}
	}

	// Get status label
	function getStatusLabel(status) {
		switch (status) {
			case 'open':
				return 'Открыта';
			case 'in_progress':
				return 'В работе';
			case 'resolved':
				return 'Решена';
			case 'closed':
				return 'Закрыта';
			default:
				return status;
		}
	}

	// Format date
	function formatDate(dateString) {
		if (!dateString) return '—';
		const date = new Date(dateString);
		return date.toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Format datetime
	function formatDateTime(dateString) {
		if (!dateString) return '—';
		const date = new Date(dateString);
		return date.toLocaleString('ru-RU', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Handle backdrop click
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}
</script>

{#if isOpen && complaint}
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
				class="relative mx-4 transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:mx-0 sm:my-8 sm:w-full sm:max-w-3xl dark:bg-gray-800"
			>
				<!-- Header -->
				<div class="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
					<div class="flex items-center justify-between">
						<h3
							class="text-lg font-semibold leading-6 text-gray-900 dark:text-white"
							id="modal-title"
						>
							Просмотр рекламации
						</h3>
						<button
							type="button"
							onclick={onClose}
							class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:hover:text-gray-300"
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
				<div class="max-h-[calc(100vh-12rem)] overflow-y-auto bg-white px-6 py-6 dark:bg-gray-800">
					<div class="space-y-6">
						<!-- Title and Status -->
						<div>
							<h4 class="text-xl font-semibold text-gray-900 dark:text-white">
								{complaint.title}
							</h4>
							<div class="mt-2 flex items-center gap-2">
								<span class={getPriorityBadgeClasses(complaint.priority)}>
									{getPriorityLabel(complaint.priority)}
								</span>
								<span class={getStatusBadgeClasses(complaint.status)}>
									{getStatusLabel(complaint.status)}
								</span>
								{#if complaint.is_active}
									<span class="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20">
										Активна
									</span>
								{:else}
									<span class="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20">
										Неактивна
									</span>
								{/if}
							</div>
						</div>

						<!-- Description -->
						{#if complaint.description}
							<div>
								<h5 class="text-sm font-medium text-gray-500 dark:text-gray-400">Описание</h5>
								<p class="mt-1 text-sm text-gray-900 dark:text-white">
									{complaint.description}
								</p>
							</div>
						{/if}

						<!-- Related Contract -->
						{#if complaint.contract}
							<div>
								<h5 class="text-sm font-medium text-gray-500 dark:text-gray-400">Контракт</h5>
								<div class="mt-1">
									<p class="text-sm font-medium text-gray-900 dark:text-white">
										{complaint.contract.contract_number || '—'}
									</p>
									{#if complaint.contract.project}
										<p class="text-sm text-gray-500 dark:text-gray-400">
											Проект: {complaint.contract.project.value}
										</p>
									{/if}
									{#if complaint.contract.company}
										<p class="text-sm text-gray-500 dark:text-gray-400">
											Компания: {complaint.contract.company.name}
										</p>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Related Order -->
						{#if complaint.order}
							<div>
								<h5 class="text-sm font-medium text-gray-500 dark:text-gray-400">Заказ</h5>
								<div class="mt-1">
									<p class="text-sm font-medium text-gray-900 dark:text-white">
										{complaint.order.order_number || '—'}
									</p>
									{#if complaint.order.value}
										<p class="text-sm text-gray-500 dark:text-gray-400">
											{complaint.order.value}
										</p>
									{/if}
									{#if complaint.order.company}
										<p class="text-sm text-gray-500 dark:text-gray-400">
											Компания: {complaint.order.company.name}
										</p>
									{/if}
									{#if complaint.order.project}
										<p class="text-sm text-gray-500 dark:text-gray-400">
											Проект: {complaint.order.project.value}
										</p>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Responsible and Guilty Party -->
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<h5 class="text-sm font-medium text-gray-500 dark:text-gray-400">Ответственный</h5>
								<p class="mt-1 text-sm text-gray-900 dark:text-white">
									{complaint.responsible_person || '—'}
								</p>
							</div>
							<div>
								<h5 class="text-sm font-medium text-gray-500 dark:text-gray-400">Виновная сторона</h5>
								<p class="mt-1 text-sm text-gray-900 dark:text-white">
									{complaint.guilty_party || '—'}
								</p>
							</div>
						</div>

						<!-- Dates -->
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<h5 class="text-sm font-medium text-gray-500 dark:text-gray-400">Плановая дата решения</h5>
								<p class="mt-1 text-sm text-gray-900 dark:text-white">
									{formatDate(complaint.planned_resolution_date)}
								</p>
							</div>
							<div>
								<h5 class="text-sm font-medium text-gray-500 dark:text-gray-400">Фактическая дата решения</h5>
								<p class="mt-1 text-sm text-gray-900 dark:text-white">
									{formatDate(complaint.actual_resolution_date)}
								</p>
							</div>
						</div>

						<!-- Resolution Notes -->
						{#if complaint.resolution_notes}
							<div>
								<h5 class="text-sm font-medium text-gray-500 dark:text-gray-400">Заметки о решении</h5>
								<p class="mt-1 text-sm text-gray-900 dark:text-white">
									{complaint.resolution_notes}
								</p>
							</div>
						{/if}

						<!-- Timestamps -->
						<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<h5 class="text-sm font-medium text-gray-500 dark:text-gray-400">Создано</h5>
									<p class="mt-1 text-sm text-gray-900 dark:text-white">
										{formatDateTime(complaint.created_at)}
									</p>
								</div>
								<div>
									<h5 class="text-sm font-medium text-gray-500 dark:text-gray-400">Обновлено</h5>
									<p class="mt-1 text-sm text-gray-900 dark:text-white">
										{formatDateTime(complaint.updated_at)}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Footer -->
				<div class="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
					<div class="flex justify-end">
						<button
							type="button"
							onclick={onClose}
							class="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
						>
							Закрыть
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
