<script>
	let { isOpen = false, tz = null, projects = [], onSave, onCancel, isLoading = false } = $props();

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
							class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
							>Отмена</button
						>
						<button
							type="submit"
							onclick={handleSubmit}
							disabled={isLoading}
							class="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-gray-900"
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
