<script>
	import { onMount } from 'svelte';
	import { getCompanyStatuses } from '$lib/api/companies.js';

	/**
	 * CompanyEditModal Component
	 *
	 * A modal component for editing company information.
	 * Provides form validation, loading states, and proper accessibility.
	 */
	let { isOpen = false, company = null, onSave, onCancel, isLoading = false } = $props();

	let modalElement = $state();
	let firstInputElement = $state();
	let previousActiveElement;

	// Company statuses
	let companyStatuses = $state([]);
	let isLoadingStatuses = $state(false);

	// Form data state
	let formData = $state({
		name: '',
		legal_name: '',
		inn: '',
		region: '',
		status_id: ''
	});

	// Form validation state
	let errors = $state({});
	let isFormValid = $derived(
		formData.name.trim() !== '' &&
			formData.legal_name.trim() !== '' &&
			formData.inn.trim() !== '' &&
			Object.keys(errors).length === 0
	);

	// Load company statuses
	async function loadCompanyStatuses() {
		isLoadingStatuses = true;
		try {
			companyStatuses = await getCompanyStatuses();
		} catch (error) {
			console.error('Failed to load company statuses:', error);
		} finally {
			isLoadingStatuses = false;
		}
	}

	// Initialize form data when company changes
	$effect(() => {
		if (company && isOpen) {
			formData = {
				name: company.name || '',
				legal_name: company.legal_name || '',
				inn: company.inn || '',
				region: company.region || '',
				status_id: company.status_id || ''
			};
			errors = {};

			if (companyStatuses.length === 0) {
				loadCompanyStatuses();
			}
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
			const updatedData = {
				id: company.id,
				name: formData.name.trim(),
				legal_name: formData.legal_name.trim(),
				inn: formData.inn.trim(),
				region: formData.region.trim() || null,
				status_id: formData.status_id || null,
				ban: company.ban,
				is_active: company.is_active
			};
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
			case 'name':
				if (!value.trim()) newErrors.name = 'Название компании обязательно';
				else delete newErrors.name;
				break;
			case 'legal_name':
				if (!value.trim()) newErrors.legal_name = 'Официальное название обязательно';
				else delete newErrors.legal_name;
				break;
			case 'inn':
				const innValue = value.trim();
				if (!innValue) newErrors.inn = 'ИНН обязателен';
				else if (!/^\d{10}$|^\d{12}$/.test(innValue)) newErrors.inn = 'ИНН должен содержать 10 или 12 цифр';
				else delete newErrors.inn;
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

{#if isOpen && company}
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
				<div class="relative overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 px-6 py-5">
					<div class="absolute inset-0 bg-grid-white/10"></div>
					<div class="relative flex items-start justify-between">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
								<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
								</svg>
							</div>
							<div>
								<h2 class="text-xl font-bold text-white">Редактировать компанию</h2>
								<p class="mt-0.5 text-sm text-indigo-100">Обновите информацию о компании "{company.name}"</p>
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
						<!-- Company Name -->
						<div>
							<label for="company-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Название компании <span class="text-red-500">*</span>
							</label>
							<input
								bind:this={firstInputElement}
								type="text"
								id="company-name"
								value={formData.name}
								oninput={(e) => handleInputChange('name', e.target.value)}
								disabled={isLoading}
								required
								class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
							/>
							{#if errors.name}<p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>{/if}
						</div>

						<!-- Legal Name -->
						<div>
							<label for="legal-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Официальное название <span class="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="legal-name"
								value={formData.legal_name}
								oninput={(e) => handleInputChange('legal_name', e.target.value)}
								disabled={isLoading}
								required
								class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
							/>
							{#if errors.legal_name}<p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.legal_name}</p>{/if}
						</div>

						<!-- INN and Region -->
						<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
							<div>
								<label for="inn" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
									ИНН <span class="text-red-500">*</span>
								</label>
								<input
									type="text"
									id="inn"
									value={formData.inn}
									oninput={(e) => handleInputChange('inn', e.target.value)}
									disabled={isLoading}
									required
									maxlength="12"
									placeholder="10 или 12 цифр"
									class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
								/>
								{#if errors.inn}<p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.inn}</p>{/if}
							</div>

							<div>
								<label for="region" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
									Регион
								</label>
								<input
									type="text"
									id="region"
									value={formData.region}
									oninput={(e) => handleInputChange('region', e.target.value)}
									disabled={isLoading}
									class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
								/>
							</div>
						</div>

						<!-- Company Status -->
						<div>
							<label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Статус компании
							</label>
							<select
								id="status"
								value={formData.status_id}
								onchange={(e) => handleInputChange('status_id', e.target.value)}
								disabled={isLoading || isLoadingStatuses}
								class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
							>
								<option value="">Выберите статус</option>
								{#each companyStatuses as status}
									<option value={status.id}>{status.value}</option>
								{/each}
							</select>
						</div>
					</div>
				</form>

				<!-- Footer -->
				<div class="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
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
								<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							{/if}
							{isLoading ? 'Сохранение...' : 'Сохранить изменения'}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
