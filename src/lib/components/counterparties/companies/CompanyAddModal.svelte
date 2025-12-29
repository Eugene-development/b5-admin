<script>
	import { onMount } from 'svelte';
	import { getCompanyStatuses } from '$lib/api/companies.js';

	/**
	 * CompanyAddModal Component
	 *
	 * A modal component for adding new companies with phones and emails.
	 * Provides form validation, loading states, and proper accessibility.
	 *
	 * @param {boolean} isOpen - Controls modal visibility
	 * @param {Function} onSave - Callback function for saving new company
	 * @param {Function} onCancel - Callback function for cancellation
	 * @param {boolean} [isLoading=false] - Loading state for save button
	 * @param {string} [slug=''] - Page slug to determine company status
	 */
	let { isOpen = false, onSave, onCancel, isLoading = false, slug = '' } = $props();

	let modalElement = $state();
	let firstInputElement = $state();
	let previousActiveElement;

	// Company statuses state
	let companyStatuses = $state([]);
	let statusId = $state(null);
	let isLoadingStatuses = $state(false);

	// Form data state
	let formData = $state({
		name: '',
		legal_name: '',
		inn: '',
		region: '',
		phone: '',
		phone_contact: '',
		email: '',
		email_contact: ''
	});

	// Form validation state
	let errors = $state({});
	let isFormValid = $derived(
		formData.name.trim() !== '' &&
			formData.legal_name.trim() !== '' &&
			formData.inn.trim() !== '' &&
			Object.keys(errors).length === 0
	);

	// Load company statuses and find status_id by slug
	async function loadCompanyStatuses() {
		if (companyStatuses.length === 0) {
			isLoadingStatuses = true;
			try {
				const statuses = await getCompanyStatuses();
				companyStatuses = statuses;
			} catch (error) {
				console.error('Failed to load company statuses:', error);
			} finally {
				isLoadingStatuses = false;
			}
		}
	}

	// Find status_id based on slug
	$effect(() => {
		if (slug && companyStatuses.length > 0) {
			const status = companyStatuses.find((s) => s.slug === slug);
			if (status) {
				statusId = status.id;
				console.log(`Found status_id for slug "${slug}":`, statusId);
			} else {
				console.warn(`No status found for slug "${slug}", will use default`);
				const defaultStatus = companyStatuses.find((s) => s.is_default);
				statusId = defaultStatus?.id || null;
			}
		}
	});

	// Reset form when modal opens
	$effect(() => {
		if (isOpen) {
			formData = {
				name: '',
				legal_name: '',
				inn: '',
				region: '',
				phone: '',
				phone_contact: '',
				email: '',
				email_contact: ''
			};
			errors = {};

			// Load statuses when modal opens
			loadCompanyStatuses();
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
			const companyData = {
				name: formData.name.trim(),
				legal_name: formData.legal_name.trim(),
				inn: formData.inn.trim(),
				region: formData.region.trim() || null,
				status_id: statusId
			};

			const phoneData = formData.phone.trim()
				? {
						value: formData.phone.trim(),
						contact_person: formData.phone_contact.trim() || null,
						is_primary: true
					}
				: null;

			const emailData = formData.email.trim()
				? {
						value: formData.email.trim(),
						contact_person: formData.email_contact.trim() || null,
						is_primary: true
					}
				: null;

			onSave({ company: companyData, phone: phoneData, email: emailData });
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
					newErrors.name = 'Название компании обязательно';
				} else {
					delete newErrors.name;
				}
				break;
			}
			case 'legal_name': {
				if (!value.trim()) {
					newErrors.legal_name = 'Официальное название обязательно';
				} else {
					delete newErrors.legal_name;
				}
				break;
			}
			case 'inn': {
				const innValue = value.trim();
				if (!innValue) {
					newErrors.inn = 'ИНН обязателен';
				} else if (!/^\d{10}$|^\d{12}$/.test(innValue)) {
					newErrors.inn = 'ИНН должен содержать 10 или 12 цифр';
				} else {
					delete newErrors.inn;
				}
				break;
			}
			case 'email': {
				const emailValue = value.trim();
				if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
					newErrors.email = 'Некорректный формат email';
				} else {
					delete newErrors.email;
				}
				break;
			}
			case 'phone': {
				const phoneValue = value.trim();
				if (phoneValue && !/^[\d\s\+\-\(\)]+$/.test(phoneValue)) {
					newErrors.phone = 'Некорректный формат телефона';
				} else {
					delete newErrors.phone;
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
{#if isOpen}
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
				class="relative w-full transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:max-w-2xl dark:bg-gray-900"
				onkeydown={handleTabKey}
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
				tabindex="-1"
			>
				<!-- Modal Header with gradient -->
				<div class="relative bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6">
					<div class="flex items-start justify-between">
						<div class="flex items-center space-x-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
								<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
								</svg>
							</div>
							<div>
								<h3
									class="text-xl font-bold text-white"
									id="modal-title"
								>
									Добавить компанию
								</h3>
								<p class="mt-1 text-sm text-indigo-100">
									Заполните информацию о новой компании
								</p>
							</div>
						</div>
						<button
							type="button"
							onclick={handleCancel}
							disabled={isLoading}
							class="rounded-lg p-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50"
							aria-label="Закрыть"
						>
							<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				<!-- Form -->
				<form onsubmit={handleSubmit} class="max-h-[60vh] space-y-5 overflow-y-auto bg-gray-50 px-6 py-6 dark:bg-gray-800">
					<!-- Company Name -->
					<div>
						<label
							for="company-name"
							class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
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
							class="block w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
							aria-describedby={errors.name ? 'company-name-error' : undefined}
							aria-invalid={errors.name ? 'true' : 'false'}
						/>
						{#if errors.name}
							<p id="company-name-error" class="mt-1.5 text-sm text-red-600 dark:text-red-400">
								{errors.name}
							</p>
						{/if}
					</div>

					<!-- Legal Name -->
					<div>
						<label
							for="legal-name"
							class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Официальное название <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="legal-name"
							value={formData.legal_name}
							oninput={(e) => handleInputChange('legal_name', e.target.value)}
							disabled={isLoading}
							required
							class="block w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
							aria-describedby={errors.legal_name ? 'legal-name-error' : undefined}
							aria-invalid={errors.legal_name ? 'true' : 'false'}
						/>
						{#if errors.legal_name}
							<p id="legal-name-error" class="mt-1.5 text-sm text-red-600 dark:text-red-400">
								{errors.legal_name}
							</p>
						{/if}
					</div>

					<!-- INN and Region -->
					<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<div>
							<label for="inn" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
								class="block w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
								aria-describedby={errors.inn ? 'inn-error' : 'inn-help'}
								aria-invalid={errors.inn ? 'true' : 'false'}
							/>
							{#if errors.inn}
								<p id="inn-error" class="mt-1.5 text-sm text-red-600 dark:text-red-400">
									{errors.inn}
								</p>
							{:else}
								<p id="inn-help" class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
									ИНН должен быть уникальным
								</p>
							{/if}
						</div>

						<div>
							<label
								for="region"
								class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Регион
							</label>
							<input
								type="text"
								id="region"
								value={formData.region}
								oninput={(e) => handleInputChange('region', e.target.value)}
								disabled={isLoading}
								class="block w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
							/>
						</div>
					</div>

					<!-- Phone and Contact Person -->
					<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<div>
							<label for="phone" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
								Телефон
							</label>
							<input
								type="tel"
								id="phone"
								value={formData.phone}
								oninput={(e) => handleInputChange('phone', e.target.value)}
								disabled={isLoading}
								placeholder="+7 (999) 123-45-67"
								class="block w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
								aria-describedby={errors.phone ? 'phone-error' : undefined}
								aria-invalid={errors.phone ? 'true' : 'false'}
							/>
							{#if errors.phone}
								<p id="phone-error" class="mt-1.5 text-sm text-red-600 dark:text-red-400">
									{errors.phone}
								</p>
							{/if}
						</div>

						<div>
							<label
								for="phone-contact"
								class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Контактное лицо (телефон)
							</label>
							<input
								type="text"
								id="phone-contact"
								value={formData.phone_contact}
								oninput={(e) => handleInputChange('phone_contact', e.target.value)}
								disabled={isLoading}
								placeholder="Иванов Иван"
								class="block w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
							/>
						</div>
					</div>

					<!-- Email and Contact Person -->
					<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<div>
							<label for="email" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
								Рабочая почта
							</label>
							<input
								type="email"
								id="email"
								value={formData.email}
								oninput={(e) => handleInputChange('email', e.target.value)}
								disabled={isLoading}
								placeholder="company@example.com"
								class="block w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
								aria-describedby={errors.email ? 'email-error' : undefined}
								aria-invalid={errors.email ? 'true' : 'false'}
							/>
							{#if errors.email}
								<p id="email-error" class="mt-1.5 text-sm text-red-600 dark:text-red-400">
									{errors.email}
								</p>
							{/if}
						</div>

						<div>
							<label
								for="email-contact"
								class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Контактное лицо (email)
							</label>
							<input
								type="text"
								id="email-contact"
								value={formData.email_contact}
								oninput={(e) => handleInputChange('email_contact', e.target.value)}
								disabled={isLoading}
								placeholder="Петров Петр"
								class="block w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
							/>
						</div>
					</div>

				</form>

				<!-- Action buttons - outside form, in footer -->
				<div class="bg-gray-100 px-6 py-4 dark:bg-gray-900">
					<div
						class="flex flex-col space-y-3 sm:flex-row-reverse sm:space-y-0 sm:space-x-3 sm:space-x-reverse"
					>
						<!-- Save button -->
						<button
							type="submit"
							onclick={handleSubmit}
							disabled={isLoading || !isFormValid}
							class="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-indigo-500 hover:to-purple-500 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:w-auto"
						>
							{#if isLoading}
								<svg
									class="mr-2 h-5 w-5 animate-spin"
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
							{isLoading ? 'Сохранение...' : 'Добавить компанию'}
						</button>

						<!-- Cancel button -->
						<button
							type="button"
							onclick={handleCancel}
							disabled={isLoading}
							class="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border-2 border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:w-auto dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-700"
						>
							Отмена
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
