<script>
	import { formatPhone } from '$lib/utils/formatters.js';

	let { isOpen = false, tz = null, onClose } = $props();

	// Get curator name from project
	function getCuratorName(tz) {
		return tz?.project?.agent?.name || 'Не указан';
	}

	// Get curator phone from project
	function getCuratorPhone(tz) {
		const phones = tz?.project?.agent?.phones;
		if (!phones || phones.length === 0) return null;

		// Find primary phone or return first phone
		const primaryPhone = phones.find((p) => p.is_primary);
		return primaryPhone?.value || phones[0]?.value || null;
	}

	// Get approval status display
	function getApprovalStatus(tz) {
		if (tz?.is_approved) {
			return { text: 'Согласовано', color: 'green' };
		}
		if (tz?.requires_approval) {
			return { text: 'Требуется', color: 'yellow' };
		}
		return { text: 'Не требуется', color: 'gray' };
	}

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
						{tz.value || `Техзадание #${tz.id}`}
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
					<!-- TZ details grid -->
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<!-- Basic Information -->
						<div class="space-y-4">
							<h5 class="text-sm font-medium text-gray-900 dark:text-white">Основная информация</h5>

							<div>
								<dt
									class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
								>
									Куратор
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{getCuratorName(tz)}
								</dd>
							</div>

							<div>
								<dt
									class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
								>
									Телефон куратора
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{#if getCuratorPhone(tz)}
										<a
											href="tel:{getCuratorPhone(tz)}"
											class="text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
										>
											{formatPhone(getCuratorPhone(tz))}
										</a>
									{:else}
										Не указан
									{/if}
								</dd>
							</div>

							{#if tz.project}
								<div>
									<dt
										class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
									>
										Проект
									</dt>
									<dd class="mt-1 text-sm text-gray-900 dark:text-white">
										{tz.project.value || 'Не указан'}
									</dd>
								</div>

								{#if tz.project.region}
									<div>
										<dt
											class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
										>
											Адрес объекта
										</dt>
										<dd class="mt-1 text-sm text-gray-900 dark:text-white">
											{tz.project.region}
										</dd>
									</div>
								{/if}
							{/if}

							<div>
								<dt
									class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
								>
									Комментарий
								</dt>
								<dd class="mt-1 text-sm whitespace-pre-wrap text-gray-900 dark:text-white">
									{tz.comment || 'Нет комментария'}
								</dd>
							</div>

							<div>
								<dt
									class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
								>
									Согласование
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{#if getApprovalStatus(tz).color === 'green'}
										<span
											class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
										>
											{getApprovalStatus(tz).text}
										</span>
									{:else if getApprovalStatus(tz).color === 'yellow'}
										<span
											class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
										>
											{getApprovalStatus(tz).text}
										</span>
									{:else}
										<span
											class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
										>
											{getApprovalStatus(tz).text}
										</span>
									{/if}
								</dd>
							</div>
						</div>

						<!-- Files and Additional Info -->
						<div class="space-y-4">
							<h5 class="text-sm font-medium text-gray-900 dark:text-white">Файлы и документы</h5>

							<!-- Sketches -->
							<div>
								<dt
									class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
								>
									Эскизы ({tz.project?.sketches?.length || 0})
								</dt>
								<dd class="mt-2 space-y-2">
									{#if tz.project?.sketches && tz.project.sketches.length > 0}
										{#each tz.project.sketches as sketch}
											<div
												class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900"
											>
												<div class="flex items-center space-x-3">
													<svg
														class="h-8 w-8 text-blue-600 dark:text-blue-400"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
														/>
													</svg>
													<div>
														<p class="text-sm font-medium text-gray-900 dark:text-white">
															{sketch.file_name}
														</p>
														{#if sketch.file_size}
															<p class="text-xs text-gray-500 dark:text-gray-400">
																{(sketch.file_size / 1024 / 1024).toFixed(2)} MB
															</p>
														{/if}
													</div>
												</div>
												<button
													type="button"
													onclick={() => handleFileDownload(sketch.file_url, sketch.file_name)}
													class="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500"
												>
													<svg
														class="mr-1 h-3 w-3"
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
													Скачать
												</button>
											</div>
										{/each}
									{:else}
										<p class="text-sm text-gray-500 dark:text-gray-400">Эскизы не прикреплены</p>
									{/if}
								</dd>
							</div>

							<!-- Offers -->
							<div>
								<dt
									class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
								>
									Коммерческие предложения ({tz.project?.offers?.length || 0})
								</dt>
								<dd class="mt-2 space-y-2">
									{#if tz.project?.offers && tz.project.offers.length > 0}
										{#each tz.project.offers as offer}
											<div
												class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900"
											>
												<div class="flex items-center space-x-3">
													<svg
														class="h-8 w-8 text-green-600 dark:text-green-400"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
														/>
													</svg>
													<div>
														<p class="text-sm font-medium text-gray-900 dark:text-white">
															{offer.file_name}
														</p>
														<div
															class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400"
														>
															{#if offer.file_size}
																<span>{(offer.file_size / 1024 / 1024).toFixed(2)} MB</span>
															{/if}
															{#if offer.amount}
																<span>•</span>
																<span>{offer.amount.toLocaleString('ru-RU')} ₽</span>
															{/if}
														</div>
													</div>
												</div>
												<button
													type="button"
													onclick={() => handleFileDownload(offer.file_url, offer.file_name)}
													class="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-green-500"
												>
													<svg
														class="mr-1 h-3 w-3"
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
													Скачать
												</button>
											</div>
										{/each}
									{:else}
										<p class="text-sm text-gray-500 dark:text-gray-400">
											Коммерческие предложения не прикреплены
										</p>
									{/if}
								</dd>
							</div>
						</div>
					</div>

					<!-- Description Section -->
					{#if tz.description}
						<div class="mt-6 border-t border-gray-200 pt-6 dark:border-gray-600">
							<div>
								<dt
									class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
								>
									Техническое задание
								</dt>
								<dd class="mt-1 text-sm whitespace-pre-wrap text-gray-900 dark:text-white">
									{tz.description}
								</dd>
							</div>
						</div>
					{/if}

					<!-- Dates Section -->
					<div class="mt-6 border-t border-gray-200 pt-6 dark:border-gray-600">
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
							{#if tz.created_at}
								<div>
									<dt
										class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
									>
										Дата создания
									</dt>
									<dd class="mt-1 text-sm text-gray-900 dark:text-white">
										{formatDate(tz.created_at)}
									</dd>
								</div>
							{/if}

							{#if tz.updated_at && tz.updated_at !== tz.created_at}
								<div>
									<dt
										class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
									>
										Дата обновления
									</dt>
									<dd class="mt-1 text-sm text-gray-900 dark:text-white">
										{formatDate(tz.updated_at)}
									</dd>
								</div>
							{/if}
						</div>
					</div>
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
