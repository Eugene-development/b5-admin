<script>
	import { formatPhone } from '$lib/utils/formatters.js';
	
	let { isOpen = false, tz = null, onClose } = $props();

	// Handle file download
	function handleFileDownload(fileUrl, fileName) {
		if (!fileUrl) return;

		const link = document.createElement('a');
		link.href = fileUrl;
		link.download = fileName || 'file';
		link.target = '_blank';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

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

	// Handle body scroll when modal is open/closed
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

{#if isOpen && tz}
	<!-- Modal backdrop -->
	<div
		class="animate-fade animate-duration-100 animate-ease-linear fixed inset-0 z-50 overflow-y-auto"
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
				class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6 dark:bg-gray-800"
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
						class="text-lg font-semibold leading-6 text-gray-900 dark:text-white"
						id="modal-title"
					>
						Техническое задание
					</h3>
					<button
						type="button"
						onclick={onClose}
						class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white"
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
					<!-- TZ header -->
					<div class="mb-6 flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<h4 class="text-xl font-bold text-gray-900 dark:text-white">
								{tz.curator || 'Куратор не указан'}
							</h4>
							<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
								ID: {tz.id}
							</p>
						</div>
						{#if tz.status}
							<div class="ml-4 flex-shrink-0">
								<span
									class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
								>
									{tz.status}
								</span>
							</div>
						{/if}
					</div>

					<!-- TZ details grid -->
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<!-- Basic Information -->
						<div class="space-y-4">
							<h5 class="text-sm font-medium text-gray-900 dark:text-white">Основная информация</h5>

							<div>
								<dt
									class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
								>
									Куратор
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{tz.curator || 'Не указан'}
								</dd>
							</div>

							<div>
								<dt
									class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
								>
									Телефон куратора
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{#if tz.curator_phone}
										<a
											href="tel:{tz.curator_phone}"
											class="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
										>
											{formatPhone(tz.curator_phone)}
										</a>
									{:else}
										Не указан
									{/if}
								</dd>
							</div>

							<div>
								<dt
									class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
								>
									Комментарий
								</dt>
								<dd class="mt-1 whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
									{tz.comment || 'Нет комментария'}
								</dd>
							</div>

							{#if tz.created_at}
								<div>
									<dt
										class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
									>
										Дата создания
									</dt>
									<dd class="mt-1 text-sm text-gray-900 dark:text-white">
										{formatDate(tz.created_at)}
									</dd>
								</div>
							{/if}

							{#if tz.updated_at}
								<div>
									<dt
										class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
									>
										Дата обновления
									</dt>
									<dd class="mt-1 text-sm text-gray-900 dark:text-white">
										{formatDate(tz.updated_at)}
									</dd>
								</div>
							{/if}
						</div>

						<!-- Files and Additional Info -->
						<div class="space-y-4">
							<h5 class="text-sm font-medium text-gray-900 dark:text-white">Файлы и документы</h5>

							<div>
								<dt
									class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
								>
									Эскиз
								</dt>
								<dd class="mt-1">
									{#if tz.sketch_file}
										<div class="flex items-center space-x-2">
											<button
												type="button"
												onclick={() =>
													handleFileDownload(tz.sketch_file, tz.sketch_filename || 'sketch')}
												class="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
											>
												<svg
													class="mr-2 h-4 w-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
													/>
												</svg>
												Скачать эскиз
											</button>
											{#if tz.sketch_filename}
												<span class="text-sm text-gray-500 dark:text-gray-400"
													>{tz.sketch_filename}</span
												>
											{/if}
										</div>
									{:else}
										<p class="text-sm text-gray-500 dark:text-gray-400">
											Файл эскиза не прикреплен
										</p>
									{/if}
								</dd>
							</div>

							<div>
								<dt
									class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
								>
									Коммерческое предложение
								</dt>
								<dd class="mt-1">
									{#if tz.commercial_proposal}
										<div class="flex items-center space-x-2">
											<button
												type="button"
												onclick={() =>
													handleFileDownload(
														tz.commercial_proposal,
														tz.cp_filename || 'commercial_proposal'
													)}
												class="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
											>
												<svg
													class="mr-2 h-4 w-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
													/>
												</svg>
												Скачать КП
											</button>
											{#if tz.cp_filename}
												<span class="text-sm text-gray-500 dark:text-gray-400"
													>{tz.cp_filename}</span
												>
											{/if}
										</div>
									{:else}
										<p class="text-sm text-gray-500 dark:text-gray-400">
											Коммерческое предложение не прикреплено
										</p>
									{/if}
								</dd>
							</div>
						</div>
					</div>

					<!-- Description Section -->
					{#if tz.description}
						<div class="mt-6 border-t border-gray-200 pt-6 dark:border-gray-600">
							<h5 class="text-sm font-medium text-gray-900 dark:text-white">Описание проекта</h5>

							<div class="mt-4">
								<dt
									class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
								>
									Техническое задание
								</dt>
								<dd class="mt-1 whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
									{tz.description}
								</dd>
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
