<script>
	import { onMount } from 'svelte';

	/**
	 * ActionEditModal Component
	 *
	 * A modal component for editing existing actions.
	 * Provides form validation, loading states, and proper accessibility.
	 *
	 * @param {boolean} isOpen - Controls modal visibility
	 * @param {Object} action - Action to edit
	 * @param {Function} onSave - Callback function for saving updated action
	 * @param {Function} onCancel - Callback function for cancellation
	 * @param {boolean} [isLoading=false] - Loading state for save button
	 * @param {Array} companies - List of companies for selection
	 */
	let { isOpen = false, action = null, onSave, onCancel, isLoading = false, companies = [] } = $props();

	let modalElement = $state();
	let firstInputElement = $state();
	let previousActiveElement;

	// Form data state
	let formData = $state({
		id: '',
		name: '',
		description: '',
		start: '',
		end: '',
		company_id: '',
		is_active: false
	});

	// Form validation state
	let errors = $state({});
	let isFormValid = $derived(
		formData.name.trim() !== '' &&
			formData.description.trim() !== '' &&
			formData.start !== '' &&
			formData.end !== '' &&
			formData.company_id !== '' &&
			Object.keys(errors).length === 0
	);

	// Populate form when action changes or modal opens
	$effect(() => {
		if (isOpen && action) {
			formData = {
				id: action.id,
				name: action.name || '',
				description: action.description || '',
				start: action.start || '',
				end: action.end || '',
				company_id: action.company_id || '',
				is_active: action.is_active || false
			};
			errors = {};
		}
	});

	// Handle escape key press
	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen && !isLoading) {
			handleCancel();
		}
	}

	// Handle backdrop click
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget && !isLoading) {
			handleCancel();
		}
	}

	// Handle form submission
	function handleSubmit(event) {
		event.preventDefault();
		if (isFormValid && !isLoading) {
			handleSave();
		}
	}

	// Handle save action
	async function handleSave() {
		if (onSave && !isLoading && isFormValid) {
			const actionData = {
				id: formData.id,
				name: formData.name.trim(),
				description: formData.description.trim(),
				start: formData.start,
				end: formData.end,
				company_id: formData.company_id,
				is_active: formData.is_active
			};

			onSave(actionData);
		}
	}

	// Handle cancel action
	function handleCancel() {
		if (onCancel && !isLoading) {
			onCancel();
		}
	}

	// Validate field
	function validateField(field, value) {
		const newErrors = { ...errors };

		switch (field) {
			case 'name': {
				if (!value.trim()) {
					newErrors.name = 'Название акции обязательно';
				} else {
					delete newErrors.name;
				}
				break;
			}
			case 'description': {
				if (!value.trim()) {
					newErrors.description = 'Описание акции обязательно';
				} else {
					delete newErrors.description;
				}
				break;
			}
			case 'start': {
				if (!value) {
					newErrors.start = 'Дата начала обязательна';
				} else {
					delete newErrors.start;
					// Validate end date if it exists
					if (formData.end && value > formData.end) {
						newErrors.end = 'Дата окончания должна быть позже даты начала';
					} else if (formData.end) {
						delete newErrors.end;
					}
				}
				break;
			}
			case 'end': {
				if (!value) {
					newErrors.end = 'Дата окончания обязательна';
				} else if (formData.start && value < formData.start) {
					newErrors.end = 'Дата окончания должна быть позже даты начала';
				} else {
					delete newErrors.end;
				}
				break;
			}
			case 'company_id': {
				if (!value) {
					newErrors.company_id = 'Выберите компанию';
				} else {
					delete newErrors.company_id;
				}
				break;
			}
			default: {
				if (field in newErrors) delete newErrors[field];
				break;
			}
		}

		errors = newErrors;
	}

	// Handle input change
	function handleInputChange(field, value) {
		formData[field] = value;
		validateField(field, value);
	}

	// Focus management
	$effect(() => {
		if (isOpen) {
			previousActiveElement = document.activeElement;

			setTimeout(() => {
				if (firstInputElement) {
					firstInputElement.focus();
				}
			}, 100);

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

	// Trap focus within modal
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

<!-- Modal backdrop and container -->
{#if isOpen && action}
	<div
		class="animate-fade animate-duration-100 animate-ease-linear fixed inset-0 z-50 overflow-y-auto"
	>
		<div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
			<!-- Backdrop -->
			<div
				class="fixed inset-0 bg-black/80 transition-opacity dark:bg-black/80"
				onclick={handleBackdropClick}
				aria-hidden="true"
			></div>

			<!-- Modal panel -->
			<div
				bind:this={modalElement}
				class="relative mx-4 transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:mx-0 sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 dark:bg-gray-800"
				onkeydown={handleTabKey}
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
				tabindex="-1"
			>
				<!-- Modal Header -->
				<div class="mb-6">
					<h3
						class="text-lg font-semibold leading-6 text-gray-900 dark:text-white"
						id="modal-title"
					>
						Редактировать акцию
					</h3>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Обновите информацию об акции
					</p>
				</div>

				<!-- Form -->
				<form onsubmit={handleSubmit} class="space-y-6">
					<!-- Action Name -->
					<div>
						<label
							for="action-name"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Название акции <span class="text-red-500">*</span>
						</label>
						<input
							bind:this={firstInputElement}
							type="text"
							id="action-name"
							value={formData.name}
							oninput={(e) => handleInputChange('name', e.target.value)}
							disabled={isLoading}
							required
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
							aria-describedby={errors.name ? 'action-name-error' : undefined}
							aria-invalid={errors.name ? 'true' : 'false'}
						/>
						{#if errors.name}
							<p id="action-name-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
								{errors.name}
							</p>
						{/if}
					</div>

					<!-- Description -->
					<div>
						<label
							for="description"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Описание акции <span class="text-red-500">*</span>
						</label>
						<textarea
							id="description"
							value={formData.description}
							oninput={(e) => handleInputChange('description', e.target.value)}
							disabled={isLoading}
							required
							rows="4"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
							aria-describedby={errors.description ? 'description-error' : undefined}
							aria-invalid={errors.description ? 'true' : 'false'}
						></textarea>
						{#if errors.description}
							<p id="description-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
								{errors.description}
							</p>
						{/if}
					</div>

					<!-- Company Selection -->
					<div>
						<label
							for="company"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Компания-поставщик <span class="text-red-500">*</span>
						</label>
						<select
							id="company"
							value={formData.company_id}
							onchange={(e) => handleInputChange('company_id', e.target.value)}
							disabled={isLoading}
							required
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
							aria-describedby={errors.company_id ? 'company-error' : undefined}
							aria-invalid={errors.company_id ? 'true' : 'false'}
						>
							<option value="">Выберите компанию</option>
							{#each companies as company}
								<option value={company.id}>{company.name}</option>
							{/each}
						</select>
						{#if errors.company_id}
							<p id="company-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
								{errors.company_id}
							</p>
						{/if}
					</div>

					<!-- Start and End Dates -->
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div>
							<label
								for="start-date"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Дата начала <span class="text-red-500">*</span>
							</label>
							<input
								type="date"
								id="start-date"
								value={formData.start}
								oninput={(e) => handleInputChange('start', e.target.value)}
								disabled={isLoading}
								required
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
								aria-describedby={errors.start ? 'start-date-error' : undefined}
								aria-invalid={errors.start ? 'true' : 'false'}
							/>
							{#if errors.start}
								<p id="start-date-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
									{errors.start}
								</p>
							{/if}
						</div>

						<div>
							<label
								for="end-date"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Дата окончания <span class="text-red-500">*</span>
							</label>
							<input
								type="date"
								id="end-date"
								value={formData.end}
								oninput={(e) => handleInputChange('end', e.target.value)}
								disabled={isLoading}
								required
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
								aria-describedby={errors.end ? 'end-date-error' : undefined}
								aria-invalid={errors.end ? 'true' : 'false'}
							/>
							{#if errors.end}
								<p id="end-date-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
									{errors.end}
								</p>
							{/if}
						</div>
					</div>

					<!-- Active Status -->
					<div class="flex items-center">
						<input
							type="checkbox"
							id="is-active"
							checked={formData.is_active}
							onchange={(e) => handleInputChange('is_active', e.target.checked)}
							disabled={isLoading}
							class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-400"
						/>
						<label for="is-active" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
							Акция активна
						</label>
					</div>

					<!-- Action buttons -->
					<div
						class="flex flex-col space-y-3 sm:flex-row-reverse sm:space-x-3 sm:space-y-0 sm:space-x-reverse"
					>
						<!-- Save button -->
						<button
							type="submit"
							disabled={isLoading || !isFormValid}
							class="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2"
						>
							{#if isLoading}
								<svg
									class="mr-2 h-4 w-4 animate-spin"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									aria-hidden="true"
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
							{/if}
							{isLoading ? 'Сохранение...' : 'Сохранить изменения'}
						</button>

						<!-- Cancel button -->
						<button
							type="button"
							onclick={handleCancel}
							disabled={isLoading}
							class="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-colors duration-200 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600 dark:active:bg-gray-600"
						>
							Отмена
		</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
