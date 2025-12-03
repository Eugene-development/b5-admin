<script>
	let { isOpen = false, tz = null, projects = [], onSave, onCancel, isLoading = false } = $props();

	// Form state
	let formData = $state({
		id: '',
		project_id: '',
		description: '',
		comment: '',
		is_active: true,
		requires_approval: false,
		is_approved: false
	});

	let errors = $state({});

	// Track if modal was previously closed to detect opening
	let wasOpen = $state(false);

	// Update form only when modal opens (not on every tz update)
	$effect(() => {
		if (isOpen && !wasOpen && tz) {
			formData = {
				id: tz.id,
				project_id: tz.project_id || '',
				description: tz.description || '',
				comment: tz.comment || '',
				is_active: tz.is_active ?? true,
				requires_approval: tz.requires_approval ?? false,
				is_approved: tz.is_approved ?? false
			};
			errors = {};
		}
		wasOpen = isOpen;
	});

	// Validate form
	function validateForm() {
		const newErrors = {};

		if (!formData.project_id) {
			newErrors.project_id = 'Выберите проект';
		}

		if (!formData.description || formData.description.trim().length === 0) {
			newErrors.description = 'Введите описание техзадания';
		} else if (formData.description.trim().length < 10) {
			newErrors.description = 'Описание должно содержать минимум 10 символов';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	// Handle form submission
	function handleSubmit(event) {
		event.preventDefault();

		if (!validateForm()) {
			return;
		}

		// Trim whitespace from text fields
		const cleanedData = {
			...formData,
			description: formData.description.trim(),
			comment: formData.comment.trim() || null
		};

		onSave(cleanedData);
	}

	// Handle backdrop click to close modal
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget && !isLoading) {
			onCancel();
		}
	}

	// Handle escape key to close modal
	function handleKeydown(event) {
		if (event.key === 'Escape' && !isLoading) {
			onCancel();
		}
	}

	// Prevent modal content click from closing modal
	function handleModalClick(event) {
		event.stopPropagation();
	}

	// Handle body scroll when modal is open/closed
	$effect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}

		return () => {
			document.body.style.overflow = '';
		};
	});

	// Get project display name
	function getProjectDisplayName(project) {
		const parts = [];
		if (project.value) parts.push(project.value);
		if (project.region) parts.push(`(${project.region})`);
		return parts.join(' ') || project.id;
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 overflow-y-auto"
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
						Редактировать техническое задание #{tz?.id}
					</h3>
					<button
						type="button"
						onclick={onCancel}
						disabled={isLoading}
						class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white"
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
				<form onsubmit={handleSubmit} class="mt-6">
					<div class="space-y-6">
						<!-- Project selection -->
						<div>
							<label
								for="project_id"
								class="block text-sm font-medium text-gray-900 dark:text-white"
							>
								Проект <span class="text-red-500">*</span>
							</label>
							<select
								id="project_id"
								bind:value={formData.project_id}
								disabled={isLoading}
								class="mt-2 block w-full rounded-md border-0 py-1.5 pr-10 pl-3 text-gray-900 ring-1 ring-gray-300 ring-inset focus:ring-2 focus:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600"
								class:ring-red-500={errors.project_id}
								class:focus:ring-red-500={errors.project_id}
							>
								<option value="">Выберите проект</option>
								{#each projects as project (project.id)}
									<option value={project.id}>
										{getProjectDisplayName(project)}
									</option>
								{/each}
							</select>
							{#if errors.project_id}
								<p class="mt-2 text-sm text-red-600 dark:text-red-400">
									{errors.project_id}
								</p>
							{/if}
						</div>

						<!-- Description -->
						<div>
							<label
								for="description"
								class="block text-sm font-medium text-gray-900 dark:text-white"
							>
								Описание техзадания <span class="text-red-500">*</span>
							</label>
							<textarea
								id="description"
								bind:value={formData.description}
								disabled={isLoading}
								rows="6"
								class="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 focus:ring-inset disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500"
								class:ring-red-500={errors.description}
								class:focus:ring-red-500={errors.description}
								placeholder="Опишите требования и задачи проекта..."
							></textarea>
							{#if errors.description}
								<p class="mt-2 text-sm text-red-600 dark:text-red-400">
									{errors.description}
								</p>
							{/if}
							<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
								Минимум 10 символов. Текущая длина: {formData.description.trim().length}
							</p>
						</div>

						<!-- Comment -->
						<div>
							<label for="comment" class="block text-sm font-medium text-gray-900 dark:text-white">
								Комментарий
							</label>
							<textarea
								id="comment"
								bind:value={formData.comment}
								disabled={isLoading}
								rows="3"
								class="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 focus:ring-inset disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500"
								placeholder="Дополнительные примечания или комментарии..."
							></textarea>
							<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Необязательное поле</p>
						</div>

						<!-- Checkboxes -->
						<div class="space-y-4">
							<div class="flex items-start">
								<div class="flex h-6 items-center">
									<input
										id="is_active"
										type="checkbox"
										bind:checked={formData.is_active}
										disabled={isLoading}
										class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
									/>
								</div>
								<div class="ml-3 text-sm leading-6">
									<label for="is_active" class="font-medium text-gray-900 dark:text-white">
										Активно
									</label>
									<p class="text-gray-500 dark:text-gray-400">
										Техзадание будет активным и видимым
									</p>
								</div>
							</div>

							<div class="flex items-start">
								<div class="flex h-6 items-center">
									<input
										id="requires_approval"
										type="checkbox"
										bind:checked={formData.requires_approval}
										disabled={isLoading}
										class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
									/>
								</div>
								<div class="ml-3 text-sm leading-6">
									<label for="requires_approval" class="font-medium text-gray-900 dark:text-white">
										Требуется согласование
									</label>
									<p class="text-gray-500 dark:text-gray-400">
										Техзадание требует одобрения перед началом работ
									</p>
								</div>
							</div>

							<div class="flex items-start">
								<div class="flex h-6 items-center">
									<input
										id="is_approved"
										type="checkbox"
										bind:checked={formData.is_approved}
										disabled={isLoading || !formData.requires_approval}
										class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
									/>
								</div>
								<div class="ml-3 text-sm leading-6">
									<label for="is_approved" class="font-medium text-gray-900 dark:text-white">
										Согласовано
									</label>
									<p class="text-gray-500 dark:text-gray-400">Техзадание уже согласовано</p>
								</div>
							</div>
						</div>
					</div>

					<!-- Modal footer -->
					<div
						class="mt-6 flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end dark:border-gray-600"
					>
						<button
							type="button"
							onclick={onCancel}
							disabled={isLoading}
							class="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
						>
							Отмена
						</button>
						<button
							type="submit"
							disabled={isLoading}
							class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
						>
							{#if isLoading}
								<svg
									class="mr-2 h-4 w-4 animate-spin text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
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
								Сохранение...
							{:else}
								Сохранить изменения
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
