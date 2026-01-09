<script>
	/**
	 * Модальное окно просмотра заявки на выплату бонуса
	 * Feature: bonus-payments
	 */
	let { isOpen = false, payment = null, onClose } = $props();

	let modalElement = $state();
	let previousActiveElement;

	// Format currency
	function formatCurrency(amount) {
		if (amount === null || amount === undefined) return '—';
		return new Intl.NumberFormat('ru-RU', {
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Format date
	function formatDate(dateString) {
		if (!dateString) return '—';
		return new Date(dateString).toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Format datetime
	function formatDateTime(dateString) {
		if (!dateString) return '—';
		return new Date(dateString).toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Get status color
	function getStatusColor(code) {
		switch (code) {
			case 'completed':
			case 'paid':
				return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
			case 'rejected':
			case 'cancelled':
				return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
			case 'pending':
			case 'new':
			default:
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
		}
	}

	// Get payment method name
	function getPaymentMethodName(method) {
		switch (method) {
			case 'card':
				return 'Банковская карта';
			case 'sbp':
				return 'Система быстрых платежей (СБП)';
			case 'other':
				return 'Другой способ';
			default:
				return 'Не указан';
		}
	}

	// Get payment details based on method
	function getPaymentDetails(request) {
		switch (request.payment_method) {
			case 'card':
				return request.card_number || '—';
			case 'sbp':
				return request.phone_number || '—';
			case 'other':
				return request.contact_info || '—';
			default:
				return '—';
		}
	}

	// Handle escape key
	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen) {
			onClose && onClose();
		}
	}

	// Handle backdrop click
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
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
							Заявка на выплату №{payment.id}
						</h3>
						<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
							Создана: {formatDateTime(payment.created_at)}
						</p>
					</div>
					<div class="flex items-center gap-3">
						<span
							class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium {getStatusColor(
								payment.status?.code
							)}"
						>
							{payment.status?.name || '—'}
						</span>
						<button
							type="button"
							onclick={() => onClose && onClose()}
							class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
				</div>

				<div class="space-y-6">
					<!-- Agent Info -->
					<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
						<h4 class="mb-3 text-sm font-medium text-indigo-600 dark:text-indigo-400">
							Информация об агенте
						</h4>
						<dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">ФИО</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{payment.agent?.name || '—'}
								</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{payment.agent?.email || '—'}
								</dd>
							</div>
							{#if payment.agent?.phone}
								<div>
									<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Телефон</dt>
									<dd class="mt-1 text-sm text-gray-900 dark:text-white">
										{payment.agent.phone}
									</dd>
								</div>
							{/if}
						</dl>
					</div>

					<!-- Payment Info -->
					<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
						<h4 class="mb-3 text-sm font-medium text-indigo-600 dark:text-indigo-400">
							Детали выплаты
						</h4>
						<dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Сумма</dt>
								<dd class="mt-1 text-xl font-bold text-green-600 dark:text-green-400">
									{formatCurrency(payment.amount)}
								</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Способ выплаты</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{getPaymentMethodName(payment.payment_method)}
								</dd>
							</div>
							<div class="sm:col-span-2">
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Реквизиты</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{getPaymentDetails(payment)}
								</dd>
							</div>
						</dl>
					</div>

					<!-- Dates -->
					<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
						<h4 class="mb-3 text-sm font-medium text-indigo-600 dark:text-indigo-400">Даты</h4>
						<dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Дата заявки</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{formatDateTime(payment.created_at)}
								</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Дата выплаты</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{payment.payment_date ? formatDate(payment.payment_date) : 'Не выплачено'}
								</dd>
							</div>
						</dl>
					</div>

					<!-- Comment -->
					{#if payment.comment}
						<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
							<h4 class="mb-3 text-sm font-medium text-indigo-600 dark:text-indigo-400">
								Комментарий
							</h4>
							<p class="text-sm text-gray-900 dark:text-white">
								{payment.comment}
							</p>
						</div>
					{/if}
				</div>

				<!-- Footer -->
				<div class="mt-6 flex justify-end">
					<button
						type="button"
						onclick={() => onClose && onClose()}
						class="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
					>
						Закрыть
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
