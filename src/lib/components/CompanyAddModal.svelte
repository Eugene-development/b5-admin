<script>
	import { onMount } from 'svelte';

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
	 */
	let { isOpen = false, onSave, onCancel, isLoading = false } = $props();

	let modalElement = $state();
	let firstInputElement = $state();
	let previousActiveElement;

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
			const companyData = {
				name: formData.name.trim(),
				legal_name: formData.legal_name.trim(),
				inn: formData.inn.trim(),
				region: formData.region.trim() || null
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
						Добавить компанию
					</h3>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Заполните информацию о новой компании
					</p>
				</div>

				<!-- Form -->
				<form onsubmit={handleSubmit} class="space-y-6">
					<!-- Company Name -->
					<div>
						<label
							for="company-name"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
							aria-describedby={errors.name ? 'company-name-error' : undefined}
							aria-invalid={errors.name ? 'true' : 'false'}
						/>
						{#if errors.name}
							<p id="company-name-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
								{errors.name}
							</p>
						{/if}
					</div>

					<!-- Legal Name -->
					<div>
						<label
							for="legal-name"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
							aria-describedby={errors.legal_name ? 'legal-name-error' : undefined}
							aria-invalid={errors.legal_name ? 'true' : 'false'}
						/>
						{#if errors.legal_name}
							<p id="legal-name-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
								{errors.legal_name}
							</p>
						{/if}
					</div>

					<!-- INN and Region -->
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div>
							<label
								for="inn"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
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
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
								aria-describedby={errors.inn ? 'inn-error' : undefined}
								aria-invalid={errors.inn ? 'true' : 'false'}
							/>
							{#if errors.inn}
								<p id="inn-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
									{errors.inn}
								</p>
							{/if}
						</div>

						<div>
							<label
								for="region"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Регион
							</label>
							<input
								type="text"
								id="region"
								value={formData.region}
								oninput={(e) => handleInputChange('region', e.target.value)}
								disabled={isLoading}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
							/>
						</div>
					</div>

					<!-- Phone and Contact Person -->
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div>
							<label
								for="phone"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Телефон
							</label>
							<input
								type="tel"
								id="phone"
								value={formData.phone}
								oninput={(e) => handleInputChange('phone', e.target.value)}
								disabled={isLoading}
								placeholder="+7 (999) 123-45-67"
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
								aria-describedby={errors.phone ? 'phone-error' : undefined}
								aria-invalid={errors.phone ? 'true' : 'false'}
							/>
							{#if errors.phone}
								<p id="phone-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
									{errors.phone}
								</p>
							{/if}
						</div>

						<div>
							<label
								for="phone-contact"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
							/>
						</div>
					</div>

					<!-- Email and Contact Person -->
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div>
							<label
								for="email"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Рабочая почта
							</label>
							<input
								type="email"
								id="email"
								value={formData.email}
								oninput={(e) => handleInputChange('email', e.target.value)}
								disabled={isLoading}
								placeholder="company@example.com"
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
								aria-describedby={errors.email ? 'email-error' : undefined}
								aria-invalid={errors.email ? 'true' : 'false'}
							/>
							{#if errors.email}
								<p id="email-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
									{errors.email}
								</p>
							{/if}
						</div>

						<div>
							<label
								for="email-contact"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
							/>
						</div>
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
							{isLoading ? 'Сохранение...' : 'Добавить компанию'}
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
