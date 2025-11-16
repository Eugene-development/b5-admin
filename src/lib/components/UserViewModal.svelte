<script>
	import StatusBadge from './StatusBadge.svelte';
	import { formatPhone } from '$lib/utils/formatters.js';

	let { isOpen = false, user = null, onClose } = $props();

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

	// Get user status for StatusBadge
	function getUserStatus(user) {
		return user?.status === 'banned' || user?.status === 'inactive' || user?.status === 'suspended'
			? 'banned'
			: 'active';
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

{#if isOpen && user}
	<!-- Modal backdrop -->
	<div
		class="fixed inset-0 z-50 animate-fade overflow-y-auto animate-duration-100 animate-ease-linear"
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
				class="relative w-full transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:max-w-4xl sm:p-6 dark:bg-gray-800"
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
						class="text-lg leading-6 font-semibold text-gray-900 dark:text-white"
						id="modal-title"
					>
						Информация
					</h3>
					<button
						type="button"
						onclick={onClose}
						class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white"
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
					<!-- User header -->
					<div class="mb-6 flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<!-- <h4 class="text-xl font-bold text-gray-900 dark:text-white">
								{user.name || 'Имя не указано'}
							</h4> -->
							<!-- <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
								{user.email}
							</p> -->
						</div>
						<div class="ml-4 flex flex-shrink-0 gap-2 space-y-2">
							<div>
								<StatusBadge status={getUserStatus(user)} />
							</div>
						</div>
					</div>

					<!-- User details grid -->
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<!-- Basic Information -->
						<div class="space-y-4">
							<h5 class="text-sm font-medium text-gray-900 dark:text-white">Основная информация</h5>

							<div>
								<dt
									class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
								>
									Имя
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{user.name || 'Не указано'}
								</dd>
							</div>

							<div>
								<dt
									class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
								>
									Email
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{#if user.email}
										<a
											href="mailto:{user.email}"
											class="text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
										>
											{user.email}
										</a>
									{:else}
										Не указан
									{/if}
								</dd>
							</div>

							<!-- Agent (for clients) -->
							{#if user.agent}
								<div>
									<dt
										class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
									>
										Агент
									</dt>
									<dd class="mt-1 text-sm text-gray-900 dark:text-white">
										{user.agent.name}
										{#if user.agent.email}
											<div class="text-xs text-gray-500 dark:text-gray-400">
												<a
													href="mailto:{user.agent.email}"
													class="text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
												>
													{user.agent.email}
												</a>
											</div>
										{/if}
									</dd>
								</div>
							{/if}

							<div>
								<dt
									class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
								>
									Регион
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{user.region || 'Не указан'}
								</dd>
							</div>

							<!-- Phone from phones array (for clients) or direct phone field (for users) -->
							{#if user.phones && user.phones.length > 0}
								<div>
									<dt
										class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
									>
										Телефон
									</dt>
									<dd class="mt-1 space-y-1">
										{#each user.phones as phone, index}
											<div class="text-sm text-gray-900 dark:text-white">
												<a
													href="tel:{phone.value}"
													class="text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
												>
													{formatPhone(phone.value)}
												</a>
												{#if phone.is_primary}
													<span class="ml-2 text-xs text-gray-500 dark:text-gray-400">(основной)</span>
												{/if}
											</div>
										{/each}
									</dd>
								</div>
							{:else if user.phone}
								<div>
									<dt
										class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
									>
										Телефон
									</dt>
									<dd class="mt-1 text-sm text-gray-900 dark:text-white">
										<a
											href="tel:{user.phone}"
											class="text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
										>
											{formatPhone(user.phone)}
										</a>
									</dd>
								</div>
							{/if}
						</div>

						<!-- Account Information -->
						<div class="space-y-4">
							<h5 class="text-sm font-medium text-gray-900 dark:text-white">
								Информация об аккаунте
							</h5>

							<div>
								<dt
									class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
								>
									Статус аккаунта
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{#if user.status === 'banned'}
										Заблокирован
									{:else if user.status === 'inactive'}
										Неактивен
									{:else if user.status === 'suspended'}
										Приостановлен
									{:else}
										Активен
									{/if}
								</dd>
							</div>

							<div>
								<dt
									class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
								>
									Дата регистрации
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{formatDate(user.created_at)}
								</dd>
							</div>

							{#if user.updated_at}
								<div>
									<dt
										class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
									>
										Последнее обновление
									</dt>
									<dd class="mt-1 text-sm text-gray-900 dark:text-white">
										{formatDate(user.updated_at)}
									</dd>
								</div>
							{/if}
						</div>
					</div>

					<!-- Additional Information -->
					{#if user.bio || user.website || user.address || user.birth_date}
						<div class="mt-6 border-t border-gray-200 pt-6 dark:border-gray-600">
							<h5 class="text-sm font-medium text-gray-900 dark:text-white">
								Дополнительная информация
							</h5>

							<div class="mt-4 space-y-4">
								{#if user.website}
									<div>
										<dt
											class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
										>
											Веб-сайт
										</dt>
										<dd class="mt-1 text-sm text-gray-900 dark:text-white">
											<a
												href={user.website}
												target="_blank"
												rel="noopener noreferrer"
												class="text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
											>
												{user.website}
											</a>
										</dd>
									</div>
								{/if}

								{#if user.address}
									<div>
										<dt
											class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
										>
											Адрес
										</dt>
										<dd class="mt-1 text-sm text-gray-900 dark:text-white">
											{user.address}
										</dd>
									</div>
								{/if}

								{#if user.birth_date}
									<div>
										<dt
											class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
										>
											Дата рождения
										</dt>
										<dd class="mt-1 text-sm text-gray-900 dark:text-white">
											{formatDate(user.birth_date)}
										</dd>
									</div>
								{/if}

								{#if user.bio}
									<div>
										<dt
											class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
										>
											О себе
										</dt>
										<dd class="mt-1 text-sm text-gray-900 dark:text-white">
											{user.bio}
										</dd>
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<!-- Modal footer -->
				<div class="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-600">
					<button
						type="button"
						onclick={onClose}
						class="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
					>
						Закрыть
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
