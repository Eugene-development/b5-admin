<script>
	/**
	 * ProjectEditModal Component
	 *
	 * A modal component for editing project information.
	 * Provides form validation, loading states, and proper accessibility.
	 */
	let {
		isOpen = false,
		project = null,
		projectStatuses = [],
		isLoadingStatuses = false,
		onSave,
		onCancel,
		isLoading = false
	} = $props();

	let modalElement = $state();
	let firstInputElement = $state();
	let previousActiveElement;

	let formData = $state({
		name: '',
		status_id: '',
		region: '',
		description: '',
		contract_number: '',
		contract_date: '',
		contract_amount: '',
		agent_rate: '',
		agent_rate_type: 'percentage',
		planned_completion: ''
	});

	let errors = $state({});
	let isFormValid = $derived(Object.keys(errors).length === 0);

	$effect(() => {
		if (project && isOpen) {
			formData = {
				name: project.value || '',
				status_id: project.status_id || '',
				region: project.region || '',
				description: project.description || '',
				contract_number: project.contract_name || '',
				contract_date: project.contract_date ? project.contract_date.split('T')[0] : '',
				contract_amount: project.contract_amount || '',
				agent_rate: project.agent_percentage || '',
				agent_rate_type: 'percentage',
				planned_completion: project.planned_completion_date ? project.planned_completion_date.split('T')[0] : ''
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
			const updatedData = { id: project.id };

			const nameTrimmed = (formData.name || '').trim();
			if (nameTrimmed !== '') updatedData.value = nameTrimmed;

			if (formData.status_id) updatedData.status_id = formData.status_id;

			const regionTrimmed = (formData.region || '').trim();
			if (regionTrimmed !== '') updatedData.region = regionTrimmed;

			const descriptionTrimmed = (formData.description || '').trim();
			if (descriptionTrimmed !== '') updatedData.description = descriptionTrimmed;

			const contractNumberTrimmed = (formData.contract_number || '').trim();
			if (contractNumberTrimmed !== '') updatedData.contract_name = contractNumberTrimmed;

			if (formData.contract_date) updatedData.contract_date = formData.contract_date;

			if (formData.contract_amount !== '' && formData.contract_amount !== null && formData.contract_amount !== undefined) {
				const amount = parseFloat(formData.contract_amount);
				if (!isNaN(amount) && amount > 0) updatedData.contract_amount = amount;
			}

			if (formData.agent_rate !== '' && formData.agent_rate !== null && formData.agent_rate !== undefined) {
				const rate = parseFloat(formData.agent_rate);
				if (!isNaN(rate) && rate > 0) updatedData.agent_percentage = rate;
			}

			if (formData.planned_completion) updatedData.planned_completion_date = formData.planned_completion;

			onSave(updatedData);
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
			case 'contract_amount':
				if (value === '' || value === null || value === undefined) delete newErrors.contract_amount;
				else if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) newErrors.contract_amount = 'Сумма договора должна быть положительным числом';
				else delete newErrors.contract_amount;
				break;
			case 'agent_rate':
				if (value === '' || value === null || value === undefined) delete newErrors.agent_rate;
				else if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) newErrors.agent_rate = 'Ставка агенту должна быть положительным числом';
				else delete newErrors.agent_rate;
				break;
			default:
				if (field in newErrors) delete newErrors[field];
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
			setTimeout(() => { if (firstInputElement) firstInputElement.focus(); }, 100);
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
		const focusableElements = modalElement?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
		if (!focusableElements || focusableElements.length === 0) return;
		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];
		if (event.key === 'Tab') {
			if (event.shiftKey) {
				if (document.activeElement === firstElement) { event.preventDefault(); lastElement.focus(); }
			} else {
				if (document.activeElement === lastElement) { event.preventDefault(); firstElement.focus(); }
			}
		}
	}
</script>

{#if isOpen && project}
	<div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
		<div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onclick={handleBackdropClick} aria-hidden="true"></div>

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
				<div class="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-5">
					<div class="absolute inset-0 bg-grid-white/10"></div>
					<div class="relative flex items-start justify-between">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
								<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
								</svg>
							</div>
							<div>
								<h2 class="text-xl font-bold text-white">Редактировать проект</h2>
								<p class="mt-0.5 text-sm text-emerald-100">Обновите информацию о проекте "{project.value}"</p>
							</div>
						</div>
						<button type="button" onclick={handleCancel} disabled={isLoading} aria-label="Закрыть" class="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white disabled:opacity-50">
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
						</button>
					</div>
				</div>

				<!-- Form Content -->
				<form onsubmit={handleSubmit} class="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
					<div class="space-y-5">
						<!-- Project Name -->
						<div>
							<label for="project-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Название проекта</label>
							<input bind:this={firstInputElement} type="text" id="project-name" value={formData.name} oninput={(e) => handleInputChange('name', e.target.value)} disabled={isLoading} class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
							{#if errors.name}<p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>{/if}
						</div>

						<!-- Project Status -->
						<div>
							<label for="project-status" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Статус проекта</label>
							<select id="project-status" value={formData.status_id} onchange={(e) => handleInputChange('status_id', e.target.value)} disabled={isLoading || isLoadingStatuses} class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
								<option value="">Выберите статус</option>
								{#each projectStatuses.filter((s) => s.is_active).sort((a, b) => a.sort_order - b.sort_order) as status}
									<option value={status.id}>{status.value}</option>
								{/each}
							</select>
						</div>

						<!-- Region -->
						<div>
							<label for="project-region" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Адрес объекта</label>
							<input type="text" id="project-region" value={formData.region} oninput={(e) => handleInputChange('region', e.target.value)} disabled={isLoading} class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
							{#if errors.region}<p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.region}</p>{/if}
						</div>

						<!-- Description -->
						<div>
							<label for="project-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Описание</label>
							<textarea id="project-description" rows="3" value={formData.description} oninput={(e) => handleInputChange('description', e.target.value)} disabled={isLoading} placeholder="Описание проекта (необязательно)" class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"></textarea>
						</div>

						<!-- Contract Number and Date -->
						<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
							<div>
								<label for="contract-number" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Номер договора</label>
								<input type="text" id="contract-number" value={formData.contract_number} oninput={(e) => handleInputChange('contract_number', e.target.value)} disabled={isLoading} class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
								{#if errors.contract_number}<p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contract_number}</p>{/if}
							</div>
							<div>
								<label for="contract-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Дата заключения договора</label>
								<input type="date" id="contract-date" value={formData.contract_date} oninput={(e) => handleInputChange('contract_date', e.target.value)} disabled={isLoading} class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
								{#if errors.contract_date}<p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contract_date}</p>{/if}
							</div>
						</div>

						<!-- Contract Amount and Agent Rate -->
						<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
							<div>
								<label for="contract-amount" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Сумма договора (₽)</label>
								<input type="number" id="contract-amount" min="0" step="0.01" value={formData.contract_amount} oninput={(e) => handleInputChange('contract_amount', e.target.value)} disabled={isLoading} class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
								{#if errors.contract_amount}<p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contract_amount}</p>{/if}
							</div>
							<div>
								<label for="agent-rate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Ставка агенту</label>
								<div class="mt-1.5 flex rounded-lg shadow-sm">
									<input type="number" id="agent-rate" min="0" step="0.01" value={formData.agent_rate} oninput={(e) => handleInputChange('agent_rate', e.target.value)} disabled={isLoading} class="block w-full rounded-none rounded-l-lg border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
									<select value={formData.agent_rate_type} onchange={(e) => handleInputChange('agent_rate_type', e.target.value)} disabled={isLoading} class="rounded-none rounded-r-lg border-l-0 border-gray-300 bg-gray-50 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
										<option value="percentage">%</option>
										<option value="fixed">₽</option>
									</select>
								</div>
								{#if errors.agent_rate}<p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.agent_rate}</p>{/if}
							</div>
						</div>

						<!-- Planned Completion -->
						<div>
							<label for="planned-completion" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Планируемое завершение</label>
							<input type="date" id="planned-completion" value={formData.planned_completion} oninput={(e) => handleInputChange('planned_completion', e.target.value)} disabled={isLoading} class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
							{#if errors.planned_completion}<p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.planned_completion}</p>{/if}
						</div>
					</div>
				</form>

				<!-- Footer -->
				<div class="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
					<div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
						<button type="button" onclick={handleCancel} disabled={isLoading} class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
							Отмена
						</button>
						<button type="submit" onclick={handleSubmit} disabled={isLoading || !isFormValid} class="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-gray-900">
							{#if isLoading}
								<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
							{/if}
							{isLoading ? 'Сохранение...' : 'Сохранить изменения'}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
