<script>
	let {
		isOpen = false,
		tz = null,
		projects = [],
		onSave,
		onCancel,
		onDeleteFile,
		isLoading = false
	} = $props();

	let modalElement = $state();
	let previousActiveElement;

	let formData = $state({
		id: '',
		project_id: '',
		description: '',
		comment: '',
		is_active: true,
		approval_status: 'none'
	});

	function getApprovalStatus(tz) {
		if (tz.is_approved) return 'approved';
		if (tz.requires_approval) return 'requires_approval';
		return 'none';
	}

	let errors = $state({});
	let wasOpen = $state(false);

	// File deletion confirmation state
	let confirmDeleteFileId = $state(null);
	let isDeletingFile = $state(false);

	$effect(() => {
		if (isOpen && !wasOpen && tz) {
			formData = {
				id: tz.id,
				project_id: tz.project_id || '',
				description: tz.description || '',
				comment: tz.comment || '',
				is_active: tz.is_active ?? true,
				approval_status: getApprovalStatus(tz)
			};
			errors = {};
			confirmDeleteFileId = null;
			isDeletingFile = false;
		}
		wasOpen = isOpen;
	});

	function validateForm() {
		const newErrors = {};
		if (!formData.project_id) newErrors.project_id = 'Выберите проект';
		if (!formData.description || formData.description.trim().length === 0)
			newErrors.description = 'Введите описание техзадания';
		else if (formData.description.trim().length < 10)
			newErrors.description = 'Описание должно содержать минимум 10 символов';
		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	function handleSubmit(event) {
		event.preventDefault();
		if (!validateForm()) return;
		const cleanedData = {
			id: formData.id,
			project_id: formData.project_id,
			description: formData.description.trim(),
			comment: formData.comment.trim() || null,
			is_active: formData.is_active,
			requires_approval: formData.approval_status === 'requires_approval',
			is_approved: formData.approval_status === 'approved'
		};
		onSave(cleanedData);
	}

	function handleBackdropClick(event) {
		if (event.target === event.currentTarget && !isLoading) onCancel();
	}
	function handleKeydown(event) {
		if (event.key === 'Escape' && !isLoading) onCancel();
	}

	$effect(() => {
		if (isOpen) {
			previousActiveElement = document.activeElement;
			document.addEventListener('keydown', handleKeydown);
			document.body.style.overflow = 'hidden';
		} else {
			document.removeEventListener('keydown', handleKeydown);
			document.body.style.overflow = '';
			if (previousActiveElement) previousActiveElement.focus();
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

	function getProjectDisplayName(project) {
		const parts = [];
		if (project.project_number) parts.push(project.project_number);
		if (project.region) parts.push(`(${project.region})`);
		return parts.join(' ') || 'Без номера';
	}

	function formatFileSize(bytes) {
		if (!bytes) return '';
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	}

	// Handle file delete with confirmation
	function handleDeleteFileClick(fileId) {
		if (confirmDeleteFileId === fileId) {
			// Second click - confirmed, proceed with deletion
			performDeleteFile(fileId);
		} else {
			// First click - ask for confirmation
			confirmDeleteFileId = fileId;
		}
	}

	function cancelDeleteConfirmation() {
		confirmDeleteFileId = null;
	}

	async function performDeleteFile(fileId) {
		if (!onDeleteFile) return;
		isDeletingFile = true;
		try {
			await onDeleteFile(fileId);
			confirmDeleteFileId = null;
		} catch (error) {
			console.error('Failed to delete file:', error);
		} finally {
			isDeletingFile = false;
		}
	}
</script>

{#if isOpen && tz}
	<div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
		<div
			class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
			onclick={handleBackdropClick}
			aria-hidden="true"
		></div>

		<div class="flex min-h-full items-center justify-center p-4">
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				bind:this={modalElement}
				class="relative w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-gray-900"
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
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm"
							>
								<svg
									class="h-5 w-5 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/>
								</svg>
							</div>
							<div>
								<h2 class="text-xl font-bold text-white">Редактировать техзадание</h2>
								<p class="mt-0.5 text-sm text-violet-100">
									{tz?.project?.project_number || `Проект #${tz?.project_id}`}
								</p>
							</div>
						</div>
						<button
							type="button"
							onclick={onCancel}
							disabled={isLoading}
							aria-label="Закрыть"
							class="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white disabled:opacity-50"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/></svg
							>
						</button>
					</div>
				</div>

				<!-- Form Content -->
				<form onsubmit={handleSubmit} class="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
					<div class="space-y-5">
						<!-- Project Selection -->
						<div>
							<label
								for="project_id"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>Проект <span class="text-red-500">*</span></label
							>
							<select
								id="project_id"
								bind:value={formData.project_id}
								disabled={isLoading}
								class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
								class:ring-red-500={errors.project_id}
							>
								<option value="">Выберите проект</option>
								{#each projects as project (project.id)}<option value={project.id}
										>{getProjectDisplayName(project)}</option
									>{/each}
							</select>
							{#if errors.project_id}<p class="mt-1 text-sm text-red-600 dark:text-red-400">
									{errors.project_id}
								</p>{/if}
						</div>

						<!-- Description -->
						<div>
							<label
								for="description"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>Описание техзадания <span class="text-red-500">*</span></label
							>
							<textarea
								id="description"
								bind:value={formData.description}
								disabled={isLoading}
								rows="4"
								placeholder="Опишите требования и задачи проекта..."
								class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
								class:ring-red-500={errors.description}
							></textarea>
							{#if errors.description}<p class="mt-1 text-sm text-red-600 dark:text-red-400">
									{errors.description}
								</p>{/if}
							<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
								Минимум 10 символов. Текущая длина: {formData.description.trim().length}
							</p>
						</div>

						<!-- Comment -->
						<div>
							<label
								for="comment"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>Комментарий</label
							>
							<textarea
								id="comment"
								bind:value={formData.comment}
								disabled={isLoading}
								rows="2"
								placeholder="Дополнительные примечания..."
								class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
							></textarea>
							<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Необязательное поле</p>
						</div>

						<!-- Active Status -->
						<div
							class="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
						>
							<input
								type="checkbox"
								id="is_active"
								bind:checked={formData.is_active}
								disabled={isLoading}
								class="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700"
							/>
							<div>
								<label for="is_active" class="text-sm font-medium text-gray-900 dark:text-white"
									>Активно</label
								>
								<p class="text-xs text-gray-500 dark:text-gray-400">
									Техзадание будет активным и видимым
								</p>
							</div>
						</div>

						<!-- Approval Status -->
						<div
							class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
						>
							<p class="mb-3 text-sm font-medium text-gray-900 dark:text-white">
								Статус согласования
							</p>
							<div class="space-y-2">
								<label class="flex items-center gap-2">
									<input
										type="radio"
										name="edit_approval_status"
										bind:group={formData.approval_status}
										value="none"
										disabled={isLoading}
										class="h-4 w-4 border-gray-300 text-violet-600 focus:ring-violet-500 dark:border-gray-600"
									/>
									<div>
										<span class="text-sm text-gray-700 dark:text-gray-300"
											>Не требует согласования</span
										>
										<p class="text-xs text-gray-500 dark:text-gray-400">
											Техзадание не требует дополнительного одобрения
										</p>
									</div>
								</label>
								<label class="flex items-center gap-2">
									<input
										type="radio"
										name="edit_approval_status"
										bind:group={formData.approval_status}
										value="requires_approval"
										disabled={isLoading}
										class="h-4 w-4 border-gray-300 text-violet-600 focus:ring-violet-500 dark:border-gray-600"
									/>
									<div>
										<span class="text-sm text-gray-700 dark:text-gray-300"
											>Требуется согласование</span
										>
										<p class="text-xs text-gray-500 dark:text-gray-400">
											Техзадание ожидает одобрения перед началом работ
										</p>
									</div>
								</label>
								<label class="flex items-center gap-2">
									<input
										type="radio"
										name="edit_approval_status"
										bind:group={formData.approval_status}
										value="approved"
										disabled={isLoading}
										class="h-4 w-4 border-gray-300 text-violet-600 focus:ring-violet-500 dark:border-gray-600"
									/>
									<div>
										<span class="text-sm text-gray-700 dark:text-gray-300">Согласовано</span>
										<p class="text-xs text-gray-500 dark:text-gray-400">
											Техзадание уже согласовано и готово к работе
										</p>
									</div>
								</label>
							</div>
						</div>

						<!-- Files Section: Sketches (ТЗ) -->
						{#if tz.sketches && tz.sketches.length > 0}
							<div
								class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
							>
								<h3
									class="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
								>
									<svg
										class="h-4 w-4 text-violet-500"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
									Файлы ТЗ
									<span
										class="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
									>
										{tz.sketches.length}
									</span>
								</h3>
								<div class="space-y-2">
									{#each tz.sketches as sketch (sketch.id)}
										<div
											class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-colors dark:border-gray-600 dark:bg-gray-800"
										>
											<div class="min-w-0 flex-1">
												<p
													class="truncate text-sm font-medium text-gray-900 dark:text-white"
													title={sketch.file_name}
												>
													{sketch.file_name}
												</p>
												<div
													class="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
												>
													{#if sketch.file_size}
														<span>{formatFileSize(sketch.file_size)}</span>
													{/if}
													{#if sketch.uploader}
														<span>•</span>
														<span class="truncate"
															>{sketch.uploader.name || sketch.uploader.email}</span
														>
													{/if}
												</div>
											</div>
											<div class="ml-3 flex items-center gap-1.5">
												{#if confirmDeleteFileId === sketch.id}
													<!-- Confirmation state -->
													<button
														type="button"
														onclick={() => performDeleteFile(sketch.id)}
														disabled={isDeletingFile || isLoading}
														class="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
													>
														{#if isDeletingFile}
															<svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
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
														{/if}
														Да, удалить
													</button>
													<button
														type="button"
														onclick={cancelDeleteConfirmation}
														disabled={isDeletingFile}
														class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
													>
														Отмена
													</button>
												{:else}
													<!-- Normal state -->
													<button
														type="button"
														onclick={() => handleDeleteFileClick(sketch.id)}
														disabled={isLoading || isDeletingFile}
														title="Удалить файл"
														class="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 shadow-sm transition-colors hover:border-red-300 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
													>
														<svg
															class="h-3.5 w-3.5"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
															/>
														</svg>
														Удалить
													</button>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Files Section: Commercial Offers (КП) -->
						{#if tz.commercialOffers && tz.commercialOffers.length > 0}
							<div
								class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
							>
								<h3
									class="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
								>
									<svg
										class="h-4 w-4 text-blue-500"
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
									Файлы КП
									<span
										class="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
									>
										{tz.commercialOffers.length}
									</span>
								</h3>
								<div class="space-y-2">
									{#each tz.commercialOffers as offer (offer.id)}
										<div
											class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-colors dark:border-gray-600 dark:bg-gray-800"
										>
											<div class="min-w-0 flex-1">
												<p
													class="truncate text-sm font-medium text-gray-900 dark:text-white"
													title={offer.file_name}
												>
													{offer.file_name}
												</p>
												<div
													class="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
												>
													{#if offer.file_size}
														<span>{formatFileSize(offer.file_size)}</span>
													{/if}
													{#if offer.uploader}
														<span>•</span>
														<span class="truncate"
															>{offer.uploader.name || offer.uploader.email}</span
														>
													{/if}
												</div>
											</div>
											<div class="ml-3 flex items-center gap-1.5">
												{#if confirmDeleteFileId === offer.id}
													<!-- Confirmation state -->
													<button
														type="button"
														onclick={() => performDeleteFile(offer.id)}
														disabled={isDeletingFile || isLoading}
														class="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
													>
														{#if isDeletingFile}
															<svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
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
														{/if}
														Да, удалить
													</button>
													<button
														type="button"
														onclick={cancelDeleteConfirmation}
														disabled={isDeletingFile}
														class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
													>
														Отмена
													</button>
												{:else}
													<!-- Normal state -->
													<button
														type="button"
														onclick={() => handleDeleteFileClick(offer.id)}
														disabled={isLoading || isDeletingFile}
														title="Удалить файл"
														class="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 shadow-sm transition-colors hover:border-red-300 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
													>
														<svg
															class="h-3.5 w-3.5"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
															/>
														</svg>
														Удалить
													</button>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</form>

				<!-- Footer -->
				<div
					class="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50"
				>
					<div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
						<button
							type="button"
							onclick={onCancel}
							disabled={isLoading}
							class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
							>Отмена</button
						>
						<button
							type="submit"
							onclick={handleSubmit}
							disabled={isLoading}
							class="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-violet-500 focus:ring-2 focus:ring-violet-600 focus:ring-offset-2 focus:outline-none disabled:opacity-50 dark:focus:ring-offset-gray-900"
						>
							{#if isLoading}<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"
									><circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle><path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path></svg
								>{/if}
							{isLoading ? 'Сохранение...' : 'Сохранить'}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
