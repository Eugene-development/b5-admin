<script>
	let { isOpen = false, payment = null, onClose } = $props();

	let modalElement = $state();
	let previousActiveElement;

	// Format currency
	function formatCurrency(amount) {
		if (amount === null || amount === undefined) return '—';
		return new Intl.NumberFormat('ru-RU', {
			style: 'currency',
			currency: 'RUB',
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

	// Get status color
	function getStatusColor(code) {
		switch (code) {
			case 'completed':
				return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
			case 'failed':
				return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
			case 'pending':
			default:
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
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
			>
				<div class="mb-6 flex items-start justify-between">
					<div>
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Детали выплаты</h3>
						<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
							{formatDate(payment.payment_date)}
						</p>
					</div>
					<span class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium {getStatusColor(payment.status?.code)}">
						{payment.status?.name || '—'}
					</span>
				</div>

				<div class="space-y-6">
					<!-- Payment Info -->
					<div class="grid grid-cols-2 gap-4">
						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Агент</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">{payment.agent?.name || '—'}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Сумма</dt>
							<dd class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(payment.total_amount)}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Способ выплаты</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">{payment.method?.name || '—'}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Номер документа</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">{payment.reference_number || '—'}</dd>
						</div>
					</div>

					<!-- Bonuses List -->
					{#if payment.bonuses && payment.bonuses.length > 0}
						<div>
							<h4 class="mb-3 text-sm font-medium text-indigo-600 dark:text-indigo-400">
								Включённые бонусы ({payment.bonuses.length})
							</h4>
							<div class="rounded-md border border-gray-200 dark:border-gray-600">
								{#each payment.bonuses as bonus (bonus.id)}
									<div class="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-gray-700">
										<div>
											<div class="text-sm font-medium text-gray-900 dark:text-white">
												{bonus.source_type === 'contract' ? 'Договор' : 'Закупка'}
												{#if bonus.project_name}— {bonus.project_name}{/if}
											</div>
										</div>
										<div class="text-sm font-semibold text-gray-900 dark:text-white">
											{formatCurrency(bonus.commission_amount)}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

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
