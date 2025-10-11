<script>
	import { formatPhone } from '$lib/utils/formatters.js';

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
				<h3 class="text-lg font-semibold leading-6 text-gray-900 dark:text-white" id="modal-title">
					Просмотр заказа
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
						<!-- <h4 class="text-xl font-bold text-gray-900 dark:text-white">
							{order.company?.name || order.supplier || 'Поставщик не указан'}
						</h4>
						<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
							Заказ: {order.value || order.deal || 'Не указан'}
						</p> -->
						{#if order.order_number}
							<p class="mt-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
								№ {order.order_number}
							</p>
						{/if}
					</div>
					<div class="ml-4 flex flex-shrink-0 gap-2">
						{#if order.is_urgent}
							<span
								class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200"
							>
								Срочный
							</span>
						{/if}
						{#if order.is_active !== undefined}
							<span
								class="inline-flex items-center rounded-full {order.is_active
									? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
									: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'} px-2.5 py-0.5 text-xs font-medium"
							>
								{order.is_active ? 'Активен' : 'Неактивен'}
							</span>
						{:else if order.status}
							<span
								class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
							>
								{order.status}
							</span>
						{/if}
					</div>
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
								Компания
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								<div>{order.company?.name || order.supplier || 'Не указана'}</div>
								{#if order.company?.legal_name}
									<div class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
										{order.company.legal_name}
									</div>
								{/if}
							</dd>
						</div>

						<div>
							<dt
								class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Клиент
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{order.project?.value || 'Не указан'}
							</dd>
						</div>

						{#if order.project?.phones && order.project.phones.length > 0}
							<div>
								<dt
									class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
								>
									Телефон клиента
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{#each order.project.phones as phone, index}
										{#if index > 0}<br />{/if}
										<a
											href="tel:{phone.value}"
											class="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
										>
											{formatPhone(phone.value)}
										</a>
										{#if phone.contact_person}
											<span class="ml-2 text-xs text-gray-500 dark:text-gray-400">
												({phone.contact_person})
											</span>
										{/if}
									{/each}
								</dd>
							</div>
						{/if}

						{#if order.project?.region}
							<div>
								<dt
									class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
								>
									Адрес объекта
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{order.project.region}
								</dd>
							</div>
						{/if}

						<div>
							<dt
								class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Описание
							</dt>
							<dd class="mt-1 whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
								{order.value || order.deal || order.comment || 'Нет описания'}
							</dd>
						</div>
					</div>

					<!-- Additional Information -->
					<div class="space-y-4">
						<h5 class="text-sm font-medium text-gray-900 dark:text-white">
							Дополнительная информация
						</h5>

						{#if order.delivery_date}
							<div>
								<dt
									class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
								>
									Планируемая дата поставки
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{new Date(order.delivery_date).toLocaleDateString('ru-RU')}
								</dd>
							</div>
						{/if}

						{#if order.actual_delivery_date}
							<div>
								<dt
									class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
								>
									Фактическая дата поставки
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{new Date(order.actual_delivery_date).toLocaleDateString('ru-RU')}
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

				<!-- Positions if available -->
				{#if order.positions && order.positions.length > 0}
					<div class="mt-6 border-t border-gray-200 pt-6 dark:border-gray-600">
						<h5 class="mb-4 text-sm font-medium text-gray-900 dark:text-white">Позиции заказа</h5>

						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
								<thead class="bg-gray-50 dark:bg-gray-700">
									<tr>
										<th
											class="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400"
										>
											Наименование
										</th>
										<th
											class="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400"
										>
											Артикул
										</th>
										<th
											class="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400"
										>
											Цена
										</th>
										<th
											class="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400"
										>
											Кол-во
										</th>
										<th
											class="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400"
										>
											Итого
										</th>
									</tr>
								</thead>
								<tbody
									class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800"
								>
									{#each order.positions as position}
										<tr>
											<td class="px-3 py-3 text-sm text-gray-900 dark:text-white">
												<div class="font-medium">{position.value}</div>
												{#if position.supplier}
													<div class="text-xs text-gray-500 dark:text-gray-400">
														Поставщик: {position.supplier}
													</div>
												{/if}
												{#if position.is_urgent}
													<span
														class="mt-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200"
													>
														Срочная
													</span>
												{/if}
											</td>
											<td class="px-3 py-3 text-sm text-gray-900 dark:text-white">
												{position.article}
											</td>
											<td class="px-3 py-3 text-right text-sm text-gray-900 dark:text-white">
												{position.price.toLocaleString('ru-RU')} ₽
											</td>
											<td class="px-3 py-3 text-right text-sm text-gray-900 dark:text-white">
												{position.count}
											</td>
											<td
												class="px-3 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white"
											>
												{position.total_price.toLocaleString('ru-RU')} ₽
											</td>
										</tr>
									{/each}
								</tbody>
								<tfoot class="bg-gray-50 dark:bg-gray-700">
									<tr>
										<td
											colspan="4"
											class="px-3 py-3 text-right text-sm font-medium text-gray-900 dark:text-white"
										>
											Общая сумма:
										</td>
										<td
											class="px-3 py-3 text-right text-sm font-bold text-gray-900 dark:text-white"
										>
											{order.positions
												.reduce((sum, p) => sum + p.total_price, 0)
												.toLocaleString('ru-RU')} ₽
										</td>
									</tr>
								</tfoot>
							</table>
						</div>
					</div>
				{:else if order.items && order.items.length > 0}
					<!-- Fallback for old structure -->
					<div class="mt-6 border-t border-gray-200 pt-6 dark:border-gray-600">
						<h5 class="text-sm font-medium text-gray-900 dark:text-white">Товары в заказе</h5>

						<div class="mt-4 space-y-3">
							{#each order.items as item}
								<div
									class="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-700"
								>
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
