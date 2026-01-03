<script>
	import { formatPhone } from '$lib/utils/formatters.js';

	let { isOpen = false, company = null, onClose } = $props();

	let modalElement = $state();
	let previousActiveElement;

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

	function getCompanyStatus(company) {
		return company?.operationalStatus === 'banned' ||
			company?.operationalStatus === 'inactive' ||
			company?.operationalStatus === 'suspended'
			? 'inactive'
			: 'active';
	}

	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}

	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen) {
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

{#if isOpen && company}
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
				<div class="relative overflow-hidden bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 px-6 py-5">
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
										{company.name || 'Компания'}
									</h2>
									<p class="mt-0.5 text-sm text-blue-100">
										{company.legal_name || company.inn || 'Контрагент'}
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
						<span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium {getCompanyStatus(company) === 'active' ? 'bg-emerald-500/20 text-emerald-100' : 'bg-red-500/20 text-red-100'}">
							<span class="h-1.5 w-1.5 rounded-full {getCompanyStatus(company) === 'active' ? 'bg-emerald-400' : 'bg-red-400'}"></span>
							{getCompanyStatus(company) === 'active' ? 'Активна' : 'Неактивна'}
						</span>
						{#if company.region}
							<span class="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
								<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
								{company.region}
							</span>
						{/if}
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
									<svg class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									Реквизиты
								</h3>
								<div class="space-y-4">
									{#if company.legal_name}
										<div>
											<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Юр. название</p>
											<p class="mt-1 font-medium text-gray-900 dark:text-white">{company.legal_name}</p>
										</div>
									{/if}
									<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
										<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">ИНН</p>
										<p class="mt-1 font-medium text-gray-900 dark:text-white">{company.inn || '—'}</p>
									</div>
									{#if company.address}
										<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
											<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Адрес</p>
											<p class="mt-1 text-sm text-gray-900 dark:text-white">{company.address}</p>
										</div>
									{/if}
								</div>
							</div>

							<!-- Description Card -->
							{#if company.description}
								<div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
									<h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
										<svg class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
										</svg>
										Описание
									</h3>
									<p class="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">{company.description}</p>
								</div>
							{/if}
						</div>

						<!-- Right column -->
						<div class="space-y-6">
							<!-- Contact Info Card -->
							<div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
								<h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
									<svg class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
									</svg>
									Контакты
								</h3>
								<div class="space-y-4">
									<div>
										<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Email</p>
										{#if company.email}
											<a href="mailto:{company.email}" class="mt-1 block text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400">
												{company.email}
											</a>
										{:else}
											<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">—</p>
										{/if}
									</div>
									<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
										<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Телефон</p>
										{#if company.phone}
											<a href="tel:{company.phone}" class="mt-1 block text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400">
												{formatPhone(company.phone)}
											</a>
										{:else}
											<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">—</p>
										{/if}
									</div>
									{#if company.contact_person}
										<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
											<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Контактное лицо</p>
											<p class="mt-1 font-medium text-gray-900 dark:text-white">{company.contact_person}</p>
										</div>
									{/if}
									{#if company.website}
										<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
											<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Веб-сайт</p>
											<a href={company.website} target="_blank" rel="noopener noreferrer" class="mt-1 block text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400">
												{company.website}
											</a>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>

					<!-- Metadata footer -->
					<div class="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
						<div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
							<span>Создана: {formatDateTime(company.created_at)}</span>
							{#if company.updated_at && company.updated_at !== company.created_at}
								<span>•</span>
								<span>Обновлена: {formatDateTime(company.updated_at)}</span>
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
