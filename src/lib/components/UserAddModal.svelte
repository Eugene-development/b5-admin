<script>
	import { onMount } from 'svelte';
	import { getUserStatuses } from '$lib/api/agents.js';

	/**
	 * UserAddModal Component
	 *
	 * A modal component for adding new users with automatic status assignment.
	 * Provides form validation, loading states, and proper accessibility.
	 *
	 * @param {boolean} isOpen - Controls modal visibility
	 * @param {Function} onSave - Callback function for saving new user
	 * @param {Function} onCancel - Callback function for cancellation
	 * @param {boolean} [isLoading=false] - Loading state for save button
	 * @param {string} [statusSlug=''] - Status slug to determine user role (agents, curators, managers, designers)
	 */
	let { isOpen = false, onSave, onCancel, isLoading = false, statusSlug = '' } = $props();

	let modalElement = $state();
	let firstInputElement = $state();
	let previousActiveElement;

	// User statuses state
	let userStatuses = $state([]);
	let statusId = $state(null);
	let isLoadingStatuses = $state(false);

	// Form data state
	let formData = $state({
		name: '',
		email: '',
		password: '',
		password_confirmation: '',
		region: ''
	});

	// Form validation state
	let errors = $state({});
	let isFormValid = $derived(
		formData.name.trim() !== '' &&
			formData.email.trim() !== '' &&
			formData.password.trim() !== '' &&
			formData.password_confirmation.trim() !== '' &&
			formData.password === formData.password_confirmation &&
			Object.keys(errors).length === 0
	);

	// Load user statuses and find status_id by slug
	async function loadUserStatuses() {
		if (userStatuses.length === 0) {
			isLoadingStatuses = true;
			try {
				const statuses = await getUserStatuses();
				userStatuses = statuses;
			} catch (error) {
				console.error('Failed to load user statuses:', error);
			} finally {
				isLoadingStatuses = false;
			}
		}
	}

	// Find status_id based on slug
	$effect(() => {
		if (statusSlug && userStatuses.length > 0) {
			const status = userStatuses.find((s) => s.slug === statusSlug);
			if (status) {
				statusId = status.id;
				console.log(`Found status_id for slug "${statusSlug}":`, statusId);
			} else {
				console.warn(`No status found for slug "${statusSlug}", will use default`);
				const defaultStatus = userStatuses.find((s) => s.is_default);
				statusId = defaultStatus?.id || null;
			}
		}
	});

	// Reset form when modal opens
	$effect(() => {
		if (isOpen) {
			formData = {
				name: '',
				email: '',
				password: '',
				password_confirmation: '',
				region: ''
			};
			errors = {};

			// Load statuses when modal opens
			loadUserStatuses();
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
			const userData = {
				name: formData.name.trim(),
				email: formData.email.trim(),
				password: formData.password.trim(),
				password_confirmation: formData.password_confirmation.trim(),
				region: formData.region.trim() || null,
				status_id: statusId
			};

			onSave(userData);
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
					newErrors.name = 'Имя пользователя обязательно';
				} else {
					delete newErrors.name;
				}
				break;
			}
			case 'email': {
				const emailValue = value.trim();
				if (!emailValue) {
					newErrors.email = 'Email обязателен';
				} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
					newErrors.email = 'Некорректный формат email';
				} else {
					delete newErrors.email;
				}
				break;
			}
			case 'password': {
				const passwordValue = value.trim();
				if (!passwordValue) {
					newErrors.password = 'Пароль обязателен';
				} else if (passwordValue.length < 8) {
					newErrors.password = 'Пароль должен содержать минимум 8 символов';
				} else {
					delete newErrors.password;
				}
				// Also validate password confirmation if it's already filled
				if (formData.password_confirmation) {
					if (passwordValue !== formData.password_confirmation) {
						newErrors.password_confirmation = 'Пароли не совпадают';
					} else {
						delete newErrors.password_confirmation;
					}
				}
				break;
			}
			case 'password_confirmation': {
				const confirmValue = value.trim();
				if (!confirmValue) {
					newErrors.password_confirmation = 'Подтверждение пароля обязательно';
				} else if (confirmValue !== formData.password) {
					newErrors.password_confirmation = 'Пароли не совпадают';
				} else {
					delete newErrors.password_confirmation;
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

	// Get modal title based on status slug
	let modalTitle = $derived.by(() => {
		switch (statusSlug) {
			case 'agents':
				return 'Добавить агента';
			case 'curators':
				return 'Добавить куратора';
			case 'managers':
				return 'Добавить менеджера';
			case 'designers':
				return 'Добавить дизайнера';
			default:
				return 'Добавить пользователя';
		}
	});
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
				class="relative mx-4 transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:mx-0 sm:my-8 sm:w-full sm:max-w-lg sm:p-6 dark:bg-gray-800"
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
						{modalTitle}
					</h3>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Заполните информацию о новом пользователе
					</p>
				</div>

				<!-- Form -->
				<form onsubmit={handleSubmit} class="space-y-5">
					<!-- Name -->
					<div>
						<label
							for="user-name"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Имя <span class="text-red-500">*</span>
						</label>
						<input
							bind:this={firstInputElement}
							type="text"
							id="user-name"
							value={formData.name}
							oninput={(e) => handleInputChange('name', e.target.value)}
							disabled={isLoading}
							required
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
							aria-describedby={errors.name ? 'user-name-error' : undefined}
							aria-invalid={errors.name ? 'true' : 'false'}
						/>
						{#if errors.name}
							<p id="user-name-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
								{errors.name}
							</p>
						{/if}
					</div>

					<!-- Email -->
					<div>
						<label
							for="user-email"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Email <span class="text-red-500">*</span>
						</label>
						<input
							type="email"
							id="user-email"
							value={formData.email}
							oninput={(e) => handleInputChange('email', e.target.value)}
							disabled={isLoading}
							required
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
							aria-describedby={errors.email ? 'user-email-error' : undefined}
							aria-invalid={errors.email ? 'true' : 'false'}
						/>
						{#if errors.email}
							<p id="user-email-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
								{errors.email}
							</p>
						{/if}
					</div>

					<!-- Region -->
					<div>
						<label
							for="user-region"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Регион
						</label>
						<input
							type="text"
							id="user-region"
							value={formData.region}
							oninput={(e) => handleInputChange('region', e.target.value)}
							disabled={isLoading}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
						/>
					</div>

					<!-- Password -->
					<div>
						<label
							for="user-password"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Пароль <span class="text-red-500">*</span>
						</label>
						<input
							type="password"
							id="user-password"
							value={formData.password}
							oninput={(e) => handleInputChange('password', e.target.value)}
							disabled={isLoading}
							required
							minlength="8"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
							aria-describedby={errors.password ? 'user-password-error' : 'user-password-help'}
							aria-invalid={errors.password ? 'true' : 'false'}
						/>
						{#if errors.password}
							<p id="user-password-error" class="mt-1 text-sm text-red-600 dark:text-red-400">
								{errors.password}
							</p>
						{:else}
							<p id="user-password-help" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
								Минимум 8 символов
							</p>
						{/if}
					</div>

					<!-- Password Confirmation -->
					<div>
						<label
							for="user-password-confirmation"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Подтверждение пароля <span class="text-red-500">*</span>
						</label>
						<input
							type="password"
							id="user-password-confirmation"
							value={formData.password_confirmation}
							oninput={(e) => handleInputChange('password_confirmation', e.target.value)}
							disabled={isLoading}
							required
							minlength="8"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
							aria-describedby={errors.password_confirmation
								? 'user-password-confirmation-error'
								: undefined}
							aria-invalid={errors.password_confirmation ? 'true' : 'false'}
						/>
						{#if errors.password_confirmation}
							<p
								id="user-password-confirmation-error"
								class="mt-1 text-sm text-red-600 dark:text-red-400"
							>
								{errors.password_confirmation}
							</p>
						{/if}
					</div>

					<!-- Action buttons -->
					<div
						class="flex flex-col space-y-3 pt-2 sm:flex-row-reverse sm:space-y-0 sm:space-x-3 sm:space-x-reverse"
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
							{isLoading ? 'Сохранение...' : 'Добавить'}
						</button>

						<!-- Cancel button -->
						<button
							type="button"
							onclick={handleCancel}
							disabled={isLoading}
							class="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 transition-colors duration-200 ring-inset hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600 dark:active:bg-gray-600"
						>
							Отмена
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
