<script>
	/**
	 * Модальное окно подтверждения удаления заявки на выплату
	 * Feature: bonus-payments
	 */
	import { deleteBonusPaymentRequest } from '$lib/api/bonusPayments.js';
	import { addSuccessToast, addErrorToast } from '$lib/utils/toastStore.js';

	let { isOpen = false, payment = null, onClose, onSuccess } = $props();

	let modalElement = $state();
	let previousActiveElement;
	let isDeleting = $state(false);

	// Format currency
	function formatCurrency(amount) {
		if (amount === null || amount === undefined) return '—';
		return new Intl.NumberFormat('ru-RU', {
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Handle delete
	async function handleDelete() {
		if (isDeleting) return;

		isDeleting = true;

		try {
			await deleteBonusPaymentRequest(payment.id);
			addSuccessToast('Заявка удалена');

			if (onSuccess) {
				onSuccess(payment.id);
			}

			onClose && onClose();
		} catch (error) {
			console.error('Failed to delete payment request:', error);
			addErrorToast(error.message || 'Не удалось удалить заявку');
		} finally {
			isDeleting = false;
		}
	}

	// Handle escape key
	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen && !isDeleting) {
			onClose && onClose();
		}
	}

	// Handle backdrop click
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget && !isDeleting) {
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
				class="relative w-full transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl sm:my-8 sm:max-w-lg sm:p-6 dark:bg-gray-800"
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
			>
				<!-- Icon -->
				<div class="sm:flex sm:items-start">
					<div
						class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10 dark:bg-red-900/30"
					>
						<svg
							class="h-6 w-6 text-red-600 dark:text-red-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
					</div>
					<div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
						<h3
							id="modal-title"
							class="text-lg font-semibold leading-6 text-gray-900 dark:text-white"
						>
							Удалить заявку на выплату?
						</h3>
						<div class="mt-2">
							<p class="text-sm text-gray-500 dark:text-gray-400">
								Вы уверены, что хотите удалить заявку №{payment.id}?
							</p>
							<div class="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
								<dl class="space-y-2 text-sm">
									<div class="flex justify-between">
										<dt class="font-medium text-gray-700 dark:text-gray-300">Агент:</dt>
										<dd class="text-gray-900 dark:text-white">
											{payment.agent?.name || 'Не указан'}
										</dd>
									</div>
									<div class="flex justify-between">
										<dt class="font-medium text-gray-700 dark:text-gray-300">Сумма:</dt>
										<dd class="font-semibold text-green-600 dark:text-green-400">
											{formatCurrency(payment.amount)} ₽
										</dd>
									</div>
									<div class="flex justify-between">
										<dt class="font-medium text-gray-700 dark:text-gray-300">Статус:</dt>
										<dd class="text-gray-900 dark:text-white">
											{payment.status?.name || '—'}
										</dd>
									</div>
								</dl>
							</div>
							<p class="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
								Это действие нельзя отменить.
							</p>
						</div>
					</div>
				</div>

				<!-- Footer -->
				<div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
					<button
						type="button"
						onclick={handleDelete}
						disabled={isDeleting}
						class="inline-flex w-full justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:ml-3 sm:w-auto"
					>
						{#if isDeleting}
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
							Удаление...
						{:else}
							Удалить
						{/if}
					</button>
					<button
						type="button"
						onclick={() => onClose && onClose()}
						disabled={isDeleting}
						class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 sm:w-auto dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
					>
						Отмена
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
