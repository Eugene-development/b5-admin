<script>
	import { formatPhone } from '$lib/utils/formatters.js';
	
	let { service = null, isOpen = false, onClose } = $props();

	// Close modal on escape key
	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen) {
			onClose();
		}
	}

	// Close modal when clicking outside
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	// Handle body scroll when modal is open/closed
	$effect(() => {
		if (isOpen) {
			// Prevent body scroll when modal is open
			document.body.style.overflow = 'hidden';
		} else {
			// Restore body scroll when modal is closed
			document.body.style.overflow = '';
		}

		// Cleanup on component unmount
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && service}
	<!-- Modal backdrop -->
	<div
		class="animate-fade animate-duration-100 animate-ease-linear fixed inset-0 z-50 overflow-y-auto"
		aria-labelledby="modal-title"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
		>
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
				class="relative w-full transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:max-w-4xl sm:p-6 dark:bg-gray-800"
				onclick={(e) => e.stopPropagation()}
				onkeydown={handleKeydown}
				tabindex="0"
				role="dialog"
			>
			<!-- Modal header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
				<h2 id="modal-title" class="text-lg font-semibold text-gray-900 dark:text-white">
					Информация о сервисе
				</h2>
				<button
					type="button"
					onclick={onClose}
					class="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
					aria-label="Закрыть модальное окно"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Modal body -->
			<div class="px-6 py-4">
				<dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">ID</dt>
						<dd class="mt-1 text-sm text-gray-900 dark:text-white">{service.id}</dd>
					</div>

					<div>
						<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Статус</dt>
						<dd class="mt-1">
							<span
								class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
								{service.status === 'active'
									? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
									: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}"
							>
								{service.status === 'active' ? 'Активен' : 'Неактивен'}
							</span>
						</dd>
					</div>

					<div class="sm:col-span-2">
						<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Услуга</dt>
						<dd class="mt-1 text-sm text-gray-900 dark:text-white">
							{service.service_name || 'Не указано'}
						</dd>
					</div>

					<div class="sm:col-span-2">
						<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Компания</dt>
						<dd class="mt-1 text-sm text-gray-900 dark:text-white">
							{service.company_name || 'Не указано'}
						</dd>
					</div>

					<div class="sm:col-span-2">
						<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Юридическое название</dt>
						<dd class="mt-1 text-sm text-gray-900 dark:text-white">
							{service.legal_name || 'Не указано'}
						</dd>
					</div>

					<div>
						<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">ИНН</dt>
						<dd class="mt-1 text-sm text-gray-900 dark:text-white">
							{service.inn || 'Не указан'}
						</dd>
					</div>

					<div>
						<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Регион</dt>
						<dd class="mt-1 text-sm text-gray-900 dark:text-white">
							{service.region || 'Не указан'}
						</dd>
					</div>

					<div>
						<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
						<dd class="mt-1 text-sm text-gray-900 dark:text-white">
							{#if service.email}
								<a
									href="mailto:{service.email}"
									class="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
								>
									{service.email}
								</a>
							{:else}
								Не указана
							{/if}
						</dd>
					</div>

					<div>
						<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Телефон</dt>
						<dd class="mt-1 text-sm text-gray-900 dark:text-white">
							{#if service.phone}
								<a
									href="tel:{service.phone}"
									class="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
								>
									{formatPhone(service.phone)}
								</a>
							{:else}
								Не указан
							{/if}
						</dd>
					</div>

					<div class="sm:col-span-2">
						<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Контактное лицо</dt>
						<dd class="mt-1 text-sm text-gray-900 dark:text-white">
							{service.contact_person || 'Не указано'}
						</dd>
					</div>

					<div class="sm:col-span-2">
						<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Характеристика</dt>
						<dd class="mt-1 text-sm text-gray-900 dark:text-white">
							{service.characteristics || 'Не указана'}
						</dd>
					</div>

					{#if service.description}
						<div class="sm:col-span-2">
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Описание</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{service.description}
							</dd>
						</div>
					{/if}

					{#if service.created_at}
						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Дата создания</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{new Date(service.created_at).toLocaleDateString('ru-RU', {
									year: 'numeric',
									month: 'long',
									day: 'numeric',
									hour: '2-digit',
									minute: '2-digit'
								})}
							</dd>
						</div>
					{/if}

					<!-- {#if service.updated_at}
						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Дата обновления</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{new Date(service.updated_at).toLocaleDateString('ru-RU', {
									year: 'numeric',
									month: 'long',
									day: 'numeric',
									hour: '2-digit',
									minute: '2-digit'
								})}
							</dd>
						</div>
					{/if} -->
				</dl>
			</div>

			<!-- Modal footer -->
			<div class="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
				<div class="flex justify-end">
					<button
						type="button"
						onclick={onClose}
						class="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-600"
					>
						Закрыть
					</button>
				</div>
			</div>
			</div>
		</div>
	</div>
{/if}