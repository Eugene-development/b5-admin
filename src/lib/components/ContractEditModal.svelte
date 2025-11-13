<script>
	import { onMount } from 'svelte';
	import { getAllProjects } from '$lib/api/projects.js';
	import { refreshCompanies } from '$lib/api/companies.js';

	let {
		isOpen = false,
		contract = null,
		onSave,
		onCancel,
		isLoading = false
	} = $props();

	let modalElement = $state();
	let firstInputElement = $state();
	let previousActiveElement;

	// Available options
	let projects = $state([]);
	let companies = $state([]);
	let isLoadingProjects = $state(false);
	let isLoadingCompanies = $state(false);

	// Form data state
	let formData = $state({
		project_id: '',
		company_id: '',
		contract_number: '',
		contract_date: '',
		planned_completion_date: '',
		actual_completion_date: '',
		agent_percentage: '',
		curator_percentage: '',
		is_active: true
	});

	// Form validation state
	let errors = $state({});
	let isFormValid = $derived(
		formData.project_id &&
		formData.company_id &&
		formData.contract_date &&
		formData.planned_completion_date &&
		formData.agent_percentage !== '' &&
		formData.curator_percentage !== '' &&
		Object.keys(errors).length === 0
	);

	// Load projects and companies
	async function loadOptions() {
		isLoadingProjects = true;
		isLoadingCompanies = true;
		try {
			const [projectsData, companiesData] = await Promise.all([
				getAllProjects(),
				refreshCompanies()
			]);
			projects = projectsData;
			companies = companiesData;
		} catch (error) {
			console.error('Failed to load options:', error);
		} finally {
			isLoadingProjects = false;
			isLoadingCompanies = false;
		}
	}

	// Initialize form data when contract changes
	$effect(() => {
		if (contract && isOpen) {
			loadOptions();
			formData = {
				project_id: contract.project_id || '',
				company_id: contract.company_id || '',
				contract_number: contract.contract_number || '',
				contract_date: contract.contract_date ? contract.contract_date.split('T')[0] : '',
				planned_completion_date: contract.planned_completion_date
					? contract.planned_completion_date.split('T')[0]
					: '',
				actual_completion_date: contract.actual_completion_date
					? contract.actual_completion_date.split('T')[0]
					: '',
				agent_percentage: contract.agent_percentage || '',
				curator_percentage: contract.curator_percentage || '',
				is_active: contract.is_active ?? true
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
			const contractData = {
				id: contract.id,
				project_id: formData.project_id,
				company_id: formData.company_id,
				contract_date: formData.contract_date,
				planned_completion_date: formData.planned_completion_date,
				agent_percentage: parseFloat(formData.agent_percentage),
				curator_percentage: parseFloat(formData.curator_percentage),
				is_active: formData.is_active
			};

			if (formData.contract_number.trim()) {
				contractData.contract_number = formData.contract_number.trim();
			}

			if (formData.actual_completion_date) {
				contractData.actual_completion_date = formData.actual_completion_date;
			}

			onSave(contractData);
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
			case 'project_id':
				if (!value) {
					newErrors.project_id = 'Выберите проект';
				} else {
					delete newErrors.project_id;
				}
				break;
			case 'company_id':
				if (!value) {
					newErrors.company_id = 'Выберите компанию';
				} else {
					delete newErrors.company_id;
				}
				break;
			case 'contract_date':
				if (!value) {
					newErrors.contract_date = 'Укажите дату заключения';
				} else {
					delete newErrors.contract_date;
					if (formData.planned_completion_date) {
						validateField('planned_completion_date', formData.planned_completion_date);
					}
				}
				break;
			case 'planned_completion_date':
				if (!value) {
					newErrors.planned_completion_date = 'Укажите планируемую дату завершения';
				} else if (formData.contract_date && value < formData.contract_date) {
					newErrors.planned_completion_date = 'Дата завершения не может быть раньше даты заключения';
				} else {
					delete newErrors.planned_completion_date;
				}
				break;
			case 'agent_percentage':
				if (value === '' || value === null || value === undefined) {
					newErrors.agent_percentage = 'Укажите процент агента';
				} else {
					const num = parseFloat(value);
					if (isNaN(num) || num < 0 || num > 100) {
						newErrors.agent_percentage = 'Процент должен быть от 0 до 100';
					} else {
						delete newErrors.agent_percentage;
					}
				}
				break;
			case 'curator_percentage':
				if (value === '' || value === null || value === undefined) {
					newErrors.curator_percentage = 'Укажите процент куратора';
				} else {
					const num = parseFloat(value);
					if (isNaN(num) || num < 0 || num > 100) {
						newErrors.curator_percentage = 'Процент должен быть от 0 до 100';
					} else {
						delete newErrors.curator_percentage;
					}
				}
				break;
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
{#if isOpen && contract}
	<div
		class="fixed inset-0 z-50 animate-fade overflow-y-auto animate-duration-100 animate-ease-linear"
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
				class="relative mx-4 transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:mx-0 sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 dark:bg-gray-800"
				onkeydown={handleTabKey}
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
				tabindex="-1"
			>
				<!-- Modal Header -->
				<div class="mb-6">
					<h3
						class="text-lg leading-6 font-semibold text-gray-900 dark:text-white"
						id="modal-title"
					>
						Редактировать контракт
					</h3>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Обновите информацию о контракте
					</p>
				</div>

				<!-- Form -->
				<form onsubmit={handleSubmit} class="space-y-6">
					<!-- Project Selection -->
					<div>
						<label
							for="project-select"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Проект <span class="text-red-500">*</span>
						</label>
						<select
							bind:this={firstInputElement}
							id="project-select"
							value={formData.project_id}
							onchange={(e) => handleInputChange('project_id', e.target.value)}
							disabled={isLoading || isLoadingProjects}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							aria-describedby={errors.project_id ? 'project-error' : undefined}
							aria-invalid={errors.project_id ? 'true' : 'false'}
							required
						>
							<option value="">Выберите проект</option>
							{#each projects as project}
								<option value={project.id}>{project.value}</option>
							{/each}
						</select>
						{#if errors.project_id}
							<p id="project-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
								{errors.project_id}
							</p>
						{/if}
					</div>

					<!-- Company Selection -->
					<div>
						<label
							for="company-select"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Компания <span class="text-red-500">*</span>
						</label>
						<select
							id="company-select"
							value={formData.company_id}
							onchange={(e) => handleInputChange('company_id', e.target.value)}
							disabled={isLoading || isLoadingCompanies}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							aria-describedby={errors.company_id ? 'company-error' : undefined}
							aria-invalid={errors.company_id ? 'true' : 'false'}
							required
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

					<!-- Contract Number -->
					<div>
						<label
							for="contract-number"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Контракт
						</label>
						<input
							type="text"
							id="contract-number"
							value={formData.contract_number}
							oninput={(e) => handleInputChange('contract_number', e.target.value)}
							disabled={isLoading}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							placeholder="Опционально"
						/>
					</div>

					<!-- Dates -->
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div>
							<label
								for="contract-date"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Дата <span class="text-red-500">*</span>
							</label>
							<input
								type="date"
								id="contract-date"
								value={formData.contract_date}
								oninput={(e) => handleInputChange('contract_date', e.target.value)}
								disabled={isLoading}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								aria-describedby={errors.contract_date ? 'contract-date-error' : undefined}
								aria-invalid={errors.contract_date ? 'true' : 'false'}
								required
							/>
							{#if errors.contract_date}
								<p id="contract-date-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
									{errors.contract_date}
								</p>
							{/if}
						</div>

						<div>
							<label
								for="planned-date"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Планируемое завершение <span class="text-red-500">*</span>
							</label>
							<input
								type="date"
								id="planned-date"
								value={formData.planned_completion_date}
								oninput={(e) => handleInputChange('planned_completion_date', e.target.value)}
								disabled={isLoading}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								aria-describedby={errors.planned_completion_date ? 'planned-date-error' : undefined}
								aria-invalid={errors.planned_completion_date ? 'true' : 'false'}
								required
							/>
							{#if errors.planned_completion_date}
								<p id="planned-date-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
									{errors.planned_completion_date}
								</p>
							{/if}
						</div>
					</div>

					<!-- Actual Completion Date -->
					<div>
						<label
							for="actual-date"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Фактическая дата завершения
						</label>
						<input
							type="date"
							id="actual-date"
							value={formData.actual_completion_date}
							oninput={(e) => handleInputChange('actual_completion_date', e.target.value)}
							disabled={isLoading}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							placeholder="Опционально"
						/>
					</div>

					<!-- Percentages -->
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div>
							<label
								for="agent-percentage"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Процент агента (%) <span class="text-red-500">*</span>
							</label>
							<input
								type="number"
								id="agent-percentage"
								min="0"
								max="100"
								step="0.01"
								value={formData.agent_percentage}
								oninput={(e) => handleInputChange('agent_percentage', e.target.value)}
								disabled={isLoading}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								aria-describedby={errors.agent_percentage ? 'agent-percentage-error' : undefined}
								aria-invalid={errors.agent_percentage ? 'true' : 'false'}
								required
							/>
							{#if errors.agent_percentage}
								<p id="agent-percentage-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
									{errors.agent_percentage}
								</p>
							{/if}
						</div>

						<div>
							<label
								for="curator-percentage"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Процент куратора (%) <span class="text-red-500">*</span>
							</label>
							<input
								type="number"
								id="curator-percentage"
								min="0"
								max="100"
								step="0.01"
								value={formData.curator_percentage}
								oninput={(e) => handleInputChange('curator_percentage', e.target.value)}
								disabled={isLoading}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								aria-describedby={errors.curator_percentage ? 'curator-percentage-error' : undefined}
								aria-invalid={errors.curator_percentage ? 'true' : 'false'}
								required
							/>
							{#if errors.curator_percentage}
								<p id="curator-percentage-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
									{errors.curator_percentage}
								</p>
							{/if}
						</div>
					</div>

					<!-- Active Checkbox -->
					<div class="flex items-center">
						<input
							type="checkbox"
							id="is-active"
							checked={formData.is_active}
							onchange={(e) => handleInputChange('is_active', e.target.checked)}
							disabled={isLoading}
							class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700"
						/>
						<label for="is-active" class="ml-2 block text-sm text-gray-900 dark:text-gray-100">
							Активен
						</label>
					</div>

					<!-- Action buttons -->
					<div
						class="flex flex-col space-y-3 sm:flex-row-reverse sm:space-y-0 sm:space-x-3 sm:space-x-reverse"
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
							class="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 transition-colors duration-200 ring-inset hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
						>
							Отмена
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
