<script>
	import { formatPhone } from '$lib/utils/formatters.js';

	let { isOpen = false, user = null, onClose } = $props();

	let modalElement = $state();
	let previousActiveElement;

	function formatDate(dateString) {
		if (!dateString) return 'Не указана';
		return new Date(dateString).toLocaleDateString('ru-RU', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function formatDateTime(dateString) {
		if (!dateString) return 'Не указана';
		return new Date(dateString).toLocaleString('ru-RU', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function shouldShowUpdatedDate(user) {
		if (!user?.updated_at || !user?.created_at) return false;
		const createdDate = new Date(user.created_at).getTime();
		const updatedDate = new Date(user.updated_at).getTime();
		return Math.abs(updatedDate - createdDate) > 1000;
	}

	function getUserStatus(user) {
		return user?.status === 'banned' || user?.status === 'inactive' || user?.status === 'suspended'
			? 'inactive'
			: 'active';
	}

	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}

	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen) {
			handleClose();
		}
	}

	function handleClose() {
		if (onClose) {
			onClose();
		}
	}

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

	function handleTabKey(event) {
		if (!isOpen) return;
		const focusableElements = modalElement?.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		if (!focusableElements || focusableElements.length === 0) return;
		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];
		if (event.key === 'Tab') {
			if (event.shiftKey) {
				if (document.activeElement === firstElement) {
					event.preventDefault();
					lastElement.focus();
				}
			} else {
				if (document.activeElement === lastElement) {
					event.preventDefault();
					firstElement.focus();
				}
			}
		}
	}
</script>

{#if isOpen && user}
	<div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
		<!-- Backdrop with blur -->
		<div
			class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
			onclick={handleBackdropClick}
			aria-hidden="true"
		></div>

		<div class="flex min-h-full items-center justify-center p-4">
			<!-- Modal panel -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				bind:this={modalElement}
				class="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-gray-900"
				onkeydown={handleTabKey}
				tabindex="-1"
				role="document"
			>
				<!-- Header with gradient -->
				<div class="relative overflow-hidden bg-gradient-to-r from-slate-700 via-gray-600 to-zinc-600 px-6 py-5">
					<div class="absolute inset-0 bg-grid-white/10"></div>
					<div class="relative flex items-start justify-between">
						<div>
							<div class="flex items-center gap-3">
								<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
									<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
								</div>
								<div>
									<h2 class="text-xl font-bold text-white">
										{user.name || 'Пользователь'}
									</h2>
									<p class="mt-0.5 text-sm text-gray-300">
										{user.email || 'Email не указан'}
									</p>
								</div>
							</div>
						</div>
						<button
							type="button"
							onclick={handleClose}
							aria-label="Закрыть"
							class="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
					<!-- Status badges -->
					<div class="relative mt-4 flex flex-wrap gap-2">
						<span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium {getUserStatus(user) === 'active' ? 'bg-emerald-500/20 text-emerald-100' : 'bg-red-500/20 text-red-100'}">
							<span class="h-1.5 w-1.5 rounded-full {getUserStatus(user) === 'active' ? 'bg-emerald-400' : 'bg-red-400'}"></span>
							{getUserStatus(user) === 'active' ? 'Активен' : 'Заблокирован'}
						</span>
						{#if user.region}
							<span class="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
								<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
								</svg>
								{user.region}
							</span>
						{/if}
					</div>
				</div>

				<!-- Content -->
				<div class="max-h-[calc(100vh-280px)] overflow-y-auto p-6">
					<div class="grid gap-6 lg:grid-cols-2">
						<!-- Left column -->
						<div class="space-y-6">
							<!-- Contact Info Card -->
							<div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
								<h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
									<svg class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
									</svg>
									Контакты
								</h3>
								<div class="space-y-4">
									<div>
										<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Email</p>
										{#if user.email}
											<a href="mailto:{user.email}" class="mt-1 block text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
												{user.email}
											</a>
										{:else}
											<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">—</p>
										{/if}
									</div>
									{#if user.phones && user.phones.length > 0}
										<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
											<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Телефоны</p>
											<div class="mt-2 space-y-1">
												{#each user.phones as phone}
													<div class="flex items-center gap-2">
														<a href="tel:{phone.value}" class="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
															{formatPhone(phone.value)}
														</a>
														{#if phone.is_primary}
															<span class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">основной</span>
														{/if}
													</div>
												{/each}
											</div>
										</div>
									{:else if user.phone}
										<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
											<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Телефон</p>
											<a href="tel:{user.phone}" class="mt-1 block text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
												{formatPhone(user.phone)}
											</a>
										</div>
									{/if}
								</div>
							</div>

							<!-- Agent Info Card (for clients) -->
							{#if user.agent}
								<div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
									<h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
										<svg class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
										</svg>
										Агент
									</h3>
									<div class="space-y-2">
										<p class="font-medium text-gray-900 dark:text-white">{user.agent.name}</p>
										{#if user.agent.email}
											<a href="mailto:{user.agent.email}" class="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
												{user.agent.email}
											</a>
										{/if}
									</div>
								</div>
							{/if}
						</div>

						<!-- Right column -->
						<div class="space-y-6">
							<!-- Account Info Card -->
							<div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
								<h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
									<svg class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
									Аккаунт
								</h3>
								<div class="space-y-4">
									<div>
										<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Дата регистрации</p>
										<p class="mt-1 font-medium text-gray-900 dark:text-white">{formatDateTime(user.created_at)}</p>
									</div>
									{#if shouldShowUpdatedDate(user)}
										<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
											<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Последнее обновление</p>
											<p class="mt-1 text-sm text-gray-900 dark:text-white">{formatDateTime(user.updated_at)}</p>
										</div>
									{/if}
								</div>
							</div>

							<!-- Additional Info Card -->
							{#if user.bio || user.website || user.address || user.birth_date}
								<div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
									<h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
										<svg class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										Дополнительно
									</h3>
									<div class="space-y-4">
										{#if user.website}
											<div>
												<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Веб-сайт</p>
												<a href={user.website} target="_blank" rel="noopener noreferrer" class="mt-1 block text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
													{user.website}
												</a>
											</div>
										{/if}
										{#if user.address}
											<div class="{user.website ? 'border-t border-gray-200 pt-4 dark:border-gray-700' : ''}">
												<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Адрес</p>
												<p class="mt-1 text-sm text-gray-900 dark:text-white">{user.address}</p>
											</div>
										{/if}
										{#if user.birth_date}
											<div class="{user.website || user.address ? 'border-t border-gray-200 pt-4 dark:border-gray-700' : ''}">
												<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Дата рождения</p>
												<p class="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(user.birth_date)}</p>
											</div>
										{/if}
										{#if user.bio}
											<div class="{user.website || user.address || user.birth_date ? 'border-t border-gray-200 pt-4 dark:border-gray-700' : ''}">
												<p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">О себе</p>
												<p class="mt-1 text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">{user.bio}</p>
											</div>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					</div>

					<!-- Projects Section (for clients) -->
					{#if user.projects && user.projects.length > 0}
						{@const uniqueAgents = user.projects
							.filter((p) => p.agent)
							.reduce((acc, p) => {
								if (!acc.find((a) => a.id === p.agent.id)) {
									acc.push(p.agent);
								}
								return acc;
							}, [])}

						<div class="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
							<h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
								<svg class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
								</svg>
								Проекты ({user.projects.length})
							</h3>
							<div class="grid gap-4 lg:grid-cols-2">
								<!-- Agents -->
								{#if uniqueAgents.length > 0}
									<div>
										<p class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Агенты</p>
										<div class="space-y-2">
											{#each uniqueAgents as agent}
												<div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
													<p class="font-medium text-gray-900 dark:text-white">{agent.name}</p>
													{#if agent.email}
														<a href="mailto:{agent.email}" class="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
															{agent.email}
														</a>
													{/if}
												</div>
											{/each}
										</div>
									</div>
								{/if}
								<!-- Projects list -->
								<div>
									<p class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Список проектов</p>
									<div class="space-y-2">
										{#each user.projects as project}
											<div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
												{#if project.value}
													<p class="font-medium text-gray-900 dark:text-white">{project.value}</p>
												{/if}
												{#if project.contract_number}
													<p class="text-xs text-gray-500 dark:text-gray-400">Договор: {project.contract_number}</p>
												{/if}
												{#if project.agent}
													<p class="text-xs text-gray-500 dark:text-gray-400">Агент: {project.agent.name}</p>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Footer -->
				<div class="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
					<div class="flex justify-end">
						<button
							type="button"
							onclick={handleClose}
							class="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white dark:focus:ring-gray-100"
						>
							Закрыть
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
