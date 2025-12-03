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

	// Prevent modal content click from closing modal
	function handleModalClick(event) {
		event.stopPropagation();
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
	<!-- Modal backdrop -->
	<div
		class="fixed inset-0 z-50 animate-fade overflow-y-auto animate-duration-100 animate-ease-linear"
		aria-labelledby="modal-title"
		role="dialog"
		aria-modal="true"
	>
		<div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
			<!-- Background overlay -->
			<div
				class="fixed inset-0 bg-black/80 transition-opacity dark:bg-black/80"
				onclick={handleBackdropClick}
				onkeydown={handleKeydown}
				tabindex="0"
				role="button"
				aria-label="Close modal"
				aria-hidden="true"
			></div>

			<!-- Modal panel -->
			<div
				class="relative w-full transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:max-w-2xl sm:p-6 dark:bg-gray-800"
				onclick={handleModalClick}
				onkeydown={handleKeydown}
				tabindex="0"
				role="dialog"
			>
				<!-- Modal header -->
				<div
					class="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-600"
				>
					<h3
						class="text-lg leading-6 font-semibold text-gray-900 dark:text-white"
						id="modal-title"
					>
						Редактировать клиента
					</h3>
					<button
						type="button"
						onclick={onClose}
						disabled={isSaving}
						class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white"
						aria-label="Закрыть модальное окно"
					>
						<svg
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<!-- Modal content - Form -->
				<form onsubmit={handleSubmit} class="mt-6">
					{#if errors.general}
						<div class="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
							<p class="text-sm text-red-800 dark:text-red-200">{errors.general}</p>
						</div>
					{/if}

					<div class="space-y-4">
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
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
								<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
									Телефоны <span class="text-red-500">*</span>
								</label>
								<button
									type="button"
									onclick={addPhone}
									disabled={isSaving}
									class="text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50 dark:text-indigo-400 dark:hover:text-indigo-300"
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
											class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
											disabled={isSaving}
										/>
										<button
											type="button"
											onclick={() => setPrimaryPhone(index)}
											disabled={isSaving}
											class="rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
											class:bg-indigo-600={phone.is_primary}
											class:text-white={phone.is_primary}
											class:hover:bg-indigo-700={phone.is_primary}
											class:bg-gray-200={!phone.is_primary}
											class:text-gray-700={!phone.is_primary}
											class:hover:bg-gray-300={!phone.is_primary}
											class:dark:bg-indigo-500={phone.is_primary}
											class:dark:hover:bg-indigo-600={phone.is_primary}
											class:dark:bg-gray-600={!phone.is_primary}
											class:dark:text-gray-300={!phone.is_primary}
											class:dark:hover:bg-gray-500={!phone.is_primary}
											title={phone.is_primary ? 'Основной' : 'Сделать основным'}
										>
											★
										</button>
										{#if formData.phones.length > 1}
											<button
												type="button"
												onclick={() => removePhone(index)}
												disabled={isSaving}
												class="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
											>
												×
											</button>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					</div>

					<!-- Modal footer -->
					<div
						class="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-600"
					>
						<button
							type="button"
							onclick={onClose}
							disabled={isSaving}
							class="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
						>
							Отмена
						</button>
						<button
							type="submit"
							disabled={isSaving}
							class="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
						>
							{#if isSaving}
								<svg
									class="mr-2 h-4 w-4 animate-spin"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
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
								Сохранение...
							{:else}
								Сохранить
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
