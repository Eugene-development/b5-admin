<script>
	/**
	 * Модальное окно редактирования заявки на выплату бонуса
	 * Feature: bonus-payments
	 */
	import { updateBonusPaymentRequest } from '$lib/api/bonusPayments.js';
	import { addSuccessToast, addErrorToast } from '$lib/utils/toastStore.js';

	let { isOpen = false, payment = null, onClose, onSuccess } = $props();

	let modalElement = $state();
	let previousActiveElement;
	let isSubmitting = $state(false);

	// Form state
	let amount = $state('');
	let paymentMethod = $state('card');
	let cardNumber = $state('');
	let phoneNumber = $state('');
	let contactInfo = $state('');
	let comment = $state('');

	// Payment methods
	const paymentMethods = [
		{ value: 'card', label: 'Карта', icon: '💳' },
		{ value: 'sbp', label: 'СБП', icon: '📱' },
		{ value: 'other', label: 'Другое', icon: '📋' }
	];

	// Initialize form when payment changes
	$effect(() => {
		if (payment && isOpen) {
			amount = payment.amount?.toString() || '';
			paymentMethod = payment.payment_method || 'card';
			cardNumber = payment.card_number || '';
			phoneNumber = payment.phone_number || '';
			contactInfo = payment.contact_info || '';
			comment = payment.comment || '';
		}
	});

	// Format currency
	function formatCurrency(amount) {
		if (amount === null || amount === undefined) return '—';
		return new Intl.NumberFormat('ru-RU', {
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Handle form submission
	async function handleSubmit() {
		if (isSubmitting) return;

		// Validation
		const amountValue = parseFloat(amount);
		if (!amountValue || amountValue <= 0) {
			addErrorToast('Укажите корректную сумму');
			return;
		}

		if (amountValue < 1000) {
			addErrorToast('Минимальная сумма выплаты — 1 000 ₽');
			return;
		}

		// Validate payment details based on method
		if (paymentMethod === 'card' && !cardNumber.trim()) {
			addErrorToast('Укажите номер карты');
			return;
		}

		if (paymentMethod === 'sbp' && !phoneNumber.trim()) {
			addErrorToast('Укажите номер телефона');
			return;
		}

		if (paymentMethod === 'other' && !contactInfo.trim()) {
			addErrorToast('Укажите контактную информацию');
			return;
		}

		isSubmitting = true;

		try {
			const input = {
				amount: amountValue,
				payment_method: paymentMethod,
				card_number: paymentMethod === 'card' ? cardNumber.trim() : null,
				phone_number: paymentMethod === 'sbp' ? phoneNumber.trim() : null,
				contact_info: paymentMethod === 'other' ? contactInfo.trim() : null,
				comment: comment.trim() || null
			};

			const result = await updateBonusPaymentRequest(payment.id, input);
			addSuccessToast('Заявка успешно обновлена');

			if (onSuccess) {
				onSuccess(result);
			}

			onClose && onClose();
		} catch (error) {
			console.error('Failed to update payment request:', error);
			addErrorToast(error.message || 'Не удалось обновить заявку');
		} finally {
			isSubmitting = false;
		}
	}

	// Handle escape key
	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen && !isSubmitting) {
			onClose && onClose();
		}
	}

	// Handle backdrop click
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget && !isSubmitting) {
			onClose && onClose();
		}
	}

	// Focus management
	$effect(() => {
		if (isOpen) {
			previousActiveElement = document.activeElement;
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
</script>

{#if isOpen && payment}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
			<div
				class="fixed inset-0 bg-black/80 transition-opacity"
				onclick={handleBackdropClick}
				aria-hidden="true"
			></div>

			<div
				bind:this={modalElement}
				class="relative w-full transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl sm:my-8 sm:max-w-2xl sm:p-6 dark:bg-gray-800"
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
			>
				<!-- Header -->
				<div class="mb-6 flex items-start justify-between">
					<div>
						<h3 id="modal-title" class="text-lg font-semibold text-gray-900 dark:text-white">
							Редактировать заявку №{payment.id}
						</h3>
						<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
							Агент: {payment.agent?.name || 'Не указан'}
						</p>
					</div>
					<button
						type="button"
						onclick={() => onClose && onClose()}
						disabled={isSubmitting}
						class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
						aria-label="Закрыть"
					>
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<!-- Form -->
				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-5">
					<!-- Сумма выплаты -->
					<div>
						<label for="amount" class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
							Сумма выплаты
						</label>
						<div class="relative">
							<input
								type="number"
								id="amount"
								bind:value={amount}
								disabled={isSubmitting}
								min="1000"
								step="1"
								required
								class="block w-full rounded-md border-gray-300 pr-12 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500 sm:text-sm"
								placeholder="1000"
							/>
							<div
								class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
							>
								<span class="text-gray-500 dark:text-gray-400 sm:text-sm">₽</span>
							</div>
						</div>
						{#if parseFloat(amount) > 0 && parseFloat(amount) < 1000}
							<p class="mt-1 text-xs text-red-500">Минимальная сумма выплаты — 1 000 ₽</p>
						{/if}
					</div>

					<!-- Способ выплаты -->
					<div>
						<p class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
							Способ выплаты
						</p>
						<div class="grid grid-cols-3 gap-3">
							{#each paymentMethods as method}
								<button
									type="button"
									onclick={() => (paymentMethod = method.value)}
									disabled={isSubmitting}
									class="flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all disabled:cursor-not-allowed disabled:opacity-50 {paymentMethod === method.value
										? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/30'
										: 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500'}"
								>
									<span class="mb-2 text-2xl">{method.icon}</span>
									<span
										class="text-sm font-medium {paymentMethod === method.value
											? 'text-indigo-700 dark:text-indigo-300'
											: 'text-gray-700 dark:text-gray-300'}"
									>
										{method.label}
									</span>
								</button>
							{/each}
						</div>
					</div>

					<!-- Реквизиты -->
					{#if paymentMethod === 'card'}
						<div>
							<label
								for="card-number"
								class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Номер карты
							</label>
							<input
								type="text"
								id="card-number"
								bind:value={cardNumber}
								disabled={isSubmitting}
								required
								maxlength="19"
								class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500 sm:text-sm"
								placeholder="0000 0000 0000 0000"
							/>
						</div>
					{:else if paymentMethod === 'sbp'}
						<div>
							<label
								for="phone-number"
								class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Номер телефона
							</label>
							<input
								type="tel"
								id="phone-number"
								bind:value={phoneNumber}
								disabled={isSubmitting}
								required
								class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500 sm:text-sm"
								placeholder="+7 (900) 000-00-00"
							/>
						</div>
					{:else if paymentMethod === 'other'}
						<div>
							<label
								for="contact-info"
								class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Контактная информация
							</label>
							<textarea
								id="contact-info"
								bind:value={contactInfo}
								disabled={isSubmitting}
								required
								rows="3"
								class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500 sm:text-sm"
								placeholder="Укажите способ связи и реквизиты"
							></textarea>
						</div>
					{/if}

					<!-- Комментарий -->
					<div>
						<label
							for="comment"
							class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Комментарий (необязательно)
						</label>
						<textarea
							id="comment"
							bind:value={comment}
							disabled={isSubmitting}
							rows="3"
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500 sm:text-sm"
							placeholder="Дополнительная информация"
						></textarea>
					</div>

					<!-- Footer -->
					<div class="flex justify-end gap-3 pt-4">
						<button
							type="button"
							onclick={() => onClose && onClose()}
							disabled={isSubmitting}
							class="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
						>
							Отмена
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if isSubmitting}
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
								<svg
									class="mr-2 h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								Сохранить
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
