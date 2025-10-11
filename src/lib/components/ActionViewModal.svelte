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

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && action}
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
				onclick={(e) => e.stopPropagation()}
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
						Просмотр акции
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
					<!-- Action header -->
					<div class="mb-6 flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<h4 class="text-xl font-bold text-gray-900 dark:text-white">
								{action.action_name || 'Название не указано'}
							</h4>
						</div>
					</div>

					<!-- Action details grid -->
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<!-- Basic Information -->
						<div class="space-y-4">
							<h5 class="text-base font-semibold text-gray-900 dark:text-white">
								Основная информация:
							</h5>

							<div>
								<dt
									class="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300"
								>
									Компания
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{action.company_name || 'Не указана'}
								</dd>
							</div>

							<div>
								<dt
									class="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300"
								>
									Название акции
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{action.action_name || 'Не указано'}
								</dd>
							</div>

							{#if action.description}
								<div>
									<dt
										class="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300"
									>
										Описание
									</dt>
									<dd class="mt-1 whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
										{action.description}
									</dd>
								</div>
							{/if}

							{#if action.comment}
								<div>
									<dt
										class="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300"
									>
										Комментарий
									</dt>
									<dd class="mt-1 whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
										{action.comment}
									</dd>
								</div>
							{/if}
						</div>

						<!-- Period and Details -->
						<div class="space-y-4">
							<h5 class="text-base font-semibold text-gray-900 dark:text-white">
								Период и детали:
							</h5>

							<div>
								<dt
									class="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300"
								>
									Период проведения
								</dt>
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

							{#if action.created_at}
								<div>
									<dt
										class="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300"
									>
										Дата создания
									</dt>
									<dd class="mt-1 text-sm text-gray-900 dark:text-white">
										{formatDate(action.created_at)}
									</dd>
								</div>
							{/if}

							{#if action.updated_at}
								<div>
									<dt
										class="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300"
									>
										Дата обновления
									</dt>
									<dd class="mt-1 text-sm text-gray-900 dark:text-white">
										{formatDate(action.updated_at)}
									</dd>
								</div>
							{/if}
						</div>
					</div>
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
{/if}
