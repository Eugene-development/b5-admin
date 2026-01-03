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
	<div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
		<!-- Backdrop with blur -->
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
								<h2 class="text-xl font-bold text-white" id="modal-title">Редактировать пользователя</h2>
								<p class="mt-0.5 text-sm text-indigo-100">Обновите информацию о пользователе "{user.name || user.email}"</p>
							</div>
						</div>
						<button
							type="button"
							onclick={handleCancel}
							disabled={isLoading}
							aria-label="Закрыть"
							class="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white disabled:opacity-50"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				<!-- Form Content -->
				<form onsubmit={handleSubmit} class="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
					<div class="space-y-5">
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
								class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
								class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
								class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
								class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
							>
								<option value="">Выберите статус</option>
								{#each userStatuses as status}
									<option value={status.id}>
										{status.value}
									</option>
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
