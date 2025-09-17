<script>
	import { onMount } from 'svelte';

	/**
	 * ProjectEditModal Component
	 *
	 * A modal component for editing project information.
	 * Provides form validation, loading states, and proper accessibility.
	 *
	 * @param {boolean} isOpen - Controls modal visibility
	 * @param {Object} project - The project object to edit
	 * @param {Function} onSave - Callback function for saving changes
	 * @param {Function} onCancel - Callback function for cancellation
	 * @param {boolean} [isLoading=false] - Loading state for save button
	 */
	let { isOpen = false, project = null, onSave, onCancel, isLoading = false } = $props();

	let modalElement = $state();
	let firstInputElement = $state();
	let previousActiveElement;

	// Form data state
	let formData = $state({
		name: '',
		city: '',
		description: '',
		contract_number: '',
		contract_date: '',
		contract_amount: '',
		agent_rate: '',
		agent_rate_type: 'percentage',
		planned_completion: ''
	});

	// Form validation state
	let errors = $state({});
	// Поля необязательные: валидность зависит только от отсутствия ошибок формата
	let isFormValid = $derived(Object.keys(errors).length === 0);

	// Initialize form data when project changes
	$effect(() => {
		if (project && isOpen) {
			formData = {
				name: project.value || '', // map value to name for UI
				city: project.city || '',
				description: project.description || '',
				contract_number: project.contract_name || '', // map contract_name to contract_number for UI
				contract_date: project.contract_date ? project.contract_date.split('T')[0] : '',
				contract_amount: project.contract_amount || '',
				agent_rate: project.agent_percentage || '', // map agent_percentage to agent_rate for UI
				agent_rate_type: 'percentage', // default value since field doesn't exist in new schema
				planned_completion: project.planned_completion_date
					? project.planned_completion_date.split('T')[0]
					: '' // map planned_completion_date to planned_completion for UI
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
	function handleSave() {
		if (onSave && !isLoading && isFormValid) {
			// Map UI field names to GraphQL schema field names
			const updatedData = { id: project.id };

			const nameTrimmed = (formData.name || '').trim();
			if (nameTrimmed !== '') updatedData.value = nameTrimmed;

			const cityTrimmed = (formData.city || '').trim();
			if (cityTrimmed !== '') updatedData.city = cityTrimmed;

			const descriptionTrimmed = (formData.description || '').trim();
			if (descriptionTrimmed !== '') updatedData.description = descriptionTrimmed;

			const contractNumberTrimmed = (formData.contract_number || '').trim();
			if (contractNumberTrimmed !== '') updatedData.contract_name = contractNumberTrimmed;

			if (formData.contract_date) updatedData.contract_date = formData.contract_date;

			if (
				formData.contract_amount !== '' &&
				formData.contract_amount !== null &&
				formData.contract_amount !== undefined
			) {
				const amount = parseFloat(formData.contract_amount);
				if (!isNaN(amount) && amount > 0) updatedData.contract_amount = amount;
			}

			if (
				formData.agent_rate !== '' &&
				formData.agent_rate !== null &&
				formData.agent_rate !== undefined
			) {
				const rate = parseFloat(formData.agent_rate);
				if (!isNaN(rate) && rate > 0) updatedData.agent_percentage = rate;
			}

			if (formData.planned_completion)
				updatedData.planned_completion_date = formData.planned_completion;

			onSave(updatedData);
		}
	}

	// Handle cancel action
	function handleCancel() {
		if (onCancel && !isLoading) {
			onCancel();
		}
	}

	// Validate field (все поля необязательны; проверяем только корректность числовых значений)
	function validateField(field, value) {
		const newErrors = { ...errors };

		switch (field) {
			case 'contract_amount': {
				if (value === '' || value === null || value === undefined) {
					delete newErrors.contract_amount;
				} else if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
					newErrors.contract_amount = 'Сумма договора должна быть положительным числом';
				} else {
					delete newErrors.contract_amount;
				}
				break;
			}
			case 'agent_rate': {
				if (value === '' || value === null || value === undefined) {
					delete newErrors.agent_rate;
				} else if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
					newErrors.agent_rate = 'Ставка агенту должна быть положительным числом';
				} else {
					delete newErrors.agent_rate;
				}
				break;
			}
			default: {
				// Текстовые и датовые поля не обязательны
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
			// Store the previously focused element
			previousActiveElement = document.activeElement;

			// Focus the first input when modal opens
			setTimeout(() => {
				if (firstInputElement) {
					firstInputElement.focus();
				}
			}, 100);

			// Add event listener for escape key
			document.addEventListener('keydown', handleKeydown);

			// Prevent body scroll
			document.body.style.overflow = 'hidden';
		} else {
			// Remove event listener
			document.removeEventListener('keydown', handleKeydown);

			// Restore body scroll
			document.body.style.overflow = '';

			// Restore focus to previously active element
			if (previousActiveElement) {
				previousActiveElement.focus();
			}
		}

		// Cleanup function
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
				// Shift + Tab
				if (document.activeElement === firstElement) {
					event.preventDefault();
					lastElement.focus();
				}
			} else {
				// Tab
				if (document.activeElement === lastElement) {
					event.preventDefault();
					firstElement.focus();
				}
			}
		}
	}
</script>

<!-- Modal backdrop and container -->
{#if isOpen && project}
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
						Редактировать проект
					</h3>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Обновите информацию о проекте "{project.name}"
					</p>
				</div>

				<!-- Form -->
				<form onsubmit={handleSubmit} class="space-y-6">
					<!-- Project Name -->
					<div>
						<label
							for="project-name"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Название проекта
						</label>
						<input
							bind:this={firstInputElement}
							type="text"
							id="project-name"
							value={formData.name}
							oninput={(e) => handleInputChange('name', e.target.value)}
							disabled={isLoading}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
							aria-describedby={errors.name ? 'project-name-error' : undefined}
							aria-invalid={errors.name ? 'true' : 'false'}
						/>
						{#if errors.name}
							<p id="project-name-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
								{errors.name}
							</p>
						{/if}
					</div>

					<!-- City -->
					<div>
						<label
							for="project-city"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Город
						</label>
						<input
							type="text"
							id="project-city"
							value={formData.city}
							oninput={(e) => handleInputChange('city', e.target.value)}
							disabled={isLoading}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
							aria-describedby={errors.city ? 'project-city-error' : undefined}
							aria-invalid={errors.city ? 'true' : 'false'}
						/>
						{#if errors.city}
							<p id="project-city-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
								{errors.city}
							</p>
						{/if}
					</div>

					<!-- Description -->
					<div>
						<label
							for="project-description"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Описание
						</label>
						<textarea
							id="project-description"
							rows="3"
							value={formData.description}
							oninput={(e) => handleInputChange('description', e.target.value)}
							disabled={isLoading}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
							placeholder="Описание проекта (необязательно)"
						></textarea>
					</div>

					<!-- Contract Number and Date -->
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div>
							<label
								for="contract-number"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Номер договора
							</label>
							<input
								type="text"
								id="contract-number"
								value={formData.contract_number}
								oninput={(e) => handleInputChange('contract_number', e.target.value)}
								disabled={isLoading}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
								aria-describedby={errors.contract_number ? 'contract-number-error' : undefined}
								aria-invalid={errors.contract_number ? 'true' : 'false'}
							/>
							{#if errors.contract_number}
								<p id="contract-number-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
									{errors.contract_number}
								</p>
							{/if}
						</div>

						<div>
							<label
								for="contract-date"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Дата заключения договора
							</label>
							<input
								type="date"
								id="contract-date"
								value={formData.contract_date}
								oninput={(e) => handleInputChange('contract_date', e.target.value)}
								disabled={isLoading}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
								aria-describedby={errors.contract_date ? 'contract-date-error' : undefined}
								aria-invalid={errors.contract_date ? 'true' : 'false'}
							/>
							{#if errors.contract_date}
								<p id="contract-date-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
									{errors.contract_date}
								</p>
							{/if}
						</div>
					</div>

					<!-- Contract Amount and Agent Rate -->
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div>
							<label
								for="contract-amount"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Сумма договора (₽)
							</label>
							<input
								type="number"
								id="contract-amount"
								min="0"
								step="0.01"
								value={formData.contract_amount}
								oninput={(e) => handleInputChange('contract_amount', e.target.value)}
								disabled={isLoading}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
								aria-describedby={errors.contract_amount ? 'contract-amount-error' : undefined}
								aria-invalid={errors.contract_amount ? 'true' : 'false'}
							/>
							{#if errors.contract_amount}
								<p id="contract-amount-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
									{errors.contract_amount}
								</p>
							{/if}
						</div>

						<div>
							<label
								for="agent-rate"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Ставка агенту
							</label>
							<div class="mt-1 flex rounded-md shadow-sm">
								<input
									type="number"
									id="agent-rate"
									min="0"
									step="0.01"
									value={formData.agent_rate}
									oninput={(e) => handleInputChange('agent_rate', e.target.value)}
									disabled={isLoading}
									class="block w-full rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
									aria-describedby={errors.agent_rate ? 'agent-rate-error' : undefined}
									aria-invalid={errors.agent_rate ? 'true' : 'false'}
								/>
								<select
									value={formData.agent_rate_type}
									onchange={(e) => handleInputChange('agent_rate_type', e.target.value)}
									disabled={isLoading}
									class="rounded-none rounded-r-md border-l-0 border-gray-300 bg-gray-50 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 sm:text-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-700"
								>
									<option value="percentage">%</option>
									<option value="fixed">₽</option>
								</select>
							</div>
							{#if errors.agent_rate}
								<p id="agent-rate-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
									{errors.agent_rate}
								</p>
							{/if}
						</div>
					</div>

					<!-- Planned Completion -->
					<div>
						<label
							for="planned-completion"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Планируемое завершение
						</label>
						<input
							type="date"
							id="planned-completion"
							value={formData.planned_completion}
							oninput={(e) => handleInputChange('planned_completion', e.target.value)}
							disabled={isLoading}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
							aria-describedby={errors.planned_completion ? 'planned-completion-error' : undefined}
							aria-invalid={errors.planned_completion ? 'true' : 'false'}
						/>
						{#if errors.planned_completion}
							<p id="planned-completion-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
								{errors.planned_completion}
							</p>
						{/if}
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
