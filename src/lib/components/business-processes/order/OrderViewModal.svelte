<script>
	import { formatPhone } from '$lib/utils/formatters.js';
	import { authState } from '$lib/state/auth.svelte.js';

	let { order = null, onClose } = $props();

	const isAdmin = $derived(authState.user?.type === 'Админ');

	let modalElement = $state();
	let previousActiveElement;

	// Format date helper function
	function formatDate(dateString) {
		if (!dateString) return 'Не указана';
		return new Date(dateString).toLocaleDateString('ru-RU', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	// Format datetime helper function
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

	// Format currency
	function formatCurrency(amount) {
		if (amount === null || amount === undefined) return '—';
		return new Intl.NumberFormat('ru-RU', {
			style: 'currency',
			currency: 'RUB',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Format percentage
	function formatPercentage(value) {
		if (value === null || value === undefined) return '—';
		return `${parseFloat(value).toFixed(1)}%`;
	}

	// Handle escape key press
	function handleKeydown(event) {
		if (event.key === 'Escape') {
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
		if (order) {
			previousActiveElement = document.activeElement;
			document.addEventListener('keydown', handleKeydown);
			document.body.style.overflow = 'hidden';
		}

		return () => {
			document.removeEventListener('keydown', handleKeydown);
			document.body.style.overflow = '';
			if (previousActiveElement) {
				previousActiveElement.focus();
			}
		};
	});

	// Trap focus within modal
	function handleTabKey(event) {
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

{#if order}
	<div
		class="fixed inset-0 z-50 overflow-y-auto"
		role="dialog"
		aria-modal="true"
	>
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
				<div class="relative overflow-hidden bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 px-6 py-5">
					<div class="absolute inset-0 bg-grid-white/10"></div>
					<div class="relative flex items-start justify-between">
						<div>
							<div class="flex items-center gap-3">
								<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
									<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
									</svg>
								</div>
								<div>
									<h2 class="text-xl font-bold text-white">
										№ {order.order_number || 'Без номера'}
									</h2>
									<p class="mt-0.5 text-sm text-amber-100">
										{order.project?.value || 'Проект не указан'}
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
						{#if order.is_urgent}
							<span class="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-100">
								<span class="h-1.5 w-1.5 rounded-full bg-red-400"></span>
								Срочный
							</span>
						{/if}
						<span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium {order.is_active ? 'bg-emerald-500/20 text-emerald-100' : 'bg-red-500/20 text-red-100'}">
							<span class="h-1.5 w-1.5 rounded-full {order.is_active ? 'bg-emerald-400' : 'bg-red-400'}"></span>
							{order.is_active ? 'Активен' : 'Неактивен'}
						</span>
					</div>
				</div>

				<!-- Content -->
				<div class="p-6">
					<div class="grid gap-6 lg:grid-cols-2">
						<!-- Left column -->
						<div class="space-y-6">
							<!-- Supplier & Project Card -->
							<div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
								<h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
									<svg class="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
									</svg>
									Поставщик и проект
								</h3>
								<div class="space-y-4">
									<div>
										<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Поставщик</p>
										<p class="mt-1 font-medium text-gray-900 dark:text-white">{order.supplier?.name || '—'}</p>
										{#if order.supplier?.legal_name}
											<p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{order.supplier.legal_name}</p>
										{/if}
									</div>
									<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
										<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Проект</p>
										<p class="mt-1 font-medium text-gray-900 dark:text-white">{order.project?.value || '—'}</p>
										{#if order.project?.region}
											<p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{order.project.region}</p>
										{/if}
									</div>
									{#if order.supplier?.phones && order.supplier.phones.length > 0}
										<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
											<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Телефоны</p>
											<div class="mt-2 space-y-1">
												{#each order.supplier.phones as phone}
													<div>
														<a href="tel:{phone.value}" class="text-sm text-amber-600 hover:text-amber-500 dark:text-amber-400">
															{formatPhone(phone.value)}
														</a>
														{#if phone.contact_person}
															<span class="ml-1 text-xs text-gray-500 dark:text-gray-400">({phone.contact_person})</span>
														{/if}
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							</div>

							<!-- Comment Card -->
							{#if order.value || order.comment}
								<div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
									<h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
										<svg class="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
										</svg>
										Комментарий
									</h3>
									<p class="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">{order.value || order.comment}</p>
								</div>
							{/if}
						</div>

						<!-- Right column -->
						<div class="space-y-6">
							<!-- Dates Card -->
							<div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
								<h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
									<svg class="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
									Сроки поставки
								</h3>
								<div class="grid grid-cols-2 gap-4">
									<div>
										<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Плановая</p>
										<p class="mt-1 font-medium text-gray-900 dark:text-white">{formatDate(order.planned_delivery_date)}</p>
									</div>
									{#if order.actual_delivery_date}
										<div>
											<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Фактическая</p>
											<p class="mt-1 font-medium text-emerald-600 dark:text-emerald-400">{formatDate(order.actual_delivery_date)}</p>
										</div>
									{/if}
								</div>
							</div>

							<!-- Bonuses Card (Admin only) -->
							{#if isAdmin}
								<div class="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:border-amber-800 dark:from-amber-900/30 dark:to-orange-900/30">
									<h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										Бонусы
									</h3>
									<div class="grid grid-cols-2 gap-3">
										<div class="col-span-2 rounded-lg bg-white/60 p-3 dark:bg-gray-800/60">
											<p class="text-xs text-gray-500 dark:text-gray-400">Сумма заказа</p>
											<p class="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(order.order_amount)}</p>
										</div>
										<div class="rounded-lg bg-white/60 p-3 dark:bg-gray-800/60">
											<p class="text-xs text-gray-500 dark:text-gray-400">% агента</p>
											<p class="text-lg font-bold text-gray-900 dark:text-white">{formatPercentage(order.agent_percentage)}</p>
										</div>
										<div class="rounded-lg bg-white/60 p-3 dark:bg-gray-800/60">
											<p class="text-xs text-gray-500 dark:text-gray-400">% куратора</p>
											<p class="text-lg font-bold text-gray-900 dark:text-white">{formatPercentage(order.curator_percentage)}</p>
										</div>
										<div class="rounded-lg bg-emerald-100 p-3 dark:bg-emerald-900/40">
											<p class="text-xs text-emerald-600 dark:text-emerald-400">Бонус агента</p>
											<p class="text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(order.agent_bonus || 0)}</p>
										</div>
										<div class="rounded-lg bg-emerald-100 p-3 dark:bg-emerald-900/40">
											<p class="text-xs text-emerald-600 dark:text-emerald-400">Бонус куратора</p>
											<p class="text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(order.curator_bonus || 0)}</p>
										</div>
									</div>
									{#if !order.is_active}
										<p class="mt-3 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
											<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
											</svg>
											Заказ неактивен — бонусы не начисляются
										</p>
									{/if}
								</div>
							{/if}
						</div>
					</div>

					<!-- Positions Table -->
					{#if order.positions && order.positions.length > 0}
						<div class="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
							<h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
								<svg class="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
								</svg>
								Позиции заказа
							</h3>
							<div class="overflow-x-auto">
								<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
									<thead>
										<tr>
											<th class="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Наименование</th>
											<th class="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Артикул</th>
											<th class="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Цена</th>
											<th class="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Кол-во</th>
											<th class="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Сумма</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
										{#each order.positions as position}
											<tr>
												<td class="px-3 py-3 text-sm text-gray-900 dark:text-white">
													<div class="font-medium">{position.value}</div>
													{#if position.supplier}
														<div class="text-xs text-gray-500 dark:text-gray-400">{position.supplier.name}</div>
													{/if}
													{#if position.is_urgent}
														<span class="mt-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">Срочно</span>
													{/if}
												</td>
												<td class="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">{position.article || '—'}</td>
												<td class="px-3 py-3 text-right text-sm text-gray-900 dark:text-white">{position.price?.toLocaleString('ru-RU') || '—'} ₽</td>
												<td class="px-3 py-3 text-right text-sm text-gray-900 dark:text-white">{position.amount}</td>
												<td class="px-3 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">{position.total_price?.toLocaleString('ru-RU') || '—'} ₽</td>
											</tr>
										{/each}
									</tbody>
									<tfoot>
										<tr class="bg-gray-100 dark:bg-gray-800">
											<td colspan="4" class="px-3 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Итого:</td>
											<td class="px-3 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">
												{order.positions.reduce((sum, p) => sum + (p.total_price || 0), 0).toLocaleString('ru-RU')} ₽
											</td>
										</tr>
									</tfoot>
								</table>
							</div>
						</div>
					{/if}

					<!-- Metadata footer -->
					<div class="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
						<div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
							<span>Создан: {formatDateTime(order.created_at)}</span>
							{#if order.updated_at && order.updated_at !== order.created_at}
								<span>•</span>
								<span>Обновлён: {formatDateTime(order.updated_at)}</span>
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
