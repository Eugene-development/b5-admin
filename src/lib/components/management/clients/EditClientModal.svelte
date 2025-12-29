<script>
	import { formatPhone } from '$lib/utils/formatters.js';

	let { isOpen = false, client = null, onClose, onSave } = $props();

	// Local state for form fields
	let formData = $state({
		id: '',
		name: '',
		birthday: '',
		ban: false,
		phones: []
	});

	let isSaving = $state(false);
	let errors = $state({});

	// Initialize form data when client changes
	$effect(() => {
		if (client && isOpen) {
			formData = {
				id: client.id,
				name: client.name || '',
				birthday: client.birthday || '',
				ban: client.ban || false,
				phones:
					client.phones?.length > 0
						? client.phones.map((p) => ({
								id: p.id,
								value: p.value,
								is_primary: p.is_primary || false
							}))
						: [{ value: '', is_primary: true }]
			};
			errors = {};
		}
	});

	// Validate form
	function validate() {
		const newErrors = {};

		if (!formData.name || formData.name.trim() === '') {
			newErrors.name = 'Имя обязательно';
		}

		// Validate phones
		const validPhones = formData.phones.filter((p) => p.value.trim() !== '');
		if (validPhones.length === 0) {
			newErrors.phones = 'Необходим хотя бы один телефон';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	// Handle form submission
	async function handleSubmit(event) {
		event.preventDefault();

		if (!validate()) {
			return;
		}

		isSaving = true;

		try {
			// Filter out empty phones
			const phonesToSave = formData.phones.filter((p) => p.value.trim() !== '');

			const input = {
				id: formData.id,
				name: formData.name.trim(),
				birthday: formData.birthday || null,
				ban: formData.ban,
				phones: phonesToSave
			};

			await onSave(input);
			onClose();
		} catch (error) {
			console.error('Error saving client:', error);
			errors.general = error.message || 'Не удалось сохранить клиента';
		} finally {
			isSaving = false;
		}
	}

	// Add new phone field
	function addPhone() {
		formData.phones = [...formData.phones, { value: '', is_primary: false }];
	}

	// Remove phone field
	function removePhone(index) {
		formData.phones = formData.phones.filter((_, i) => i !== index);
	}

	// Set primary phone
	function setPrimaryPhone(index) {
		formData.phones = formData.phones.map((phone, i) => ({
			...phone,
			is_primary: i === index
		}));
	}

	// Handle backdrop click to close modal
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget && !isSaving) {
			onClose();
		}
	}

	// Handle escape key to close modal
	function handleKeydown(event) {
		if (event.key === 'Escape' && !isSaving) {
			onClose();
		}
	}

	// Handle body scroll when modal is open/closed
	$effect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}

		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

{#if isOpen && client}
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
				class="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-gray-900"
				onkeydown={handleKeydown}
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
								<h2 class="text-xl font-bold text-white" id="modal-title">Редактировать клиента</h2>
								<p class="mt-0.5 text-sm text-indigo-100">Обновите информацию о клиенте "{client.name}"</p>
							</div>
						</div>
						<button
							type="button"
							onclick={onClose}
							disabled={isSaving}
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
					{#if errors.general}
						<div class="mb-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
							<p class="text-sm text-red-800 dark:text-red-200">{errors.general}</p>
						</div>
					{/if}

					<div class="space-y-5">
						<!-- Name Field -->
						<div>
							<label
								for="client-name"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Имя <span class="text-red-500">*</span>
							</label>
							<input
								id="client-name"
								type="text"
								bind:value={formData.name}
								class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
								class:border-red-500={errors.name}
								disabled={isSaving}
								required
							/>
							{#if errors.name}
								<p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
							{/if}
						</div>

						<!-- Birthday Field -->
						<div>
							<label
								for="client-birthday"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Дата рождения
							</label>
							<input
								id="client-birthday"
								type="date"
								bind:value={formData.birthday}
								class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
								disabled={isSaving}
							/>
						</div>

						<!-- Ban Status -->
						<div class="flex items-center">
							<input
								id="client-ban"
								type="checkbox"
								bind:checked={formData.ban}
								class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
								disabled={isSaving}
							/>
							<label
								for="client-ban"
								class="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Заблокирован
							</label>
						</div>

						<!-- Phones -->
						<div>
							<div class="mb-2 flex items-center justify-between">
								<span class="block text-sm font-medium text-gray-700 dark:text-gray-300">
									Телефоны <span class="text-red-500">*</span>
								</span>
								<button
									type="button"
									onclick={addPhone}
									disabled={isSaving}
									class="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50 dark:text-indigo-400 dark:hover:text-indigo-300"
								>
									+ Добавить телефон
								</button>
							</div>
							{#if errors.phones}
								<p class="mb-2 text-sm text-red-600 dark:text-red-400">{errors.phones}</p>
							{/if}
							<div class="space-y-2">
								{#each formData.phones as phone, index}
									<div class="flex gap-2">
										<input
											type="tel"
											bind:value={phone.value}
											placeholder="+7 (XXX) XXX-XX-XX"
											class="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
											disabled={isSaving}
										/>
										<button
											type="button"
											onclick={() => setPrimaryPhone(index)}
											disabled={isSaving}
											class="rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
											class:bg-indigo-600={phone.is_primary}
											class:text-white={phone.is_primary}
											class:hover:bg-indigo-700={phone.is_primary}
											class:bg-gray-200={!phone.is_primary}
											class:text-gray-700={!phone.is_primary}
											class:hover:bg-gray-300={!phone.is_primary}
											class:dark:bg-indigo-500={phone.is_primary}
											class:dark:hover:bg-indigo-600={phone.is_primary}
											class:dark:bg-gray-700={!phone.is_primary}
											class:dark:text-gray-300={!phone.is_primary}
											class:dark:hover:bg-gray-600={!phone.is_primary}
											title={phone.is_primary ? 'Основной' : 'Сделать основным'}
										>
											★
										</button>
										{#if formData.phones.length > 1}
											<button
												type="button"
												onclick={() => removePhone(index)}
												disabled={isSaving}
												class="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
											>
												×
											</button>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					</div>
				</form>

				<!-- Footer -->
				<div class="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
					<div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
						<button
							type="button"
							onclick={onClose}
							disabled={isSaving}
							class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
						>
							Отмена
						</button>
						<button
							type="submit"
							onclick={handleSubmit}
							disabled={isSaving}
							class="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-gray-900"
						>
							{#if isSaving}
								<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							{/if}
							{isSaving ? 'Сохранение...' : 'Сохранить изменения'}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
