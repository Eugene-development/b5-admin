<script>
	import { formatPhone } from '$lib/utils/formatters.js';
	import { authState } from '$lib/state/auth.svelte.js';

	let { isOpen = false, project = null, acceptedByCurrentUser = null, onClose } = $props();

	const isAdmin = $derived(authState.user?.type === 'Админ');

	let modalElement = $state();
	let previousActiveElement;
	let emailCopied = $state(false);

	async function copyEmailToClipboard(email) {
		if (!email) return;
		try {
			await navigator.clipboard?.writeText?.(email);
			emailCopied = true;
			setTimeout(() => { emailCopied = false; }, 1500);
		} catch (err) {
			console.error('Failed to copy email:', err);
		}
	}

	function formatDate(dateString) {
		if (!dateString) return 'Не указана';
		return new Date(dateString).toLocaleDateString('ru-RU', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function formatDateTime(dateString) {
		if (!dateString) return 'Не указана';
		return new Date(dateString).toLocaleString('ru-RU', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatCurrency(amount) {
		if (amount === null || amount === undefined) return '—';
		return new Intl.NumberFormat('ru-RU', {
			style: 'currency',
			currency: 'RUB',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function formatPercentage(value) {
		if (value === null || value === undefined) return '—';
		return `${parseFloat(value).toFixed(1)}%`;
	}

	function isOverdue(dateString) {
		if (!dateString) return false;
		return new Date(dateString) < new Date();
	}

	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen) {
			handleClose();
		}
	}

	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}

	function handleClose() {
		if (onClose) {
			onClose();
		}
	}

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

{#if isOpen && project}
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
				<div class="relative overflow-hidden bg-gradient-to-r from-teal-600 via-cyan-500 to-emerald-500 px-6 py-5">
					<div class="absolute inset-0 bg-grid-white/10"></div>
					<div class="relative flex items-start justify-between">
						<div>
							<div class="flex items-center gap-3">
								<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
									<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
									</svg>
								</div>
								<div>
									<h2 class="text-xl font-bold text-white">
										{project.value || 'Проект'}
									</h2>
									<p class="mt-0.5 text-sm text-teal-100">
										{project.region || 'Адрес не указан'}
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
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
					<!-- Status badges -->
					<div class="relative mt-4 flex flex-wrap gap-2">
						{#if project.status}
							<span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium" style="background-color: {project.status.color}30; color: white;">
								<span class="h-1.5 w-1.5 rounded-full" style="background-color: {project.status.color};"></span>
								{project.status.value}
							</span>
						{/if}
						<span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium {project.is_active !== false ? 'bg-emerald-500/20 text-emerald-100' : 'bg-red-500/20 text-red-100'}">
							<span class="h-1.5 w-1.5 rounded-full {project.is_active !== false ? 'bg-emerald-400' : 'bg-red-400'}"></span>
							{project.is_active !== false ? 'Активен' : 'Неактивен'}
						</span>
					</div>
				</div>

				<!-- Content -->
				<div class="max-h-[calc(100vh-280px)] overflow-y-auto p-6">
					<div class="grid gap-6 lg:grid-cols-2">
						<!-- Left column -->
						<div class="space-y-6">
							<!-- Basic Info Card -->
							<div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
								<h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
									<svg class="h-4 w-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									Основная информация
								</h3>
								<div class="space-y-4">
									{#if project.description}
										<div>
											<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Описание</p>
											<p class="mt-1 text-sm whitespace-pre-wrap text-gray-900 dark:text-white">{project.description}</p>
										</div>
									{/if}
									{#if (project?.phones && project.phones.length > 0) || project?.phone}
										<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
											<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Телефон клиента</p>
											<div class="mt-2 space-y-1">
												{#if project?.phones && project.phones.length > 0}
													{#each project.phones as phone}
														<div>
															<a href="tel:{phone.value}" class="text-sm text-teal-600 hover:text-teal-500 dark:text-teal-400">
																{formatPhone(phone.value)}
															</a>
															{#if phone.contact_person}
																<span class="ml-1 text-xs text-gray-500 dark:text-gray-400">({phone.contact_person})</span>
															{/if}
														</div>
													{/each}
												{:else}
													<a href="tel:{project.phone}" class="text-sm text-teal-600 hover:text-teal-500 dark:text-teal-400">
														{formatPhone(project.phone)}
													</a>
												{/if}
											</div>
										</div>
									{/if}
								</div>
							</div>

							<!-- Contract Info Card -->
							<div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
								<h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
									<svg class="h-4 w-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
									Договор с подрядчиком
								</h3>
								<div class="grid grid-cols-2 gap-4">
									<div>
										<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Номер</p>
										<p class="mt-1 font-medium text-gray-900 dark:text-white">{project.contract_name || project.contract_number || '—'}</p>
									</div>
									<div>
										<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Дата</p>
										<p class="mt-1 font-medium text-gray-900 dark:text-white">{formatDate(project.contract_date)}</p>
									</div>
									<div class="col-span-2">
										<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">План. завершение</p>
										<p class="mt-1 font-medium text-gray-900 dark:text-white">
											{formatDate(project.planned_completion_date)}
											{#if isOverdue(project.planned_completion_date)}
												<span class="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">Просрочено</span>
											{/if}
										</p>
									</div>
								</div>
							</div>
						</div>

						<!-- Right column -->
						<div class="space-y-6">
							<!-- Agent Info Card -->
							<div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
								<h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
									<svg class="h-4 w-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
									Агент
								</h3>
								<div class="space-y-3">
									{#if project.agent}
										<div>
											<p class="font-medium text-gray-900 dark:text-white">{project.agent.name || project.agent.email}</p>
											{#if project.agent.email && project.agent.name}
												<button
													type="button"
													onclick={() => copyEmailToClipboard(project.agent.email)}
													class="mt-0.5 text-sm text-teal-600 hover:text-teal-500 dark:text-teal-400"
												>
													{project.agent.email}
													{#if emailCopied}
														<span class="ml-1 text-xs text-gray-400">✓</span>
													{/if}
												</button>
											{/if}
											{#if project.agent.phones && project.agent.phones.length > 0}
												<div class="mt-1">
													{#each project.agent.phones as phone}
														<a href="tel:{phone.value}" class="text-sm text-teal-600 hover:text-teal-500 dark:text-teal-400">
															{formatPhone(phone.value)}
														</a>
													{/each}
												</div>
											{/if}
										</div>
									{:else}
										<p class="text-sm text-gray-500 dark:text-gray-400">Не назначен</p>
									{/if}
									<div class="border-t border-gray-200 pt-3 dark:border-gray-700">
										<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Ставка агенту</p>
										<p class="mt-1 text-lg font-bold text-teal-600 dark:text-teal-400">{formatPercentage(project.agent_percentage)}</p>
									</div>
								</div>
							</div>

							<!-- Participants Card -->
							{#if (acceptedByCurrentUser || (project.users && project.users.length > 0)) || (project.curator && project.curator.length > 0) || (project.projectUsers && project.projectUsers.length > 0)}
								<div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
									<h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
										<svg class="h-4 w-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
										</svg>
										Участники
									</h3>
									<div class="space-y-3">
										{#if acceptedByCurrentUser}
											<div class="flex items-center gap-2">
												<span class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">✓ Принял</span>
												<span class="text-sm text-gray-900 dark:text-white">{acceptedByCurrentUser.user.name || acceptedByCurrentUser.user.email}</span>
												<span class="text-xs text-emerald-600 italic dark:text-emerald-400">(только что)</span>
											</div>
										{:else if project.users && project.users.length > 0}
											{#each project.users as user}
												<div class="flex items-center gap-2">
													<span class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">✓</span>
													<span class="text-sm text-gray-900 dark:text-white">{user.name || user.email}</span>
												</div>
											{/each}
										{/if}
										{#if project.curator && project.curator.length > 0}
											{#each project.curator as curator}
												<div class="flex items-center gap-2">
													<span class="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">Куратор</span>
													<span class="text-sm text-gray-900 dark:text-white">{curator.name || curator.email}</span>
												</div>
											{/each}
										{/if}
										{#if project.projectUsers && project.projectUsers.length > 0}
											{#each project.projectUsers as projectUser}
												<div class="flex items-center gap-2">
													<span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
														{projectUser.role === 'curator' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : ''}
														{projectUser.role === 'agent' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
														{projectUser.role === 'designer' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400' : ''}
														{projectUser.role === 'manager' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : ''}">
														{projectUser.role === 'curator' ? 'Куратор' : projectUser.role === 'agent' ? 'Агент' : projectUser.role === 'designer' ? 'Дизайнер' : projectUser.role === 'manager' ? 'Менеджер' : projectUser.role}
													</span>
													<span class="text-sm text-gray-900 dark:text-white">{projectUser.user?.name || projectUser.user?.email || '—'}</span>
												</div>
											{/each}
										{/if}
									</div>
								</div>
							{/if}
						</div>
					</div>

					<!-- Contracts Section -->
					{#if project.contracts && project.contracts.length > 0}
						<div class="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
							<h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
								<svg class="h-4 w-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
								Договора ({project.contracts.length})
							</h3>
							<div class="space-y-3">
								{#each project.contracts as contract}
									<div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
										<div class="flex items-start justify-between">
											<div>
												<p class="font-medium text-gray-900 dark:text-white">{contract.company?.name || contract.company?.legal_name || '—'}</p>
												<p class="text-sm text-gray-500 dark:text-gray-400">№ {contract.contract_number || '—'} от {formatDate(contract.contract_date)}</p>
											</div>
											<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {contract.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'}">
												{contract.is_active ? 'Активен' : 'Неактивен'}
											</span>
										</div>
										<div class="mt-2 grid grid-cols-2 gap-2 text-xs">
											<div>
												<span class="text-gray-500 dark:text-gray-400">План:</span>
												<span class="ml-1 text-gray-900 dark:text-white">{formatDate(contract.planned_completion_date)}</span>
											</div>
											<div>
												<span class="text-gray-500 dark:text-gray-400">Агент/Куратор:</span>
												<span class="ml-1 font-medium text-gray-900 dark:text-white">{formatPercentage(contract.agent_percentage)} / {formatPercentage(contract.curator_percentage)}</span>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Purchases Section -->
					{#if project.purchases && project.purchases.length > 0}
						<div class="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
							<h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
								<svg class="h-4 w-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
								</svg>
								Закупки ({project.purchases.length})
							</h3>
							<div class="space-y-2">
								{#each project.purchases as purchase}
									<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
										<span class="text-sm text-gray-900 dark:text-white">{purchase.name || '—'}</span>
										<span class="font-semibold text-gray-900 dark:text-white">{formatCurrency(purchase.amount)}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Agent Bonuses Section (Admin only) -->
					{#if isAdmin && (project.contracts?.some(c => c.agent_bonus > 0) || project.orders?.some(o => o.agent_bonus > 0))}
						<div class="mt-6 rounded-xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 p-4 dark:border-teal-800 dark:from-teal-900/30 dark:to-emerald-900/30">
							<h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-teal-700 dark:text-teal-300">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								Бонусы агента
							</h3>
							<div class="space-y-2">
								{#each project.contracts || [] as contract}
									{#if contract.agent_bonus > 0}
										<div class="flex items-center justify-between rounded-lg bg-white/60 p-3 dark:bg-gray-800/60">
											<div>
												<p class="text-sm font-medium text-gray-900 dark:text-white">Договор: {contract.contract_number || '—'}</p>
												<p class="text-xs text-gray-500 dark:text-gray-400">Сумма: {formatCurrency(contract.contract_amount)}</p>
											</div>
											<div class="text-right">
												<p class="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(contract.agent_bonus)}</p>
												<span class="text-xs text-amber-600 dark:text-amber-400">Начислено</span>
											</div>
										</div>
									{/if}
								{/each}
								{#each project.orders || [] as order}
									{#if order.agent_bonus > 0}
										<div class="flex items-center justify-between rounded-lg bg-white/60 p-3 dark:bg-gray-800/60">
											<div>
												<p class="text-sm font-medium text-gray-900 dark:text-white">Закупка: {order.order_number || '—'}</p>
												<p class="text-xs text-gray-500 dark:text-gray-400">Сумма: {formatCurrency(order.order_amount)}</p>
											</div>
											<div class="text-right">
												<p class="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(order.agent_bonus)}</p>
												<span class="text-xs text-amber-600 dark:text-amber-400">Начислено</span>
											</div>
										</div>
									{/if}
								{/each}
							</div>
						</div>
					{/if}

					<!-- Metadata footer -->
					<div class="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
						<div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
							<span>Создан: {formatDateTime(project.created_at)}</span>
							{#if project.updated_at && project.updated_at !== project.created_at}
								<span>•</span>
								<span>Обновлён: {formatDateTime(project.updated_at)}</span>
							{/if}
						</div>
					</div>
				</div>

				<!-- Footer -->
				<div class="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
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
