<script>
	import { formatPhone } from '$lib/utils/formatters.js';

	let { isOpen = false, tz = null, onClose } = $props();

	let modalElement = $state();
	let previousActiveElement;

	function getApprovalStatus(tz) {
		if (tz?.is_approved) return { text: 'Согласовано', color: 'green' };
		if (tz?.requires_approval) return { text: 'Требуется', color: 'yellow' };
		return { text: 'Не требуется', color: 'gray' };
	}

	function getCuratorName(tz) {
		// Сначала проверяем curator (belongsToMany)
		const curator = tz?.project?.curator?.[0];
		if (curator?.name) return curator.name;
		
		// Если нет, ищем в projectUsers с ролью curator
		const curatorUser = tz?.project?.projectUsers?.find(pu => pu.role === 'curator');
		if (curatorUser?.user?.name) return curatorUser.user.name;
		
		return 'Не указан';
	}

	function getCuratorPhone(tz) {
		// Сначала проверяем curator (belongsToMany)
		const curator = tz?.project?.curator?.[0];
		if (curator?.phones && curator.phones.length > 0) {
			const primaryPhone = curator.phones.find((p) => p.is_primary);
			return primaryPhone?.value || curator.phones[0]?.value || null;
		}
		
		// Если нет, ищем в projectUsers с ролью curator
		const curatorUser = tz?.project?.projectUsers?.find(pu => pu.role === 'curator');
		const phones = curatorUser?.user?.phones;
		if (phones && phones.length > 0) {
			const primaryPhone = phones.find((p) => p.is_primary);
			return primaryPhone?.value || phones[0]?.value || null;
		}
		
		return null;
	}

	function getAgentName(tz) {
		// Сначала проверяем agent (belongsTo)
		if (tz?.project?.agent?.name) return tz.project.agent.name;
		
		// Если нет, ищем в projectUsers с ролью agent
		const agentUser = tz?.project?.projectUsers?.find(pu => pu.role === 'agent');
		if (agentUser?.user?.name) return agentUser.user.name;
		
		return 'Не указан';
	}

	function getAgentPhone(tz) {
		// Сначала проверяем agent (belongsTo)
		const phones = tz?.project?.agent?.phones;
		if (phones && phones.length > 0) {
			const primaryPhone = phones.find((p) => p.is_primary);
			return primaryPhone?.value || phones[0]?.value || null;
		}
		
		// Если нет, ищем в projectUsers с ролью agent
		const agentUser = tz?.project?.projectUsers?.find(pu => pu.role === 'agent');
		const agentPhones = agentUser?.user?.phones;
		if (agentPhones && agentPhones.length > 0) {
			const primaryPhone = agentPhones.find((p) => p.is_primary);
			return primaryPhone?.value || agentPhones[0]?.value || null;
		}
		
		return null;
	}

	function isIncognito(tz) {
		return tz?.project?.is_incognito === true;
	}

	function getClientName(tz) {
		return tz?.project?.client?.name || 'Не указан';
	}

	function getClientPhone(tz) {
		const phones = tz?.project?.client?.phones;
		if (!phones || phones.length === 0) return null;
		const primaryPhone = phones.find((p) => p.is_primary);
		return primaryPhone?.value || phones[0]?.value || null;
	}

	function getClientAddress(tz) {
		return tz?.project?.region || 'Не указан';
	}

	function handleFileDownload(event, fileUrl, fileName) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		if (!fileUrl) return;

		// Create a temporary link element and trigger download
		const link = document.createElement('a');
		link.href = fileUrl;
		link.download = fileName || '';
		link.target = '_blank';
		link.rel = 'noopener noreferrer';
		
		// Append to body, click, and remove
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

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

{#if isOpen && tz}
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
				<div
					class="relative overflow-hidden bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 px-6 py-5"
				>
					<div class="bg-grid-white/10 absolute inset-0"></div>
					<div class="relative flex items-start justify-between">
						<div>
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm"
								>
									<svg
										class="h-5 w-5 text-white"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
										/>
									</svg>
								</div>
								<div>
									<h2 class="text-xl font-bold text-white">
										{tz.value || `Техзадание #${tz.id}`}
									</h2>
									<p class="mt-0.5 text-sm text-violet-100">
										{tz.project?.project_number || 'Проект не указан'}
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
							<svg
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
					<!-- Status badges -->
					<div class="relative mt-4 flex flex-wrap gap-2">
						{#if getApprovalStatus(tz).color === 'green'}
							<span
								class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-100"
							>
								<span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
								{getApprovalStatus(tz).text}
							</span>
						{:else if getApprovalStatus(tz).color === 'yellow'}
							<span
								class="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-100"
							>
								<span class="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
								{getApprovalStatus(tz).text}
							</span>
						{:else}
							<span
								class="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white"
							>
								<span class="h-1.5 w-1.5 rounded-full bg-white/60"></span>
								{getApprovalStatus(tz).text}
							</span>
						{/if}
					</div>
				</div>

				<!-- Content -->
				<div class="max-h-[calc(100vh-280px)] overflow-y-auto p-6">
					<div class="grid gap-6 lg:grid-cols-2">
						<!-- Left column -->
						<div class="space-y-6">
							<!-- Participants Card -->
							<div
								class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
							>
								<h3
									class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
								>
									<svg
										class="h-4 w-4 text-violet-500"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
										/>
									</svg>
									Участники
								</h3>
								<div class="space-y-4">
									<!-- Curator -->
									<div>
										<p
											class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
										>
											Куратор
										</p>
										<p class="mt-1 font-medium text-gray-900 dark:text-white">
											{getCuratorName(tz)}
										</p>
										{#if getCuratorPhone(tz)}
											<a
												href="tel:{getCuratorPhone(tz)}"
												class="mt-0.5 text-sm text-violet-600 hover:text-violet-500 dark:text-violet-400"
											>
												{formatPhone(getCuratorPhone(tz))}
											</a>
										{/if}
									</div>
									<!-- Agent (if not incognito) -->
									{#if !isIncognito(tz)}
										<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
											<p
												class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
											>
												Агент
											</p>
											<p class="mt-1 font-medium text-gray-900 dark:text-white">
												{getAgentName(tz)}
											</p>
											{#if getAgentPhone(tz)}
												<a
													href="tel:{getAgentPhone(tz)}"
													class="mt-0.5 text-sm text-violet-600 hover:text-violet-500 dark:text-violet-400"
												>
													{formatPhone(getAgentPhone(tz))}
												</a>
											{/if}
										</div>
									{/if}
								</div>
							</div>

							<!-- Client Card -->
							<div
								class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
							>
								<h3
									class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
								>
									<svg
										class="h-4 w-4 text-violet-500"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										/>
									</svg>
									Клиент
								</h3>
								<div class="space-y-4">
									<div>
										<p
											class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
										>
											Имя
										</p>
										<p class="mt-1 font-medium text-gray-900 dark:text-white">
											{getClientName(tz)}
										</p>
									</div>
									{#if getClientPhone(tz)}
										<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
											<p
												class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
											>
												Телефон
											</p>
											<a
												href="tel:{getClientPhone(tz)}"
												class="mt-1 block text-sm font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
											>
												{formatPhone(getClientPhone(tz))}
											</a>
										</div>
									{/if}
									<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
										<p
											class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
										>
											Адрес
										</p>
										<p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
											{getClientAddress(tz)}
										</p>
									</div>
								</div>
							</div>

							<!-- Comment Card -->
							{#if tz.comment || tz.description}
								<div
									class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
								>
									<h3
										class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
									>
										<svg
											class="h-4 w-4 text-violet-500"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
											/>
										</svg>
										{tz.description ? 'Описание' : 'Комментарий'}
									</h3>
									<p class="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
										{tz.description || tz.comment}
									</p>
								</div>
							{/if}
						</div>

						<!-- Right column -->
						<div class="space-y-6">
							<!-- Sketches Card -->
							<div
								class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
							>
								<h3
									class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
								>
									<svg
										class="h-4 w-4 text-violet-500"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
									Техзадания
								</h3>
								{#if tz.sketches && tz.sketches.length > 0}
									<div class="space-y-2">
										{#each tz.sketches as sketch}
											<div
												class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800"
											>
												<div class="min-w-0 flex-1">
													<p
														class="truncate text-sm font-medium text-gray-900 dark:text-white"
														title={sketch.file_name}
													>
														{sketch.file_name}
													</p>
													<div
														class="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
													>
														{#if sketch.file_size}
															<span>{(sketch.file_size / 1024 / 1024).toFixed(2)} MB</span>
														{/if}
														{#if sketch.uploader}
															<span>•</span>
															<span class="truncate"
																>{sketch.uploader.name || sketch.uploader.email}</span
															>
														{/if}
													</div>
												</div>
												<button
													type="button"
													onclick={(e) => handleFileDownload(e, sketch.download_url, sketch.file_name)}
													class="ml-3 inline-flex items-center rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-500 transition-colors"
												>
													<svg
														class="mr-1 h-3.5 w-3.5"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
														/>
													</svg>
													Скачать
												</button>
											</div>
										{/each}
									</div>
								{:else}
									<p class="text-sm text-gray-500 dark:text-gray-400">Техзадания не загружены</p>
								{/if}
							</div>

							<!-- Commercial Offers Card -->
							<div
								class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
							>
								<h3
									class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
								>
									<svg
										class="h-4 w-4 text-violet-500"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
									Коммерческие предложения
								</h3>
								{#if tz.commercialOffers && tz.commercialOffers.length > 0}
									<div class="space-y-2">
										{#each tz.commercialOffers as offer}
											<div
												class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800"
											>
												<div class="min-w-0 flex-1">
													<p
														class="truncate text-sm font-medium text-gray-900 dark:text-white"
														title={offer.file_name}
													>
														{offer.file_name}
													</p>
													<div
														class="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
													>
														{#if offer.file_size}
															<span>{(offer.file_size / 1024 / 1024).toFixed(2)} MB</span>
														{/if}
														{#if offer.uploader}
															<span>•</span>
															<span class="truncate"
																>{offer.uploader.name || offer.uploader.email}</span
															>
														{/if}
													</div>
												</div>
												<button
													type="button"
													onclick={(e) => handleFileDownload(e, offer.download_url, offer.file_name)}
													class="ml-3 inline-flex items-center rounded-lg bg-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-fuchsia-500 transition-colors"
												>
													<svg
														class="mr-1 h-3.5 w-3.5"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
														/>
													</svg>
													Скачать
												</button>
											</div>
										{/each}
									</div>
								{:else}
									<p class="text-sm text-gray-500 dark:text-gray-400">
										Коммерческие предложения не загружены
									</p>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- Footer -->
				<div
					class="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50"
				>
					<div class="flex items-center justify-between">
						<div class="flex flex-col gap-0.5 text-xs text-gray-400 dark:text-gray-500">
							<span>Создан: {formatDateTime(tz.created_at)}</span>
							{#if tz.updated_at && tz.updated_at !== tz.created_at}
								<span>Обновлён: {formatDateTime(tz.updated_at)}</span>
							{/if}
						</div>
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
