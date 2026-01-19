<script>
	let { isOpen = false, complaint = null, onClose = () => {} } = $props();

	let modalElement = $state();
	let previousActiveElement;

	// Get priority badge classes
	function getPriorityConfig(priority) {
		switch (priority) {
			case 'low':
				return {
					label: 'Низкий',
					bgClass: 'bg-gray-500/20',
					textClass: 'text-gray-100',
					dotClass: 'bg-gray-400'
				};
			case 'medium':
				return {
					label: 'Средний',
					bgClass: 'bg-blue-500/20',
					textClass: 'text-blue-100',
					dotClass: 'bg-blue-400'
				};
			case 'high':
				return {
					label: 'Высокий',
					bgClass: 'bg-yellow-500/20',
					textClass: 'text-yellow-100',
					dotClass: 'bg-yellow-400'
				};
			case 'critical':
				return {
					label: 'Критический',
					bgClass: 'bg-red-500/20',
					textClass: 'text-red-100',
					dotClass: 'bg-red-400'
				};
			default:
				return {
					label: priority,
					bgClass: 'bg-gray-500/20',
					textClass: 'text-gray-100',
					dotClass: 'bg-gray-400'
				};
		}
	}

	// Get status config
	function getStatusConfig(status) {
		switch (status) {
			case 'open':
				return {
					label: 'Открыта',
					bgClass: 'bg-blue-500/20',
					textClass: 'text-blue-100',
					dotClass: 'bg-blue-400'
				};
			case 'in_progress':
				return {
					label: 'В работе',
					bgClass: 'bg-yellow-500/20',
					textClass: 'text-yellow-100',
					dotClass: 'bg-yellow-400'
				};
			case 'resolved':
				return {
					label: 'Решена',
					bgClass: 'bg-emerald-500/20',
					textClass: 'text-emerald-100',
					dotClass: 'bg-emerald-400'
				};
			case 'closed':
				return {
					label: 'Закрыта',
					bgClass: 'bg-gray-500/20',
					textClass: 'text-gray-100',
					dotClass: 'bg-gray-400'
				};
			default:
				return {
					label: status,
					bgClass: 'bg-gray-500/20',
					textClass: 'text-gray-100',
					dotClass: 'bg-gray-400'
				};
		}
	}

	// Format date
	function formatDate(dateString) {
		if (!dateString) return '—';
		return new Date(dateString).toLocaleDateString('ru-RU', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	// Format datetime
	function formatDateTime(dateString) {
		if (!dateString) return '—';
		return new Date(dateString).toLocaleString('ru-RU', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
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
		onClose();
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

{#if isOpen && complaint}
	<div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
		<!-- Backdrop with blur -->
		<div
			class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
			onclick={handleBackdropClick}
			aria-hidden="true"
		></div>

		<div class="flex min-h-full items-center justify-center p-4">
			<!-- Modal panel -->
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
					class="relative overflow-hidden bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 px-6 py-5"
				>
					<div class="bg-grid-white/10 absolute inset-0"></div>
					<div class="relative flex items-start justify-between">
						<div>
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm"
								>
									<svg
										class="h-5 w-5 text-white"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
										/>
									</svg>
								</div>
								<div>
									<h2 class="text-xl font-bold text-white">
										{complaint.title || 'Рекламация'}
									</h2>
									<p class="mt-0.5 text-sm text-white/70">
										{formatDateTime(complaint.created_at)}
									</p>
									<p class="mt-0.5 text-sm text-pink-100">
										{complaint.contract?.contract_number ||
											complaint.order?.order_number ||
											'Без привязки'}
									</p>
								</div>
							</div>
						</div>
						<button
							type="button"
							onclick={handleClose}
							aria-label="Закрыть"
							class="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
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
					<!-- Status badges -->
					<div class="relative mt-4 flex flex-wrap gap-2">
						<span
							class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium {getPriorityConfig(
								complaint.priority
							).bgClass} {getPriorityConfig(complaint.priority).textClass}"
						>
							<span
								class="h-1.5 w-1.5 rounded-full {getPriorityConfig(complaint.priority).dotClass}"
							></span>
							{getPriorityConfig(complaint.priority).label}
						</span>
						<span
							class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium {getStatusConfig(
								complaint.status
							).bgClass} {getStatusConfig(complaint.status).textClass}"
						>
							<span class="h-1.5 w-1.5 rounded-full {getStatusConfig(complaint.status).dotClass}"
							></span>
							{getStatusConfig(complaint.status).label}
						</span>
						<span
							class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium {complaint.is_active
								? 'bg-emerald-500/20 text-emerald-100'
								: 'bg-gray-500/20 text-gray-100'}"
						>
							<span
								class="h-1.5 w-1.5 rounded-full {complaint.is_active
									? 'bg-emerald-400'
									: 'bg-gray-400'}"
							></span>
							{complaint.is_active ? 'Активна' : 'Неактивна'}
						</span>
					</div>
				</div>

				<!-- Content -->
				<div class="p-6">
					<div class="grid gap-6 lg:grid-cols-2">
						<!-- Left column -->
						<div class="space-y-6">
							<!-- Description Card -->
							{#if complaint.description}
								<div
									class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
								>
									<h3
										class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
									>
										<svg
											class="h-4 w-4 text-rose-500"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M4 6h16M4 12h16M4 18h7"
											/>
										</svg>
										Описание
									</h3>
									<p class="text-sm text-gray-700 dark:text-gray-300">{complaint.description}</p>
								</div>
							{/if}

							<!-- Related Contract/Order Card -->
							{#if complaint.contract || complaint.order}
								<div
									class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
								>
									<h3
										class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
									>
										<svg
											class="h-4 w-4 text-rose-500"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
											/>
										</svg>
										Связанные документы
									</h3>
									<div class="space-y-4">
										{#if complaint.contract}
											<div>
												<p
													class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
												>
													Контракт
												</p>
												<p class="mt-1 font-medium text-gray-900 dark:text-white">
													{complaint.contract.contract_number || '—'}
												</p>
												{#if complaint.contract.project}
													<p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
														Проект: {complaint.contract.project.project_number}
													</p>
												{/if}
												{#if complaint.contract.company}
													<p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
														Компания: {complaint.contract.company.name}
													</p>
												{/if}
											</div>
										{/if}
										{#if complaint.order}
											<div
												class:border-t={complaint.contract}
												class:pt-4={complaint.contract}
												class:border-gray-200={complaint.contract}
												class:dark:border-gray-700={complaint.contract}
											>
												<p
													class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
												>
													Закупка
												</p>
												<p class="mt-1 font-medium text-gray-900 dark:text-white">
													{complaint.order.order_number || '—'}
												</p>
												{#if complaint.order.value}
													<p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
														{complaint.order.value}
													</p>
												{/if}
												{#if complaint.order.company}
													<p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
														Компания: {complaint.order.company.name}
													</p>
												{/if}
											</div>
										{/if}
									</div>
								</div>
							{/if}
						</div>

						<!-- Right column -->
						<div class="space-y-6">
							<!-- Responsible & Guilty Card -->
							<div
								class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
							>
								<h3
									class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
								>
									<svg
										class="h-4 w-4 text-rose-500"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
										/>
									</svg>
									Ответственные
								</h3>
								<div class="grid grid-cols-2 gap-4">
									<div>
										<p
											class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
										>
											Ответственный
										</p>
										<p class="mt-1 font-medium text-gray-900 dark:text-white">
											{complaint.responsible_person || '—'}
										</p>
									</div>
									<div>
										<p
											class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
										>
											Виновная сторона
										</p>
										<p class="mt-1 font-medium text-gray-900 dark:text-white">
											{complaint.guilty_party || '—'}
										</p>
									</div>
								</div>
							</div>

							<!-- Dates Card -->
							<div
								class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
							>
								<h3
									class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
								>
									<svg
										class="h-4 w-4 text-rose-500"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
									Сроки решения
								</h3>
								<div class="grid grid-cols-2 gap-4">
									<div>
										<p
											class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
										>
											Плановая дата
										</p>
										<p class="mt-1 font-medium text-gray-900 dark:text-white">
											{formatDate(complaint.planned_resolution_date)}
										</p>
									</div>
									<div>
										<p
											class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
										>
											Фактическая дата
										</p>
										<p
											class="mt-1 font-medium {complaint.actual_resolution_date
												? 'text-emerald-600 dark:text-emerald-400'
												: 'text-gray-900 dark:text-white'}"
										>
											{formatDate(complaint.actual_resolution_date)}
										</p>
									</div>
								</div>
							</div>

							<!-- Resolution Notes Card -->
							{#if complaint.resolution_notes}
								<div
									class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
								>
									<h3
										class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
									>
										<svg
											class="h-4 w-4 text-rose-500"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										Заметки о решении
									</h3>
									<p class="text-sm text-gray-700 dark:text-gray-300">
										{complaint.resolution_notes}
									</p>
								</div>
							{/if}
						</div>
					</div>

					<!-- Metadata footer -->
					<div
						class="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700"
					>
						<div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
							<span>Создано: {formatDateTime(complaint.created_at)}</span>
							{#if complaint.updated_at && complaint.updated_at !== complaint.created_at}
								<span>•</span>
								<span>Обновлено: {formatDateTime(complaint.updated_at)}</span>
							{/if}
						</div>
					</div>
				</div>

				<!-- Footer -->
				<div
					class="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50"
				>
					<div class="flex justify-end">
						<button
							type="button"
							onclick={handleClose}
							class="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white dark:focus:ring-gray-100"
						>
							Закрыть
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
