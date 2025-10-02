<script>
	let { action, isOpen = false, onClose } = $props();

	// Format date helper function
	function formatDate(dateString) {
		if (!dateString) return 'Не указан';
		return new Date(dateString).toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Close modal on Escape key
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

<svelte:window on:keydown={handleKeydown} />

{#if isOpen && action}
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
				class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6 dark:bg-gray-800"
				onclick={(e) => e.stopPropagation()}
				onkeydown={handleKeydown}
				tabindex="0"
				role="dialog"
			>
			<!-- Modal header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
				<div>
					<h2 id="modal-title" class="text-xl font-semibold text-gray-900 dark:text-white">
						Детали акции
					</h2>
					<p id="modal-description" class="text-sm text-gray-500 dark:text-gray-400">
						ID: {action.id}
					</p>
				</div>
				<button
					type="button"
					onclick={onClose}
					class="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:hover:bg-gray-700 dark:hover:text-gray-300"
					aria-label="Закрыть модальное окно"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Modal body -->
			<div class="px-6 py-4">
				<div class="grid gap-6 md:grid-cols-2">
					<!-- Основная информация -->
					<div class="space-y-4">
						<h3 class="text-lg font-medium text-gray-900 dark:text-white">Основная информация</h3>
						
						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Компания</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{action.company_name || 'Не указано'}
							</dd>
						</div>

						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Название акции</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{action.action_name || 'Не указано'}
							</dd>
						</div>

						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Телефон</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{action.phone || 'Не указан'}
							</dd>
						</div>

						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Контактное лицо</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{action.contact_person || 'Не указано'}
							</dd>
						</div>

						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Регион</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{action.region || 'Не указан'}
							</dd>
						</div>
					</div>

					<!-- Период и детали -->
					<div class="space-y-4">
						<h3 class="text-lg font-medium text-gray-900 dark:text-white">Период и детали</h3>
						
						<div>
							<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Период проведения</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{#if action.start_date && action.end_date}
									с {formatDate(action.start_date)} по {formatDate(action.end_date)}
								{:else if action.start_date}
									с {formatDate(action.start_date)}
								{:else if action.end_date}
									до {formatDate(action.end_date)}
								{:else}
									Не указан
								{/if}
							</dd>
						</div>

						{#if action.description}
							<div>
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Описание</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white leading-relaxed">
									{action.description}
								</dd>
							</div>
						{/if}

						{#if action.comment}
							<div>
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Комментарий</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white leading-relaxed">
									{action.comment}
								</dd>
							</div>
						{/if}

						{#if action.created_at}
							<div>
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Дата создания</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{formatDate(action.created_at)}
								</dd>
							</div>
						{/if}

						{#if action.updated_at}
							<div>
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Последнее обновление</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{formatDate(action.updated_at)}
								</dd>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Modal footer -->
			<div class="flex justify-end border-t border-gray-200 px-6 py-4 dark:border-gray-700">
				<button
					type="button"
					onclick={onClose}
					class="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
				>
					Закрыть
				</button>
			</div>
			</div>
		</div>
	</div>
{/if}