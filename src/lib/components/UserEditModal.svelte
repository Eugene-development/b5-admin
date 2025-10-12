<script>
	import { onMount } from 'svelte';
	import { getUserStatuses } from '$lib/api/agents.js';

	/**
	 * UserEditModal Component
	 *
	 * A modal component for editing user information.
	 * Provides form validation, loading states, and proper accessibility.
	 *
	 * @param {boolean} isOpen - Controls modal visibility
	 * @param {Object} user - The user object to edit
	 * @param {Function} onSave - Callback function for saving changes
	 * @param {Function} onCancel - Callback function for cancellation
	 * @param {boolean} [isLoading=false] - Loading state for save button
	 */
	let { isOpen = false, user = null, onSave, onCancel, isLoading = false } = $props();

	let modalElement = $state();
	let firstInputElement = $state();
	let previousActiveElement;

	// User statuses
	let userStatuses = $state([]);
	let isLoadingStatuses = $state(false);

	// Form data state
	let formData = $state({
		name: '',
		email: '',
		region: '',
		status_id: ''
	});

	// Load user statuses
	async function loadUserStatuses() {
		isLoadingStatuses = true;
		try {
			userStatuses = await getUserStatuses();
		} catch (error) {
			console.error('Failed to load user statuses:', error);
		} finally {
			isLoadingStatuses = false;
		}
	}

	// Form validation state
	let errors = $state({});
	let isFormValid = $derived(
		formData.name.trim() !== '' && formData.email.trim() !== '' && Object.keys(errors).length === 0
	);

	// Initialize form data when user changes
	$effect(() => {
		if (user && isOpen) {
			const newFormData = {
				name: user.name || '',
				email: user.email || '',
				region: user.region || '',
				status_id: user.status_id || ''
			};

			formData = newFormData;

			// Reset errors and validate initial data
			errors = {};

			// Load statuses if not already loaded
			if (userStatuses.length === 0) {
				loadUserStatuses();
			}

			// Use setTimeout to ensure formData is updated before validation
			setTimeout(() => {
				validateField('name', newFormData.name);
				validateField('email', newFormData.email);
			}, 0);
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
			const updatedData = {
				id: user.id,
				name: formData.name.trim(),
				email: formData.email.trim(),
				region: formData.region.trim() || null,
				status_id: formData.status_id || null
			};

			onSave(updatedData);
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
					newErrors.name = 'Имя обязательно';
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
{#if isOpen && user}
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
						Редактировать пользователя
					</h3>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Обновите информацию о пользователе "{user.name || user.email}"
					</p>
				</div>

				<!-- Form -->
				<form onsubmit={handleSubmit} class="space-y-6">
					<!-- User Name -->
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
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
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
						<label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
							Email <span class="text-red-500">*</span>
						</label>
						<input
							type="email"
							id="email"
							value={formData.email}
							oninput={(e) => handleInputChange('email', e.target.value)}
							disabled={isLoading}
							required
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

					<!-- Region -->
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
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
						/>
					</div>

					<!-- User Status -->
					<div>
						<label
							for="user-status"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Статус пользователя
						</label>
						<select
							id="user-status"
							value={formData.status_id}
							onchange={(e) => handleInputChange('status_id', e.target.value)}
							disabled={isLoading || isLoadingStatuses}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800"
						>
							<option value="">Выберите статус</option>
							{#each userStatuses as status}
								<option value={status.id}>
									{status.value}
								</option>
							{/each}
						</select>
						{#if isLoadingStatuses}
							<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Загрузка статусов...</p>
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
