<script>
	import StatusBadge from '$lib/components/common/StatusBadge.svelte';
	import { formatPhone } from '$lib/utils/formatters.js';

	let { isOpen = false, company = null, onClose } = $props();

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
		return company?.operationalStatus === 'banned' ||
			company?.operationalStatus === 'inactive' ||
			company?.operationalStatus === 'suspended'
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

	$effect(() => {
		if (isOpen) {
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
		class="fixed inset-0 z-50 animate-fade overflow-y-auto animate-duration-100 animate-ease-linear"
		aria-labelledby="modal-title"
		role="dialog"
		aria-modal="true"
	>
		<div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
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
				class="relative w-full transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:max-w-4xl sm:p-6 dark:bg-gray-800"
				onclick={handleModalClick}
				onkeydown={handleKeydown}
				tabindex="0"
				role="dialog"
			>
				<!-- Modal header -->
				<div
					class="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-600"
				>
					<h3
						class="text-lg leading-6 font-semibold text-gray-900 dark:text-white"
						id="modal-title"
					>
						{company.name || 'Компания'}
					</h3>
					<button
						type="button"
						onclick={onClose}
						class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white"
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
					<!-- Company header -->
					<div class="mb-6 flex items-end justify-end">
						<div class="flex-shrink-0">
							<StatusBadge status={getCompanyStatus(company)} />
						</div>
					</div>

					<!-- Company details grid -->
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<!-- Basic Information -->
						<div class="space-y-4">
							{#if company.legal_name}
								<div>
									<dt
										class="text-sm font-semibold tracking-wide text-indigo-500 uppercase dark:text-indigo-300"
									>
										Официальное название:
									</dt>
									<dd class="mt-1 text-sm text-gray-900 dark:text-white">
										{company.legal_name}
									</dd>
								</div>
							{/if}

							<div>
								<dt
									class="text-sm font-semibold tracking-wide text-indigo-500 uppercase dark:text-indigo-300"
								>
									ИНН:
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{company.inn || 'Не указан'}
								</dd>
							</div>

							<div>
								<dt
									class="text-sm font-semibold tracking-wide text-indigo-500 uppercase dark:text-indigo-300"
								>
									Регион:
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{company.region || 'Не указан'}
								</dd>
							</div>
						</div>

						<!-- Contact Information -->
						<div class="space-y-4">
							<div>
								<dt
									class="text-sm font-semibold tracking-wide text-indigo-500 uppercase dark:text-indigo-300"
								>
									Email:
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
								<dt
									class="text-sm font-semibold tracking-wide text-indigo-500 uppercase dark:text-indigo-300"
								>
									Телефон:
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
								<dt
									class="text-sm font-semibold tracking-wide text-indigo-500 uppercase dark:text-indigo-300"
								>
									Контактное лицо:
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{company.contact_person || 'Не указано'}
								</dd>
							</div>

							{#if company.website}
								<div>
									<dt
										class="text-sm font-semibold tracking-wide text-indigo-500 uppercase dark:text-indigo-300"
									>
										Веб-сайт:
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
									<dt
										class="text-sm font-semibold tracking-wide text-indigo-500 uppercase dark:text-indigo-300"
									>
										Адрес:
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
										<dt
											class="text-sm font-semibold tracking-wide text-indigo-500 uppercase dark:text-indigo-300"
										>
											Описание:
										</dt>
										<dd class="mt-1 text-sm whitespace-pre-wrap text-gray-900 dark:text-white">
											{company.description}
										</dd>
									</div>
								{/if}

								<div class="space-y-4">
									{#if company.created_at}
										<div>
											<dt
												class="text-sm font-semibold tracking-wide text-indigo-500 uppercase dark:text-indigo-300"
											>
												Дата создания:
											</dt>
											<dd class="mt-1 text-sm text-gray-900 dark:text-white">
												{formatDate(company.created_at)}
											</dd>
										</div>
									{/if}

									{#if company.updated_at && company.updated_at !== company.created_at}
										<div>
											<dt
												class="text-sm font-semibold tracking-wide text-indigo-500 uppercase dark:text-indigo-300"
											>
												Дата обновления:
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
						class="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
					>
						Закрыть
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
