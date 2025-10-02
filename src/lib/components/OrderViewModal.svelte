<script>
	let { order, onClose } = $props();

	// Format date helper function
	function formatDate(dateString) {
		if (!dateString) return 'Не указана';
		return new Date(dateString).toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Handle backdrop click to close modal
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	// Handle escape key to close modal
	function handleKeydown(event) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	// Prevent modal content click from closing modal
	function handleModalClick(event) {
		event.stopPropagation();
	}

	// Handle body scroll when modal is open/closed
	$effect(() => {
		// Prevent body scroll when modal is open
		document.body.style.overflow = 'hidden';

		// Cleanup on component unmount
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

<!-- Modal backdrop -->
<div
	class="animate-fade animate-duration-100 animate-ease-linear fixed inset-0 z-50 overflow-y-auto"
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
			class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6 dark:bg-gray-800"
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
					class="text-lg font-semibold leading-6 text-gray-900 dark:text-white"
					id="modal-title"
				>
					Просмотр заказа #{order.id}
				</h3>
				<button
					type="button"
					onclick={onClose}
					class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white"
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

			<!-- Modal content -->
			<div class="mt-6">
				<!-- Order header -->
				<div class="mb-6 flex items-start justify-between">
					<div class="min-w-0 flex-1">
						<h4 class="text-xl font-bold text-gray-900 dark:text-white">
							{order.supplier || 'Поставщик не указан'}
						</h4>
						<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
							Сделка: {order.deal || 'Не указана'}
						</p>
					</div>
					{#if order.status}
						<div class="ml-4 flex-shrink-0">
							<span
								class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
							>
								{order.status}
							</span>
						</div>
					{/if}
				</div>

				<!-- Order details grid -->
				<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<!-- Basic Information -->
					<div class="space-y-4">
						<h5 class="text-sm font-medium text-gray-900 dark:text-white">Основная информация</h5>

						<div>
							<dt
								class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								ID заказа
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{order.id}
							</dd>
						</div>

						<div>
							<dt
								class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Поставщик
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{order.supplier || 'Не указан'}
							</dd>
						</div>

						<div>
							<dt
								class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Телефон
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{#if order.phone}
									<a
										href="tel:{order.phone}"
										class="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
									>
										{order.phone}
									</a>
								{:else}
									Не указан
								{/if}
							</dd>
						</div>

						<div>
							<dt
								class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Комментарий
							</dt>
							<dd class="mt-1 whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
								{order.comment || 'Нет комментария'}
							</dd>
						</div>
					</div>

					<!-- Additional Information -->
					<div class="space-y-4">
						<h5 class="text-sm font-medium text-gray-900 dark:text-white">Дополнительная информация</h5>

						{#if order.amount}
							<div>
								<dt
									class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
								>
									Сумма заказа
								</dt>
								<dd class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
									{order.amount.toLocaleString('ru-RU')} ₽
								</dd>
							</div>
						{/if}

						{#if order.created_at}
							<div>
								<dt
									class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
								>
									Дата создания
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{formatDate(order.created_at)}
								</dd>
							</div>
						{/if}

						{#if order.updated_at}
							<div>
								<dt
									class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
								>
									Дата обновления
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{formatDate(order.updated_at)}
								</dd>
							</div>
						{/if}
					</div>
				</div>

				<!-- Items/Products if available -->
				{#if order.items && order.items.length > 0}
					<div class="mt-6 border-t border-gray-200 pt-6 dark:border-gray-600">
						<h5 class="text-sm font-medium text-gray-900 dark:text-white">Товары в заказе</h5>

						<div class="mt-4 space-y-3">
							{#each order.items as item}
								<div class="flex justify-between items-center p-3 bg-gray-50 rounded-md dark:bg-gray-700">
									<div>
										<div class="text-sm font-medium text-gray-900 dark:text-white">
											{item.name || 'Товар без названия'}
										</div>
										{#if item.description}
											<div class="text-xs text-gray-500 dark:text-gray-400">
												{item.description}
											</div>
										{/if}
									</div>
									<div class="text-right">
										{#if item.quantity}
											<div class="text-sm text-gray-900 dark:text-white">
												Кол-во: {item.quantity}
											</div>
										{/if}
										{#if item.price}
											<div class="text-sm font-semibold text-gray-900 dark:text-white">
												{item.price.toLocaleString('ru-RU')} ₽
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Modal footer -->
			<div class="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-600">
				<button
					type="button"
					onclick={onClose}
					class="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
				>
					Закрыть
				</button>
			</div>
		</div>
	</div>
</div>