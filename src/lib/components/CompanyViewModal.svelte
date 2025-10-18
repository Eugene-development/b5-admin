<script>
	import StatusBadge from './StatusBadge.svelte';
	import { formatPhone } from '$lib/utils/formatters.js';
	import { getCompanyStatuses } from '$lib/api/companies.js';

	let {
		isOpen = false,
		company = null,
		onClose
	} = $props();

	let companyStatuses = $state([]);
	let isLoadingStatus = $state(false);

	// Format date helper function
	function formatDate(dateString) {
		if (!dateString) return 'Не указана';
		return new Date(dateString).toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Get company status for StatusBadge
	function getCompanyStatus(company) {
		return company?.operationalStatus === 'banned' || company?.operationalStatus === 'inactive' || company?.operationalStatus === 'suspended'
			? 'banned'
			: 'active';
	}

	// Handle backdrop click to close modal
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	// Handle escape key to close modal
	function handleKeydown(event) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	// Prevent modal content click from closing modal
	function handleModalClick(event) {
		event.stopPropagation();
	}

	// Load company statuses when modal is opened
	async function loadCompanyStatuses() {
		if (companyStatuses.length === 0) {
			isLoadingStatus = true;
			try {
				companyStatuses = await getCompanyStatuses();
			} catch (error) {
				console.error('Failed to load company statuses:', error);
			} finally {
				isLoadingStatus = false;
			}
		}
	}

	// Get company status by status_id
	function getCompanyStatusById(statusId) {
		if (!statusId || companyStatuses.length === 0) return null;
		return companyStatuses.find(status => status.id === statusId);
	}

	$effect(() => {
		if (isOpen) {
			loadCompanyStatuses();
			// Prevent body scroll when modal is open
			document.body.style.overflow = 'hidden';
		} else {
			// Restore body scroll when modal is closed
			document.body.style.overflow = '';
		}

		// Cleanup on component unmount
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

{#if isOpen && company}
	<!-- Modal backdrop -->
	<div
		class="animate-fade animate-duration-100 animate-ease-linear fixed inset-0 z-50 overflow-y-auto"
		aria-labelledby="modal-title"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
		>
			<!-- Background overlay -->
			<div
				class="fixed inset-0 bg-black/80 transition-opacity dark:bg-black/80"
				onclick={handleBackdropClick}
				onkeydown={handleKeydown}
				tabindex="0"
				role="button"
				aria-label="Close modal"
				aria-hidden="true"
			></div>

			<!-- Modal panel -->
			<div
				class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 dark:bg-gray-800"
				onclick={handleModalClick}
				onkeydown={handleKeydown}
				tabindex="0"
				role="dialog"
			>
				<!-- Modal header -->
				<div class="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-600">
					<h3 class="text-lg font-semibold leading-6 text-gray-900 dark:text-white" id="modal-title">
						Информация о компании
					</h3>
					<button
						type="button"
						onclick={onClose}
						class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white"
						aria-label="Закрыть модальное окно"
					>
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<!-- Modal content -->
				<div class="mt-6">
					<!-- Company header -->
					<div class="mb-6 flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<h4 class="text-xl font-bold text-gray-900 dark:text-white">
								{company.name || 'Название не указано'}
							</h4>
							{#if company.legal_name}
								<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
									{company.legal_name}
								</p>
							{/if}
						</div>
						<div class="ml-4 flex-shrink-0">
							<StatusBadge status={getCompanyStatus(company)} />
						</div>
					</div>

					<!-- Company details grid -->
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<!-- Basic Information -->
						<div class="space-y-4">
							<h5 class="text-base font-semibold text-gray-900 dark:text-white">
								Основная информация:
							</h5>
							
							

							<div>
								<dt class="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
									ИНН
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{company.inn || 'Не указан'}
								</dd>
							</div>

							<div>
								<dt class="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
									Регион
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{company.region || 'Не указан'}
								</dd>
							</div>

							<div>
								<dt class="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
									Статус компании
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{#if isLoadingStatus}
										Загрузка...
									{:else}
										{@const companyStatus = getCompanyStatusById(company.status_id)}
										{#if companyStatus}
											<span 
												class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800"
											>
												{companyStatus.value}
											</span>
										{:else}
											Не указан
										{/if}
									{/if}
								</dd>
							</div>
						</div>

						<!-- Contact Information -->
						<div class="space-y-4">
							<h5 class="text-base font-semibold text-gray-900 dark:text-white">
								Контактная информация:
							</h5>
							
							<div>
								<dt class="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
									Email
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{#if company.email}
										<a 
											href="mailto:{company.email}" 
											class="text-gray-900 hover:text-gray-700 dark:text-white dark:hover:text-gray-300"
										>
											{company.email}
										</a>
									{:else}
										Не указан
									{/if}
								</dd>
							</div>

							<div>
								<dt class="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
									Телефон
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{#if company.phone}
										<a 
											href="tel:{company.phone}" 
											class="text-gray-900 hover:text-gray-700 dark:text-white dark:hover:text-gray-300"
										>
											{formatPhone(company.phone)}
										</a>
									{:else}
										Не указан
									{/if}
								</dd>
							</div>

							<div>
								<dt class="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
									Контактное лицо
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{company.contact_person || 'Не указано'}
								</dd>
							</div>

							{#if company.website}
								<div>
									<dt class="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
										Веб-сайт
									</dt>
									<dd class="mt-1 text-sm text-gray-900 dark:text-white">
										<a 
											href={company.website} 
											target="_blank" 
											rel="noopener noreferrer"
											class="text-gray-900 hover:text-gray-700 dark:text-white dark:hover:text-gray-300"
										>
											{company.website}
										</a>
									</dd>
								</div>
							{/if}

							{#if company.address}
								<div>
									<dt class="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
										Адрес
									</dt>
									<dd class="mt-1 text-sm text-gray-900 dark:text-white">
										{company.address}
									</dd>
								</div>
							{/if}
						</div>
					</div>

					<!-- Additional Information -->
					{#if company.description || company.created_at || company.updated_at}
						<div class="mt-6 border-t border-gray-200 pt-6 dark:border-gray-600">
							<h5 class="text-base font-semibold text-gray-900 dark:text-white">
								Дополнительная информация:
							</h5>
							
							<div class="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
								{#if company.description}
									<div>
										<dt class="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
											Описание
										</dt>
										<dd class="mt-1 whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
											{company.description}
										</dd>
									</div>
								{/if}

								<div class="space-y-4">
									{#if company.created_at}
										<div>
											<dt class="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
												Дата создания
											</dt>
											<dd class="mt-1 text-sm text-gray-900 dark:text-white">
												{formatDate(company.created_at)}
											</dd>
										</div>
									{/if}

									{#if company.updated_at}
										<div>
											<dt class="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
												Дата обновления
											</dt>
											<dd class="mt-1 text-sm text-gray-900 dark:text-white">
												{formatDate(company.updated_at)}
											</dd>
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Modal footer -->
				<div class="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-600">
					<button
						type="button"
						onclick={onClose}
						class="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
					>
						Закрыть
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}