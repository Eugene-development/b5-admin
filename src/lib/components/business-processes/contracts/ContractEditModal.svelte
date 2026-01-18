<script>
	import { getAllProjects } from '$lib/api/projects.js';
	import { refreshCompanies } from '$lib/api/companies.js';
	import { authState } from '$lib/state/auth.svelte.js';

	let { isOpen = false, contract = null, onSave, onCancel, isLoading = false } = $props();

	const isAdmin = $derived(authState.user?.type === 'Админ');

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
		factory_contract_number: '', // Номер договора от фабрики (поле value в БД)
		comment: '',
		commentId: null,
		contract_date: '',
		planned_completion_date: '',
		actual_completion_date: '',
		contract_amount: '',
		agent_percentage: '',
		curator_percentage: '',
		is_active: true,
		is_urgent: false
	});

	let errors = $state({});
	let isFormValid = $derived(
		formData.project_id &&
			formData.company_id &&
			formData.contract_date &&
			formData.planned_completion_date &&
			Object.keys(errors).length === 0
	);

	let calculatedAgentBonus = $derived(() => {
		const amount = parseFloat(formData.contract_amount) || 0;
		const percentage = parseFloat(formData.agent_percentage) || 0;
		return Math.round((amount * percentage) / 100);
	});

	let calculatedCuratorBonus = $derived(() => {
		const amount = parseFloat(formData.contract_amount) || 0;
		const percentage = parseFloat(formData.curator_percentage) || 0;
		return Math.round((amount * percentage) / 100);
	});

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
		if (contract && isOpen) {
			loadOptions();
			// Получаем первый комментарий (если есть)
			const firstComment = contract.comments?.[0];
			formData = {
				project_id: contract.project_id || '',
				company_id: contract.company_id || '',
				factory_contract_number: contract.value || '', // Номер договора от фабрики (поле value)
				comment: firstComment?.value || '',
				commentId: firstComment?.id || null,
				contract_date: contract.contract_date ? contract.contract_date.split('T')[0] : '',
				planned_completion_date: contract.planned_completion_date
					? contract.planned_completion_date.split('T')[0]
					: '',
				actual_completion_date: contract.actual_completion_date
					? contract.actual_completion_date.split('T')[0]
					: '',
				contract_amount: contract.contract_amount || '',
				agent_percentage: contract.agent_percentage || '',
				curator_percentage: contract.curator_percentage || '',
				is_active: contract.is_active ?? true,
				is_urgent: contract.is_urgent ?? false
			};
			errors = {};
		}
	});

	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen && !isLoading) {
			handleCancel();
		}
	}

	function handleBackdropClick(event) {
		if (event.target === event.currentTarget && !isLoading) {
			handleCancel();
		}
	}

	function handleSubmit(event) {
		event.preventDefault();
		if (isFormValid && !isLoading) {
			handleSave();
		}
	}

	function handleSave() {
		if (onSave && !isLoading && isFormValid) {
			const contractData = {
				id: contract.id,
				project_id: formData.project_id,
				company_id: formData.company_id,
				contract_date: formData.contract_date,
				planned_completion_date: formData.planned_completion_date,
				is_active: formData.is_active,
				is_urgent: formData.is_urgent
			};

			if (formData.contract_amount !== '' && formData.contract_amount !== null) {
				contractData.contract_amount = parseFloat(formData.contract_amount);
			}
			if (formData.agent_percentage !== '' && formData.agent_percentage !== null) {
				contractData.agent_percentage = parseFloat(formData.agent_percentage);
			}
			if (formData.curator_percentage !== '' && formData.curator_percentage !== null) {
				contractData.curator_percentage = parseFloat(formData.curator_percentage);
			}
			// Номер договора от фабрики записываем в поле value
			if (formData.factory_contract_number.trim()) {
				contractData.value = formData.factory_contract_number.trim();
			}
			if (formData.actual_completion_date) {
				contractData.actual_completion_date = formData.actual_completion_date;
			}

			// Передаём данные комментария отдельно
			const commentData = {
				value: formData.comment.trim() || null,
				commentId: formData.commentId
			};

			onSave(contractData, commentData);
		}
	}

	function handleCancel() {
		if (onCancel && !isLoading) {
			onCancel();
		}
	}

	function validateField(field, value) {
		const newErrors = { ...errors };

		switch (field) {
			case 'project_id':
				if (!value) newErrors.project_id = 'Выберите проект';
				else delete newErrors.project_id;
				break;
			case 'company_id':
				if (!value) newErrors.company_id = 'Выберите компанию';
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
				if (value !== '' && value !== null) {
					const num = parseFloat(value);
					if (isNaN(num) || num < 0)
						newErrors.contract_amount = 'Сумма должна быть положительным числом';
					else delete newErrors.contract_amount;
				} else delete newErrors.contract_amount;
				break;
			case 'agent_percentage':
			case 'curator_percentage':
				if (value !== '' && value !== null) {
					const num = parseFloat(value);
					if (isNaN(num) || num < 0 || num > 100)
						newErrors[field] = 'Процент должен быть от 0 до 100';
					else delete newErrors[field];
				} else delete newErrors[field];
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

	function formatCurrency(amount) {
		return new Intl.NumberFormat('ru-RU', {
			style: 'currency',
			currency: 'RUB',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}
</script>

{#if isOpen && contract}
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
				class="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-gray-900"
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
								<h2 class="text-xl font-bold text-white">Редактирование договора</h2>
								<p class="mt-0.5 text-sm text-indigo-100">
									{contract.contract_number || 'Новый договор'}
								</p>
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
					<div class="grid gap-6 lg:grid-cols-2">
						<!-- Left Column -->
						<div class="space-y-5">
							<!-- Project Selection -->
							<div>
								<label
									for="project-select"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
									>Проект <span class="text-red-500">*</span></label
								>
								<select
									bind:this={firstInputElement}
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

							<!-- Company Selection -->
							<div>
								<label
									for="company-select"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
									>Компания <span class="text-red-500">*</span></label
								>
								<select
									id="company-select"
									value={formData.company_id}
									onchange={(e) => handleInputChange('company_id', e.target.value)}
									disabled={isLoading || isLoadingCompanies}
									class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									required
								>
									<option value="">Выберите компанию</option>
									{#each companies as company}<option value={company.id}>{company.name}</option
										>{/each}
								</select>
								{#if errors.company_id}<p class="mt-1 text-sm text-red-600 dark:text-red-400">
										{errors.company_id}
									</p>{/if}
							</div>

							<!-- Factory Contract Number (номер договора от фабрики) -->
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

						<!-- Right Column -->
						<div class="space-y-5">
							<!-- Dates -->
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label
										for="contract-date"
										class="block text-sm font-medium text-gray-700 dark:text-gray-300"
										>Дата договора <span class="text-red-500">*</span></label
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

							<!-- Actual Completion Date -->
							<div>
								<label
									for="actual-date"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
									>Факт. завершение</label
								>
								<input
									type="date"
									id="actual-date"
									value={formData.actual_completion_date}
									oninput={(e) => handleInputChange('actual_completion_date', e.target.value)}
									disabled={isLoading}
									class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
								/>
							</div>
						</div>
					</div>

					<!-- Bonus Fields (Admin only) -->
					{#if isAdmin}
						<div
							class="mt-6 rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-5 dark:border-indigo-800 dark:from-indigo-900/30 dark:to-purple-900/30"
						>
							<h3
								class="mb-4 flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300"
							>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								Бонусы агента и куратора
							</h3>
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
								<div>
									<label
										for="contract-amount"
										class="block text-sm font-medium text-gray-700 dark:text-gray-300"
										>Сумма (₽)</label
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
									/>
									{#if errors.contract_amount}<p
											class="mt-1 text-sm text-red-600 dark:text-red-400"
										>
											{errors.contract_amount}
										</p>{/if}
								</div>
								<div>
									<label
										for="agent-percentage"
										class="block text-sm font-medium text-gray-700 dark:text-gray-300"
										>% агента</label
									>
									<input
										type="number"
										id="agent-percentage"
										min="0"
										max="100"
										step="0.01"
										value={formData.agent_percentage}
										oninput={(e) => handleInputChange('agent_percentage', e.target.value)}
										disabled={isLoading}
										class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
									{#if errors.agent_percentage}<p
											class="mt-1 text-sm text-red-600 dark:text-red-400"
										>
											{errors.agent_percentage}
										</p>{/if}
								</div>
								<div>
									<label
										for="curator-percentage"
										class="block text-sm font-medium text-gray-700 dark:text-gray-300"
										>% куратора</label
									>
									<input
										type="number"
										id="curator-percentage"
										min="0"
										max="100"
										step="0.01"
										value={formData.curator_percentage}
										oninput={(e) => handleInputChange('curator_percentage', e.target.value)}
										disabled={isLoading}
										class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
									{#if errors.curator_percentage}<p
											class="mt-1 text-sm text-red-600 dark:text-red-400"
										>
											{errors.curator_percentage}
										</p>{/if}
								</div>
							</div>
							{#if calculatedAgentBonus() > 0 || calculatedCuratorBonus() > 0}
								<div
									class="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-white/60 p-3 dark:bg-gray-800/60"
								>
									<div>
										<span class="text-xs text-gray-500 dark:text-gray-400">Бонус агента:</span>
										<span class="ml-2 font-semibold text-emerald-600 dark:text-emerald-400"
											>{formatCurrency(calculatedAgentBonus())}</span
										>
									</div>
									<div>
										<span class="text-xs text-gray-500 dark:text-gray-400">Бонус куратора:</span>
										<span class="ml-2 font-semibold text-emerald-600 dark:text-emerald-400"
											>{formatCurrency(calculatedCuratorBonus())}</span
										>
									</div>
								</div>
							{/if}
							{#if !formData.is_active}
								<p
									class="mt-3 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400"
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
										/></svg
									>
									Договор неактивен — бонусы не начисляются
								</p>
							{/if}
						</div>
					{/if}
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
							{isLoading ? 'Сохранение...' : 'Сохранить'}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
