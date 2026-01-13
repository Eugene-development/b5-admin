<script>
	/**
	 * Модальное окно заказа выплаты бонуса для Куратора
	 * Адаптировано из b5-agent/PayoutRequestModal
	 */

	import { createBonusPaymentRequest } from '$lib/api/bonusPayments.js';
	import { addSuccessToast, addErrorToast } from '$lib/utils/toastStore.js';

	/** @type {{ availableAmount: number, isOpen: boolean, onClose: () => void, onSubmit?: () => void }} */
	let { availableAmount = 0, isOpen = false, onClose, onSubmit } = $props();

	// Состояние формы
	let amount = $state('');
	let paymentMethod = $state('');
	let cardNumber = $state('');
	let phoneNumber = $state('');
	let contactInfo = $state('');
	let comment = $state('');
	
	// Состояние отправки
	let isSubmitting = $state(false);

	// Методы оплаты
	const paymentMethods = [
		{ id: 'card', name: 'КАРТА', icon: 'card' },
		{ id: 'sbp', name: 'СБП', icon: 'phone' },
		{ id: 'other', name: 'ДРУГОЕ', icon: 'other' }
	];

	/**
	 * Форматирование суммы
	 * @param {number} value
	 */
	function formatCurrency(value) {
		return new Intl.NumberFormat('ru-RU', {
			style: 'decimal',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(value || 0);
	}

	/**
	 * Обработка отправки формы
	 */
	async function handleSubmit() {
		if (isSubmitting) return;
		
		const formData = {
			amount: parseFloat(amount) || 0,
			payment_method: paymentMethod,
			card_number: paymentMethod === 'card' ? cardNumber : null,
			phone_number: paymentMethod === 'sbp' ? phoneNumber : null,
			contact_info: paymentMethod === 'other' ? contactInfo : null,
			comment
		};

		isSubmitting = true;
		
		try {
			await createBonusPaymentRequest(formData);
			
			addSuccessToast('Заявка на выплату успешно создана');
			
			// Reset form
			amount = '';
			paymentMethod = '';
			cardNumber = '';
			phoneNumber = '';
			contactInfo = '';
			comment = '';
			
			if (onSubmit) {
				onSubmit();
			}
			
			onClose();
		} catch (error) {
			console.error('Failed to create payment request:', error);
			addErrorToast(error.message || 'Не удалось создать заявку на выплату');
		} finally {
			isSubmitting = false;
		}
	}

	/**
	 * Установить всю доступную сумму
	 */
	function setMaxAmount() {
		amount = Math.round(availableAmount).toString();
	}

	/**
	 * Форматирование номера телефона
	 * @param {string} value
	 */
	function formatPhoneNumber(value) {
		let digits = value.replace(/\D/g, '');
		if (digits.startsWith('8')) {
			digits = '7' + digits.slice(1);
		}
		if (digits.length > 0 && !digits.startsWith('7')) {
			digits = '7' + digits;
		}
		digits = digits.slice(0, 11);
		
		if (digits.length === 0) return '';
		if (digits.length <= 1) return '+7';
		if (digits.length <= 4) return `+7 (${digits.slice(1)}`;
		if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
		if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
		return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
	}

	/**
	 * Обработчик ввода телефона
	 * @param {Event} event
	 */
	function handlePhoneInput(event) {
		const input = /** @type {HTMLInputElement} */ (event.target);
		const formatted = formatPhoneNumber(input.value);
		phoneNumber = formatted;
	}

	/**
	 * Форматирование номера карты
	 * @param {string} value
	 */
	function formatCardNumber(value) {
		let digits = value.replace(/\D/g, '');
		digits = digits.slice(0, 18);
		const groups = [];
		for (let i = 0; i < digits.length; i += 4) {
			groups.push(digits.slice(i, i + 4));
		}
		return groups.join(' ');
	}

	/**
	 * Обработчик ввода номера карты
	 * @param {Event} event
	 */
	function handleCardInput(event) {
		const input = /** @type {HTMLInputElement} */ (event.target);
		const formatted = formatCardNumber(input.value);
		cardNumber = formatted;
	}

	function handleKeydown(event) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	// Валидация формы
	let isValid = $derived(
		amount && 
		paymentMethod && 
		parseFloat(amount) >= 1000 && 
		parseFloat(amount) <= Math.round(availableAmount) &&
		(
			(paymentMethod === 'card' && cardNumber.length >= 16) ||
			(paymentMethod === 'sbp' && phoneNumber.length >= 17) ||
			(paymentMethod === 'other' && contactInfo.length > 0)
		)
	);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-40 bg-black/50"
		onclick={onClose}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="button"
		tabindex="-1"
		aria-label="Закрыть"
	></div>

	<!-- Modal -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div
			class="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
				<div class="flex items-center gap-3">
					<div class="rounded-lg bg-green-500/10 p-2">
						<svg class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
							/>
						</svg>
					</div>
					<div>
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Заказать выплату</h3>
						<p class="text-sm text-gray-500 dark:text-gray-400">
							Доступно: <span class="text-green-600 dark:text-green-400">{formatCurrency(availableAmount)} ₽</span>
						</p>
					</div>
				</div>
				<button
					type="button"
					onclick={onClose}
					class="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-white"
					aria-label="Закрыть"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Content -->
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="max-h-[calc(90vh-120px)] overflow-y-auto px-6 py-4"
			>
				<!-- Сумма выплаты -->
				<div class="mb-5">
					<label for="amount" class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
						Сумма выплаты
					</label>
					<div class="relative">
						<input
							type="number"
							id="amount"
							bind:value={amount}
							min="1000"
							max={Math.round(availableAmount)}
							placeholder="0"
							class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
						/>
						<button
							type="button"
							onclick={setMaxAmount}
							class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-600 transition-colors hover:bg-green-500/20 dark:text-green-400"
						>
							MAX
						</button>
					</div>
					{#if parseFloat(amount) > 0 && parseFloat(amount) < 1000}
						<p class="mt-1 text-xs text-red-500">Минимальная сумма выплаты — 1 000 ₽</p>
					{/if}
				</div>

				<!-- Способ выплаты -->
				<div class="mb-5">
					<p class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Способ выплаты</p>
					<div class="grid grid-cols-3 gap-3">
						{#each paymentMethods as method}
							<button
								type="button"
								onclick={() => (paymentMethod = method.id)}
								class="flex items-center gap-2 rounded-lg border-2 p-2 transition-all {paymentMethod === method.id
									? 'border-green-500 bg-green-500/10'
									: 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'}"
							>
								{#if method.icon === 'card'}
									<svg
										class="h-5 w-5 flex-shrink-0 {paymentMethod === method.id
											? 'text-green-500'
											: 'text-gray-400'}"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
										/>
									</svg>
								{:else if method.icon === 'phone'}
									<svg
										class="h-5 w-5 flex-shrink-0 {paymentMethod === method.id
											? 'text-green-500'
											: 'text-gray-400'}"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
										/>
									</svg>
								{:else}
									<svg
										class="h-5 w-5 flex-shrink-0 {paymentMethod === method.id
											? 'text-green-500'
											: 'text-gray-400'}"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								{/if}
								<span
									class="text-sm font-medium {paymentMethod === method.id
										? 'text-green-600 dark:text-green-400'
										: 'text-gray-600 dark:text-gray-300'}"
								>
									{method.name}
								</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Поля для реквизитов -->
				{#if paymentMethod === 'card'}
					<div class="mb-5">
						<label for="cardNumber" class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
							Номер карты
						</label>
						<input
							type="text"
							id="cardNumber"
							value={cardNumber}
							oninput={handleCardInput}
							placeholder="0000 0000 0000 0000"
							maxlength="22"
							class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
						/>
					</div>
				{/if}

				{#if paymentMethod === 'sbp'}
					<div class="mb-5">
						<label for="phoneNumber" class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
							Номер телефона
						</label>
						<input
							type="tel"
							id="phoneNumber"
							value={phoneNumber}
							oninput={handlePhoneInput}
							placeholder="+7 (___) ___-__-__"
							maxlength="18"
							class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
						/>
					</div>
				{/if}

				{#if paymentMethod === 'other'}
					<div class="mb-5">
						<label for="contactInfo" class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
							Как с вами связаться?
						</label>
						<input
							type="text"
							id="contactInfo"
							bind:value={contactInfo}
							placeholder="Телефон, email или другой способ связи"
							maxlength="255"
							class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
						/>
					</div>
				{/if}

				<!-- Комментарий -->
				<div class="mb-5">
					<label for="comment" class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
						Комментарий <span class="text-gray-400">(необязательно)</span>
					</label>
					<textarea
						id="comment"
						bind:value={comment}
						rows="3"
						placeholder="Дополнительная информация..."
						maxlength="300"
						class="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
					></textarea>
				</div>

				<!-- Информационный блок -->
				<div class="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
					<div class="flex gap-3">
						<svg
							class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<div class="text-sm text-amber-700 dark:text-amber-200">
							<p>Выплаты обрабатываются в течение 3-5 рабочих дней. Минимальная сумма выплаты — 1 000 ₽.</p>
						</div>
					</div>
				</div>

				<!-- Footer кнопки -->
				<div class="flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
					<button
						type="button"
						onclick={onClose}
						class="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
					>
						Отмена
					</button>
					<button
						type="submit"
						disabled={isSubmitting || !isValid}
						class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700"
					>
						{#if isSubmitting}
							<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Отправка...
						{:else}
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							Заказать выплату
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
</script>
