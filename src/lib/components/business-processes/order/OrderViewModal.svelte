<script>
	import { formatPhone } from '$lib/utils/formatters.js';
	import { authState } from '$lib/state/auth.svelte.js';
	import { exportOrder } from '$lib/utils/orderExport.js';

	let { order = null, onClose } = $props();

	// Состояние выпадающего меню скачивания
	let showDownloadMenu = $state(false);
	let isDownloading = $state(false);

	// Обработчик скачивания
	async function handleDownload(format) {
		if (!order) return;

		isDownloading = true;
		showDownloadMenu = false;

		try {
			await exportOrder(order, format);
		} catch (error) {
			console.error('Ошибка при экспорте:', error);
			alert('Произошла ошибка при скачивании документа');
		} finally {
			isDownloading = false;
		}
	}

	// Закрытие меню при клике вне его
	function handleClickOutside(event) {
		if (showDownloadMenu && !event.target.closest('.download-menu-container')) {
			showDownloadMenu = false;
		}
	}

	const isAdmin = $derived(authState.user?.type === 'Админ');

	// Debug: log order data
	$effect(() => {
		if (order) {
			console.log('OrderViewModal - order data:', {
				order_amount: order.order_amount,
				agent_percentage: order.agent_percentage,
				curator_percentage: order.curator_percentage,
				agent_bonus: order.agent_bonus,
				curator_bonus: order.curator_bonus
			});
		}
	});

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
			document.addEventListener('click', handleClickOutside);
			document.body.style.overflow = 'hidden';
		}

		return () => {
			document.removeEventListener('keydown', handleKeydown);
			document.removeEventListener('click', handleClickOutside);
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
	<div class="fixed inset-0 z-[60] overflow-y-auto" role="dialog" aria-modal="true">
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
											d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
										/>
									</svg>
								</div>
								<div>
									<h2 class="text-xl font-bold text-white">
										№ {order.order_number || 'Без номера'}
									</h2>
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
						{#if order.is_urgent}
							<span
								class="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-100"
							>
								<span class="h-1.5 w-1.5 rounded-full bg-red-400"></span>
								Срочный
							</span>
						{/if}
						<span
							class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium {order.is_active
								? 'bg-emerald-500/20 text-emerald-100'
								: 'bg-red-500/20 text-red-100'}"
						>
							<span
								class="h-1.5 w-1.5 rounded-full {order.is_active ? 'bg-emerald-400' : 'bg-red-400'}"
							></span>
							{order.is_active ? 'Активен' : 'Неактивен'}
						</span>
					</div>
				</div>

				<!-- Content -->
				<div class="max-h-[calc(100vh-280px)] overflow-y-auto p-6">
					<div class="grid gap-6 lg:grid-cols-2">
						<!-- Left column -->
						<div class="space-y-6">
							<!-- Supplier & Project Card -->
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
											d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
										/>
									</svg>
									Поставщик и проект
								</h3>
								<div class="space-y-4">
									<div>
										<p
											class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
										>
											Поставщик
										</p>
										<p class="mt-1 font-medium text-gray-900 dark:text-white">
											{order.company?.name || '—'}
										</p>
										{#if order.company?.legal_name}
											<p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
												{order.company.legal_name}
											</p>
										{/if}
									</div>
									<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
										<p
											class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
										>
											Проект
										</p>
										<p class="mt-1 font-medium text-gray-900 dark:text-white">
											{order.project?.project_number || '—'}
										</p>
										{#if order.project?.region}
											<p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
												{order.project.region}
											</p>
										{/if}
										{#if order.project?.client?.phones && order.project.client.phones.length > 0}
											<p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
												<a
													href="tel:{order.project.client.phones[0].value}"
													class="hover:text-amber-600"
												>
													{formatPhone(order.project.client.phones[0].value)}
												</a>
											</p>
										{/if}
									</div>
									{#if order.company?.phones && order.company.phones.length > 0}
										<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
											<p
												class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
											>
												Телефоны
											</p>
											<div class="mt-2 space-y-1">
												{#each order.company.phones as phone}
													<div>
														<a
															href="tel:{phone.value}"
															class="text-sm text-amber-600 hover:text-amber-500 dark:text-amber-400"
														>
															{formatPhone(phone.value)}
														</a>
														{#if phone.contact_person}
															<span class="ml-1 text-xs text-gray-500 dark:text-gray-400"
																>({phone.contact_person})</span
															>
														{/if}
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							</div>

							<!-- Comment Card -->
							{#if order.comments && order.comments.length > 0}
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
												d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
											/>
										</svg>
										Комментарий
									</h3>
									<p class="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
										{order.comments[0].value}
									</p>
								</div>
							{/if}
						</div>

						<!-- Right column -->
						<div class="space-y-6">
							<!-- Bonuses Card (Admin only) -->
							{#if isAdmin}
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
										Бонусы
									</h3>
									<div class="grid grid-cols-2 gap-3">
										<div class="col-span-2 rounded-lg bg-white/60 p-3 dark:bg-gray-800/60">
											<p class="text-xs text-gray-500 dark:text-gray-400">Сумма заказа</p>
											<p class="text-lg font-bold text-gray-900 dark:text-white">
												{formatCurrency(order.order_amount)}
											</p>
										</div>
										<div class="rounded-lg bg-white/60 p-3 dark:bg-gray-800/60">
											<p class="text-xs text-gray-500 dark:text-gray-400">% агента</p>
											<p class="text-lg font-bold text-gray-900 dark:text-white">
												{formatPercentage(order.agent_percentage)}
											</p>
										</div>
										<div class="rounded-lg bg-white/60 p-3 dark:bg-gray-800/60">
											<p class="text-xs text-gray-500 dark:text-gray-400">% куратора</p>
											<p class="text-lg font-bold text-gray-900 dark:text-white">
												{formatPercentage(order.curator_percentage)}
											</p>
										</div>
										<div class="rounded-lg bg-emerald-100 p-3 dark:bg-emerald-900/40">
											<p class="text-xs text-emerald-600 dark:text-emerald-400">Бонус агента</p>
											<p class="text-lg font-bold text-emerald-700 dark:text-emerald-300">
												{formatCurrency(order.agent_bonus || 0)}
											</p>
										</div>
										<div class="rounded-lg bg-emerald-100 p-3 dark:bg-emerald-900/40">
											<p class="text-xs text-emerald-600 dark:text-emerald-400">Бонус куратора</p>
											<p class="text-lg font-bold text-emerald-700 dark:text-emerald-300">
												{formatCurrency(order.curator_bonus || 0)}
											</p>
										</div>
									</div>
									{#if !order.is_active}
										<p
											class="mt-3 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400"
										>
											<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
												/>
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
						<div
							class="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
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
										d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
									/>
								</svg>
								Позиции заказа
							</h3>
							<div class="overflow-x-auto">
								<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
									<thead>
										<tr>
											<th
												class="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
												>Наименование</th
											>
											<th
												class="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
												>Артикул</th
											>
											<th
												class="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
												>Цена</th
											>
											<th
												class="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
												>Кол-во</th
											>
											<th
												class="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
												>Сумма</th
											>
										</tr>
									</thead>
									<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
										{#each order.positions as position}
											<tr>
												<td class="px-3 py-3 text-sm text-gray-900 dark:text-white">
													<div class="font-medium">{position.value}</div>
													{#if position.supplier}
														<div class="text-xs text-gray-500 dark:text-gray-400">
															{position.supplier.name}
														</div>
													{/if}
													{#if position.is_urgent}
														<span
															class="mt-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400"
															>Срочно</span
														>
													{/if}
												</td>
												<td class="px-3 py-3 text-sm text-gray-500 dark:text-gray-400"
													>{position.article || '—'}</td
												>
												<td class="px-3 py-3 text-right text-sm text-gray-900 dark:text-white"
													>{position.price?.toLocaleString('ru-RU') || '—'}</td
												>
												<td class="px-3 py-3 text-right text-sm text-gray-900 dark:text-white"
													>{position.count}</td
												>
												<td
													class="px-3 py-3 text-right text-sm font-medium text-gray-900 dark:text-white"
													>{position.total_price?.toLocaleString('ru-RU') || '—'}</td
												>
											</tr>
										{/each}
									</tbody>
									<tfoot>
										<tr class="bg-gray-100 dark:bg-gray-800">
											<td
												colspan="4"
												class="px-3 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white"
												>Итого:</td
											>
											<td
												class="px-3 py-3 text-right text-sm font-bold text-gray-900 dark:text-white"
											>
												{order.positions
													.reduce((sum, p) => sum + (p.total_price || 0), 0)
													.toLocaleString('ru-RU')}
											</td>
										</tr>
									</tfoot>
								</table>
							</div>
						</div>
					{/if}
				</div>

				<!-- Footer -->
				<div
					class="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50"
				>
					<div class="flex items-center justify-between">
						<div class="flex flex-col gap-0.5 text-xs text-gray-400 dark:text-gray-500">
							<span>Создан: {formatDateTime(order.created_at)}</span>
							{#if order.updated_at && order.updated_at !== order.created_at}
								<span>Обновлён: {formatDateTime(order.updated_at)}</span>
							{/if}
						</div>
						<div class="flex items-center gap-3">
							<!-- Кнопка скачивания -->
							<div class="download-menu-container relative">
								<button
									type="button"
									onclick={() => (showDownloadMenu = !showDownloadMenu)}
									disabled={isDownloading}
									class="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-400"
								>
									{#if isDownloading}
										<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
										Скачивание...
									{:else}
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
											/>
										</svg>
										Скачать
										<svg
											class="h-4 w-4 transition-transform {showDownloadMenu ? 'rotate-180' : ''}"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 9l-7 7-7-7"
											/>
										</svg>
									{/if}
								</button>

								<!-- Выпадающее меню -->
								{#if showDownloadMenu}
									<div
										class="absolute bottom-full right-0 mb-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800"
									>
										<button
											type="button"
											onclick={() => handleDownload('pdf')}
											class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
										>
											<svg class="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
												<path
													d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM10.5 11c1.5 0 2.5 1 2.5 2.5S12 16 10.5 16h-1v2H8v-7h2.5zm-1 3.5h1c.5 0 1-.5 1-1s-.5-1-1-1h-1v2zm6.5-3.5h2.5v1.5H16V15h1.5v1.5H16V19h-1.5v-7.5z"
												/>
											</svg>
											<span class="font-medium">PDF</span>
										</button>
										<button
											type="button"
											onclick={() => handleDownload('excel')}
											class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
										>
											<svg class="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
												<path
													d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 11h2l1.5 3 1.5-3h2l-2.5 4 2.5 4h-2l-1.5-3-1.5 3H8l2.5-4L8 11z"
												/>
											</svg>
											<span class="font-medium">Excel</span>
										</button>
										<button
											type="button"
											onclick={() => handleDownload('word')}
											class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
										>
											<svg class="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
												<path
													d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM7 11h1.5l1.5 5 1.5-5h1l1.5 5 1.5-5H17l-2.25 8h-1.5L12 14l-1.25 5h-1.5L7 11z"
												/>
											</svg>
											<span class="font-medium">Word</span>
										</button>
									</div>
								{/if}
							</div>

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
	</div>
{/if}
