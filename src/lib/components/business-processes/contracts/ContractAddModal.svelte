<script>
	import { getAllProjects } from '$lib/api/projects.js';
	import { refreshCompanies } from '$lib/api/companies.js';

	let { isOpen = false, onSave, onCancel, isLoading = false } = $props();

	let modalElement = $state();
	let firstInputElement = $state();
	let previousActiveElement;

	let projects = $state([]);
	let companies = $state([]);
	let isLoadingProjects = $state(false);
	let isLoadingCompanies = $state(false);

	let formData = $state({
		project_id: '',
		company_id: '',
		factory_contract_number: '', // Номер договора от фабрики (записывается в поле value)
		comment: '',
		contract_date: '',
		planned_completion_date: '',
		contract_amount: '',
		is_active: true,
		is_urgent: false
	});

	let errors = $state({});
	let isFormValid = $derived(
		formData.project_id &&
			formData.company_id &&
			formData.contract_date &&
			formData.planned_completion_date &&
			formData.contract_amount !== '' &&
			Object.keys(errors).length === 0
	);

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

	$effect(() => {
		if (isOpen) {
			loadOptions();
			formData = {
				project_id: '',
				company_id: '',
				factory_contract_number: '',
				comment: '',
				contract_date: '',
				planned_completion_date: '',
				contract_amount: '',
				is_active: true,
				is_urgent: false
			};
			errors = {};
		}
	});

	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen && !isLoading) handleCancel();
	}

	function handleBackdropClick(event) {
		if (event.target === event.currentTarget && !isLoading) handleCancel();
	}

	function handleSubmit(event) {
		event.preventDefault();
		if (isFormValid && !isLoading) handleSave();
	}

	function handleSave() {
		if (onSave && !isLoading && isFormValid) {
			const contractData = {
				project_id: formData.project_id,
				company_id: formData.company_id,
				contract_date: formData.contract_date,
				planned_completion_date: formData.planned_completion_date,
				agent_percentage: 0,
				curator_percentage: 0,
				is_active: formData.is_active,
				is_urgent: formData.is_urgent,
				contract_amount: parseFloat(formData.contract_amount) || 0
			};
			// Номер договора от фабрики записывается в поле value
			if (formData.factory_contract_number.trim())
				contractData.value = formData.factory_contract_number.trim();
			// Передаём комментарий отдельно для обработки через полиморфную таблицу
			const comment = formData.comment.trim() || null;
			onSave(contractData, comment);
		}
	}

	function handleCancel() {
		if (onCancel && !isLoading) onCancel();
	}

	function validateField(field, value) {
		const newErrors = { ...errors };
		switch (field) {
			case 'project_id':
				if (!value) newErrors.project_id = 'Выберите проект';
				else delete newErrors.project_id;
				break;
			case 'company_id':
				if (!value) newErrors.company_id = 'Выберите фабрику';
				else delete newErrors.company_id;
				break;
			case 'contract_date':
				if (!value) newErrors.contract_date = 'Укажите дату заключения';
				else {
					delete newErrors.contract_date;
					if (formData.planned_completion_date)
						validateField('planned_completion_date', formData.planned_completion_date);
				}
				break;
			case 'planned_completion_date':
				if (!value) newErrors.planned_completion_date = 'Укажите планируемую дату завершения';
				else if (formData.contract_date && value < formData.contract_date)
					newErrors.planned_completion_date =
						'Дата завершения не может быть раньше даты заключения';
				else delete newErrors.planned_completion_date;
				break;
			case 'contract_amount':
				if (value === '' || value === null) newErrors.contract_amount = 'Укажите сумму контракта';
				else {
					const num = parseFloat(value);
					if (isNaN(num) || num < 0)
						newErrors.contract_amount = 'Сумма должна быть неотрицательным числом';
					else delete newErrors.contract_amount;
				}
				break;
		}
		errors = newErrors;
	}

	function handleInputChange(field, value) {
		formData[field] = value;
		validateField(field, value);
	}

	$effect(() => {
		if (isOpen) {
			previousActiveElement = document.activeElement;
			setTimeout(() => {
				if (firstInputElement) firstInputElement.focus();
			}, 100);
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
</script>

{#if isOpen}
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
										d="M12 6v6m0 0v6m0-6h6m-6 0H6"
									/>
								</svg>
							</div>
							<div>
								<h2 class="text-xl font-bold text-white">Добавить договор</h2>
								<p class="mt-0.5 text-sm text-indigo-100">Создайте новый договор</p>
							</div>
						</div>
						<button
							type="button"
							onclick={handleCancel}
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
						<!-- Project and Company Selection -->
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label
									for="company-select"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
									>Фабрика <span class="text-red-500">*</span></label
								>
								<select
									bind:this={firstInputElement}
									id="company-select"
									value={formData.company_id}
									onchange={(e) => handleInputChange('company_id', e.target.value)}
									disabled={isLoading || isLoadingCompanies}
									class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									required
								>
									<option value="">Выберите фабрику</option>
									{#each companies as company}<option value={company.id}>{company.name}</option
										>{/each}
								</select>
								{#if errors.company_id}<p class="mt-1 text-sm text-red-600 dark:text-red-400">
										{errors.company_id}
									</p>{/if}
							</div>

							<div>
								<label
									for="project-select"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
									>Проект <span class="text-red-500">*</span></label
								>
								<select
									id="project-select"
									value={formData.project_id}
									onchange={(e) => handleInputChange('project_id', e.target.value)}
									disabled={isLoading || isLoadingProjects}
									class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									required
								>
									<option value="">Выберите проект</option>
									{#each projects as project}<option value={project.id}
											>{project.project_number || 'Без номера'}</option
										>{/each}
								</select>
								{#if errors.project_id}<p class="mt-1 text-sm text-red-600 dark:text-red-400">
										{errors.project_id}
									</p>{/if}
							</div>
						</div>

						<!-- Factory Contract Number and Contract Amount -->
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label
									for="factory-contract-number"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
									>Номер договора от фабрики</label
								>
								<input
									type="text"
									id="factory-contract-number"
									value={formData.factory_contract_number}
									oninput={(e) => handleInputChange('factory_contract_number', e.target.value)}
									disabled={isLoading}
									class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									placeholder="Опционально"
								/>
							</div>

							<div>
								<label
									for="contract-amount"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
									>Сумма договора <span class="text-red-500">*</span></label
								>
								<input
									type="number"
									id="contract-amount"
									min="0"
									step="0.01"
									value={formData.contract_amount}
									oninput={(e) => handleInputChange('contract_amount', e.target.value)}
									disabled={isLoading}
									class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									placeholder="0"
									required
								/>
								{#if errors.contract_amount}<p class="mt-1 text-sm text-red-600 dark:text-red-400">
										{errors.contract_amount}
									</p>{/if}
							</div>
						</div>

						<!-- Dates -->
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label
									for="contract-date"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
									>Дата заключения <span class="text-red-500">*</span></label
								>
								<input
									type="date"
									id="contract-date"
									value={formData.contract_date}
									oninput={(e) => handleInputChange('contract_date', e.target.value)}
									disabled={isLoading}
									class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									required
								/>
								{#if errors.contract_date}<p class="mt-1 text-sm text-red-600 dark:text-red-400">
										{errors.contract_date}
									</p>{/if}
							</div>
							<div>
								<label
									for="planned-date"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
									>План. завершение <span class="text-red-500">*</span></label
								>
								<input
									type="date"
									id="planned-date"
									value={formData.planned_completion_date}
									oninput={(e) => handleInputChange('planned_completion_date', e.target.value)}
									disabled={isLoading}
									class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									required
								/>
								{#if errors.planned_completion_date}<p
										class="mt-1 text-sm text-red-600 dark:text-red-400"
									>
										{errors.planned_completion_date}
									</p>{/if}
							</div>
						</div>

						<!-- Comment -->
						<div>
							<label
								for="contract-comment"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>Комментарий</label
							>
							<textarea
								id="contract-comment"
								value={formData.comment}
								oninput={(e) => handleInputChange('comment', e.target.value)}
								disabled={isLoading}
								rows="2"
								class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
								placeholder="Опционально"
							></textarea>
						</div>

						<!-- Status Checkboxes -->
						<div
							class="flex items-center gap-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
						>
							<label class="flex items-center gap-2">
								<input
									type="checkbox"
									id="is-active"
									checked={formData.is_active}
									onchange={(e) => handleInputChange('is_active', e.target.checked)}
									disabled={isLoading}
									class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
								/>
								<span class="text-sm font-medium text-gray-900 dark:text-white">Активен</span>
							</label>
							<label class="flex items-center gap-2">
								<input
									type="checkbox"
									id="is-urgent"
									checked={formData.is_urgent}
									onchange={(e) => handleInputChange('is_urgent', e.target.checked)}
									disabled={isLoading}
									class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
								/>
								<span class="text-sm font-medium text-gray-900 dark:text-white">Срочный</span>
							</label>
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
							onclick={handleCancel}
							disabled={isLoading}
							class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
						>
							Отмена
						</button>
						<button
							type="submit"
							onclick={handleSubmit}
							disabled={isLoading || !isFormValid}
							class="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-gray-900"
						>
							{#if isLoading}
								<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"
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
								>
							{/if}
							{isLoading ? 'Сохранение...' : 'Создать'}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
