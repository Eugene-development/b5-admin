<script>
	let { isOpen = false, action = null, onSave, onCancel, isLoading = false, companies = [] } = $props();

	let modalElement = $state();
	let firstInputElement = $state();
	let previousActiveElement;

	let formData = $state({
		id: '',
		name: '',
		description: '',
		start: '',
		end: '',
		company_id: '',
		is_active: false
	});

	let errors = $state({});
	let isFormValid = $derived(
		formData.name.trim() !== '' &&
			formData.description.trim() !== '' &&
			formData.company_id !== '' &&
			Object.keys(errors).length === 0
	);

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
			onSave({
				id: formData.id,
				name: formData.name.trim(),
				description: formData.description.trim(),
				start: formData.start,
				end: formData.end,
				company_id: formData.company_id,
				is_active: formData.is_active
			});
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
			case 'name':
				if (!value.trim()) newErrors.name = 'Название акции обязательно';
				else delete newErrors.name;
				break;
			case 'description':
				if (!value.trim()) newErrors.description = 'Описание акции обязательно';
				else delete newErrors.description;
				break;
			case 'start':
				delete newErrors.start;
				if (value && formData.end && value > formData.end) newErrors.end = 'Дата окончания должна быть позже даты начала';
				else if (formData.end) delete newErrors.end;
				break;
			case 'end':
				delete newErrors.end;
				if (value && formData.start && value < formData.start) newErrors.end = 'Дата окончания должна быть позже даты начала';
				break;
			case 'company_id':
				if (!value) newErrors.company_id = 'Выберите компанию';
				else delete newErrors.company_id;
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

{#if isOpen && action}
	<div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
		<div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onclick={handleBackdropClick} aria-hidden="true"></div>

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
				<div class="relative overflow-hidden bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 px-6 py-5">
					<div class="absolute inset-0 bg-grid-white/10"></div>
					<div class="relative flex items-start justify-between">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
								<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
								</svg>
							</div>
							<div>
								<h2 class="text-xl font-bold text-white">Редактировать акцию</h2>
								<p class="mt-0.5 text-sm text-amber-100">Обновите информацию об акции</p>
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
						<!-- Action Name -->
						<div>
							<label for="action-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Название акции <span class="text-red-500">*</span></label>
							<input bind:this={firstInputElement} type="text" id="action-name" value={formData.name} oninput={(e) => handleInputChange('name', e.target.value)} disabled={isLoading} required class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
							{#if errors.name}<p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>{/if}
						</div>

						<!-- Description -->
						<div>
							<label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Описание <span class="text-red-500">*</span></label>
							<textarea id="description" value={formData.description} oninput={(e) => handleInputChange('description', e.target.value)} disabled={isLoading} required rows="4" class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"></textarea>
							{#if errors.description}<p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>{/if}
						</div>

						<!-- Company Selection -->
						<div>
							<label for="company" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Компания-поставщик <span class="text-red-500">*</span></label>
							<select id="company" value={formData.company_id} onchange={(e) => handleInputChange('company_id', e.target.value)} disabled={isLoading} required class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
								<option value="">Выберите компанию</option>
								{#each companies as company}<option value={company.id}>{company.name}</option>{/each}
							</select>
							{#if errors.company_id}<p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.company_id}</p>{/if}
						</div>

						<!-- Dates -->
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label for="start-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Дата начала</label>
								<input type="date" id="start-date" value={formData.start} oninput={(e) => handleInputChange('start', e.target.value)} disabled={isLoading} class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
								{#if errors.start}<p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.start}</p>{/if}
							</div>
							<div>
								<label for="end-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Дата окончания</label>
								<input type="date" id="end-date" value={formData.end} oninput={(e) => handleInputChange('end', e.target.value)} disabled={isLoading} class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
								{#if errors.end}<p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.end}</p>{/if}
							</div>
						</div>

						<!-- Active Status -->
						<div class="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
							<input type="checkbox" id="is-active" checked={formData.is_active} onchange={(e) => handleInputChange('is_active', e.target.checked)} disabled={isLoading} class="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700" />
							<label for="is-active" class="text-sm font-medium text-gray-900 dark:text-white">Акция активна</label>
						</div>
					</div>
				</form>

				<!-- Footer -->
				<div class="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
					<div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
						<button type="button" onclick={handleCancel} disabled={isLoading} class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
							Отмена
						</button>
						<button type="submit" onclick={handleSubmit} disabled={isLoading || !isFormValid} class="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-gray-900">
							{#if isLoading}
								<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
							{/if}
							{isLoading ? 'Сохранение...' : 'Сохранить'}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
