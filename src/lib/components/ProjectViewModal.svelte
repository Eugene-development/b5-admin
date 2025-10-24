<script>
	import { onMount } from 'svelte';
	import { formatPhone } from '$lib/utils/formatters.js';

	/**
	 * ProjectViewModal Component
	 *
	 * A modal component for viewing detailed project information.
	 * Provides a read-only view of all project data with proper accessibility.
	 *
	 * @param {boolean} isOpen - Controls modal visibility
	 * @param {Object} project - The project object to display
	 * @param {Object} acceptedByCurrentUser - Local state info about current user accepting the project
	 * @param {Function} onClose - Callback function for closing the modal
	 */
	let { isOpen = false, project = null, acceptedByCurrentUser = null, onClose } = $props();

	let modalElement = $state();
	let closeButtonElement = $state();
	let previousActiveElement;

	// Debug logging
	$effect(() => {
		if (isOpen && project) {
			console.log('Modal opened for project:', project.id);
			console.log('acceptedByCurrentUser:', acceptedByCurrentUser);
			console.log('project.users:', project.users);
		}
	});

	// Clipboard copy state for agent email
	let emailCopied = $state(false);

	async function copyEmailToClipboard(email) {
		if (!email) return;
		try {
			await navigator.clipboard?.writeText?.(email);
			emailCopied = true;
			setTimeout(() => {
				emailCopied = false;
			}, 1500);
		} catch (err) {
			console.error('Failed to copy email:', err);
		}
	}

	// Format date helper function
	function formatDate(dateString) {
		if (!dateString) return 'Не указана';
		return new Date(dateString).toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	// Format date-time helper function
	function formatDateTime(dateString) {
		if (!dateString) return 'Не указано';
		return new Date(dateString).toLocaleString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
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
				class="relative w-full transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:max-w-4xl sm:p-6 dark:bg-gray-800"
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
				tabindex="-1"
			>
				<!-- Modal Header -->
				<div
					class="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-600"
				>
					<h3
						class="text-lg font-semibold leading-6 text-gray-900 dark:text-white"
						id="modal-title"
					>
						Просмотр проекта
					</h3>
					<button
						type="button"
						class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white"
						onclick={handleClose}
						bind:this={closeButtonElement}
						aria-label="Закрыть модальное окно"
					>
						<svg
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<!-- Modal content -->
				<div class="mt-6">
					<!-- Project header -->
					<div class="mb-6 flex items-start justify-between">
						<div class="min-w-0 flex-1"></div>
						<div class="ml-4 flex-shrink-0">
							<span
								class="inline-flex items-center rounded-full {project.is_active !== false
									? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
									: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'} px-2.5 py-0.5 text-xs font-medium"
							>
								{project.is_active !== false ? 'Активен' : 'Неактивен'}
							</span>
						</div>
					</div>

					<!-- Project details grid -->
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<!-- Basic Information -->
						<div class="space-y-4">
							<h5 class="text-base font-semibold text-gray-900 dark:text-white">
								Основная информация:
							</h5>

							<div>
								<dt
									class="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-400"
								>
									Имя клиента:
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{project.value || project.name || 'Не указано'}
								</dd>
							</div>

							<div>
								<dt
									class="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-400"
								>
									Адрес объекта:
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{project.region || 'Не указан'}
								</dd>
							</div>

							{#if (project?.phones && project.phones.length > 0) || project?.phone}
								<div>
									<dt
										class="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-400"
									>
										Телефон клиента:
									</dt>
									<dd class="mt-1 text-sm text-gray-900 dark:text-white">
										{#if project?.phones && project.phones.length > 0}
											<ul class="space-y-1">
												{#each project.phones as phone}
													<li>
														<a
															href="tel:{phone.value}"
															class="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
														>
															{formatPhone(phone.value)}
														</a>
														{#if phone.contact_person}
															<span class="ml-1 text-xs text-gray-500 dark:text-gray-400"
																>({phone.contact_person})</span
															>
														{/if}
													</li>
												{/each}
											</ul>
										{:else}
											<a
												href="tel:{project.phone}"
												class="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
											>
												{formatPhone(project.phone)}
											</a>
										{/if}
									</dd>
								</div>
							{/if}

							<div>
								<dt
									class="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-400"
								>
									Статус:
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{#if project.status}
										<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" 
											style="background-color: {project.status.color}20; color: {project.status.color};">
											{project.status.value}
										</span>
									{:else}
										Не указан
									{/if}
								</dd>
							</div>

							<div>
								<dt
									class="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-400"
								>
									Описание:
								</dt>
								<dd class="mt-1 whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
									{project.description || 'Не указано'}
								</dd>
							</div>
						</div>

						<!-- Contract Information -->
						<div class="space-y-4">
							<h5 class="text-base font-semibold text-gray-900 dark:text-white">
								Информация о проекте:
							</h5>

							<div>
								<dt
									class="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-400"
								>
									Номер:
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{project.contract_name || 'Не указан'}
								</dd>
							</div>

							<div>
								<dt
									class="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-400"
								>
									Дата договора с подрядчиком:
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{formatDate(project.contract_date)}
								</dd>
							</div>

							<div>
								<dt
									class="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-400"
								>
									Сумма договора:
								</dt>
								<dd class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
									{formatCurrency(project.contract_amount)}
								</dd>
							</div>

							<div>
								<dt
									class="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-400"
								>
									Планируемое завершение:
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{formatDate(project.planned_completion_date)}
									{#if isOverdue(project.planned_completion_date)}
										<span
											class="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200"
										>
											Просрочено
										</span>
									{/if}
								</dd>
							</div>
						</div>
					</div>

					<!-- Agent and System Information -->
					<div class="mt-6 border-t border-gray-200 pt-6 dark:border-gray-600">
						<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
							<!-- Agent Information -->
							<div class="space-y-4">
								<h5 class="text-base font-semibold text-gray-900 dark:text-white">
									Информация об агенте:
								</h5>

								<div>
									<dt
										class="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-400"
									>
										Назначенный агент:
									</dt>
									<dd class="mt-1 text-sm text-gray-900 dark:text-white">
										{#if project.agent}
											{#if project.agent.name}
												<div>{project.agent.name}</div>
												{#if project.agent.email}
													<div class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
														<button
															type="button"
															onclick={() => copyEmailToClipboard(project.agent.email)}
															class="text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
															aria-label="Скопировать email агента"
															title={emailCopied ? 'Скопировано' : 'Нажмите, чтобы скопировать'}
														>
															{project.agent.email}
														</button>
														{#if emailCopied}
															<span class="ml-2 text-[11px] text-gray-400">Скопировано</span>
														{/if}
													</div>
												{/if}
											{:else if project.agent.email}
												<div>
													<button
														type="button"
														onclick={() => copyEmailToClipboard(project.agent.email)}
														class="text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
														aria-label="Скопировать email агента"
														title={emailCopied ? 'Скопировано' : 'Нажмите, чтобы скопировать'}
													>
														{project.agent.email}
													</button>
													{#if emailCopied}
														<span class="ml-2 text-[11px] text-gray-400">Скопировано</span>
													{/if}
												</div>
											{:else}
												<div>Не указано</div>
											{/if}
											{#if project.agent.phones && project.agent.phones.length > 0}
												<div class="mt-1">
													{#each project.agent.phones as phone}
														<a
															href="tel:{phone.value}"
															class="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
														>
															{formatPhone(phone.value)}
														</a>
													{/each}
												</div>
											{/if}
										{:else}
											Не назначен
										{/if}
									</dd>
								</div>

								<div>
									<dt
										class="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-400"
									>
										Ставка агенту:
									</dt>
									<dd class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
										{formatAgentRate(project.agent_percentage)}
									</dd>
								</div>
							</div>

							<!-- System Information -->
							<div class="space-y-4">
								<h5 class="text-base font-semibold text-gray-900 dark:text-white">
									Системная информация:
								</h5>

								<div>
									<dt
										class="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-400"
									>
										Дата создания:
									</dt>
									<dd class="mt-1 text-sm text-gray-900 dark:text-white">
										{formatDateTime(project.created_at)}
									</dd>
								</div>

								<div>
									<dt
										class="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-400"
									>
										Дата обновления:
									</dt>
									<dd class="mt-1 text-sm text-gray-900 dark:text-white">
										{formatDateTime(project.updated_at)}
									</dd>
								</div>

								{#if acceptedByCurrentUser || (project.users && project.users.length > 0)}
									<div>
										<dt
											class="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-400"
										>
											Принят куратором:
										</dt>
										<dd class="mt-1 text-sm text-gray-900 dark:text-white">
											{#if acceptedByCurrentUser}
												<!-- Show current user acceptance immediately from local state -->
												<div class="flex items-center space-x-2">
													<span class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
														✓
													</span>
													<span>{acceptedByCurrentUser.user.name || acceptedByCurrentUser.user.email}</span>
													{#if acceptedByCurrentUser.user.email && acceptedByCurrentUser.user.name}
														<span class="text-xs text-gray-500 dark:text-gray-400">({acceptedByCurrentUser.user.email})</span>
													{/if}
													<span class="text-xs italic text-emerald-600 dark:text-emerald-400">(только что)</span>
												</div>
											{:else if project.users && project.users.length > 0}
												<!-- Show users from database -->
												{#each project.users as user, index}
													<div class="flex items-center space-x-2">
														<span class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
															✓
														</span>
														<span>{user.name || user.email}</span>
														{#if user.email && user.name}
															<span class="text-xs text-gray-500 dark:text-gray-400">({user.email})</span>
														{/if}
													</div>
													{#if index < project.users.length - 1}
														<div class="mt-1"></div>
													{/if}
												{/each}
											{/if}
										</dd>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- Modal footer -->
				<div class="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-600">
					<button
						type="button"
						onclick={handleClose}
						class="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
					>
						Закрыть
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
