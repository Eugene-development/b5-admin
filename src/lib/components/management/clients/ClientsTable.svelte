<script>
	import StatusBadge from '$lib/components/common/StatusBadge.svelte';
	import EmptyState from '$lib/components/common/EmptyState.svelte';
	import { formatPhone } from '$lib/utils/formatters.js';
	import { authState } from '$lib/state/auth.svelte.js';

	let {
		users = [],
		isLoading = false,
		onViewUser,
		onEditUser,
		updateCounter = 0,
		searchTerm = '',
		hasSearched = false,
		showActions = true
	} = $props();

	// Check if current user is admin
	const isAdmin = $derived(authState.user?.type === 'Админ');

	// Format date helper function
	function formatDate(dateString) {
		if (!dateString) return 'Не указана';
		return new Date(dateString).toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Get client status for StatusBadge
	function getClientStatus(user) {
		return user.status === 'banned' ? 'banned' : 'active';
	}

	// Generate unique table ID for accessibility
	const tableId = `clients-table-${Math.random().toString(36).substr(2, 9)}`;
	const tableCaptionId = `${tableId}-caption`;
	const tableDescriptionId = `${tableId}-description`;

	// Announce table updates to screen readers
	function announceTableUpdate() {
		const message =
			users.length === 0
				? hasSearched
					? `Клиенты не найдены по запросу "${searchTerm}"`
					: 'Нет доступных клиентов'
				: `${users.length} клиент${users.length === 1 ? '' : users.length < 5 ? 'а' : 'ов'} ${hasSearched ? `найдено по запросу "${searchTerm}"` : 'отображено'}`;

		// Use a live region to announce changes
		const announcement = document.getElementById(`${tableId}-announcements`);
		if (announcement) {
			announcement.textContent = message;
			setTimeout(() => {
				announcement.textContent = '';
			}, 1000);
		}
	}

	// Announce updates when users change
	$effect(() => {
		if (users) {
			setTimeout(announceTableUpdate, 100); // Small delay to ensure DOM is updated
		}
	});
</script>

<!-- Live region for screen reader announcements -->
<div id="{tableId}-announcements" class="sr-only" aria-live="polite" aria-atomic="true">
	<!-- Dynamic table update announcements -->
</div>

<!-- Desktop Table View (hidden on mobile) -->
<div class="ring-opacity-5 hidden overflow-hidden shadow ring-1 ring-black md:block md:rounded-lg">
	<table
		id={tableId}
		class="min-w-full divide-y divide-gray-300 dark:divide-gray-700"
		aria-labelledby={tableCaptionId}
		aria-describedby={tableDescriptionId}
	>
		<caption id={tableCaptionId} class="sr-only">
			Таблица клиентов с {users.length} клиент{users.length === 1
				? 'ом'
				: users.length < 5
					? 'ами'
					: 'ами'}
			{hasSearched ? ` по запросу "${searchTerm}"` : ''}
		</caption>
		<thead class="bg-gray-50 dark:bg-gray-800">
			<tr>
				<th
					id="col-number"
					scope="col"
					role="columnheader"
					class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					№
				</th>
				<th
					id="col-name"
					scope="col"
					role="columnheader"
					class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					Имя
				</th>
				<th
					id="col-agent"
					scope="col"
					role="columnheader"
					class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					Агент
				</th>
				<th
					id="col-phone"
					scope="col"
					role="columnheader"
					class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					Телефон
				</th>
				<th
					id="col-region"
					scope="col"
					role="columnheader"
					class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					Регион
				</th>
				<th
					id="col-registration"
					scope="col"
					role="columnheader"
					class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					Регистрация
				</th>
				<th
					id="col-status"
					scope="col"
					role="columnheader"
					class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					Состояние
				</th>
				{#if showActions}
					<th id="col-actions" scope="col" role="columnheader" class="relative px-4 py-3">
						<span class="sr-only">Действия</span>
					</th>
				{/if}
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
			{#if users.length === 0}
				<tr>
					<td colspan={showActions ? '7' : '6'} class="px-4 py-4" role="cell">
						<EmptyState
							type={hasSearched ? 'no-results' : 'no-data'}
							searchTerm={hasSearched ? searchTerm : ''}
						/>
					</td>
				</tr>
			{:else}
				{#each users as user, index (user.id + '-' + user.status + '-' + updateCounter)}
					<tr
						class="transition-colors duration-150 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-800"
						aria-rowindex={index + 2}
					>
						<td
							class="px-4 py-3 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400"
							role="cell"
							headers="col-number"
						>
							{user.sequentialNumber || index + 1}
						</td>
						<td
							class="px-4 py-3 text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
							headers="col-name"
						>
							{user.name || 'Не указано'}
						</td>
						<td
							class="px-4 py-3 text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
							headers="col-agent"
						>
							{user.agent?.name || 'Не указан'}
						</td>
						<td
							class="px-4 py-3 text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
							headers="col-phone"
						>
							{#if user.phones && user.phones.length > 0}
								{formatPhone(user.phones.find((p) => p.is_primary)?.value || user.phones[0]?.value)}
							{:else}
								Не указан
							{/if}
						</td>
						<td
							class="px-4 py-3 text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
							headers="col-region"
						>
							{user.region || 'Не указан'}
						</td>
						<td
							class="px-4 py-3 text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
							headers="col-registration"
						>
							{formatDate(user.created_at)}
						</td>
						<td class="px-4 py-3 text-sm whitespace-nowrap" role="cell" headers="col-status">
							<StatusBadge status={getClientStatus(user)} />
						</td>
						{#if showActions}
							<td
								class="relative py-3 pr-4 pl-3 text-center text-sm font-medium whitespace-nowrap sm:pr-6"
								role="cell"
								headers="col-actions"
							>
								<div class="flex justify-center gap-2">
									<button
										type="button"
										onclick={() => onViewUser && onViewUser(user)}
										class="inline-flex items-center rounded-md bg-gray-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
										aria-label="Просмотреть клиента {user.name}"
									>
										<svg
											class="h-4 w-4"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											aria-hidden="true"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
											/>
										</svg>
									</button>
									<!-- Edit Button - Only visible for admin -->
									{#if isAdmin}
										<button
											type="button"
											onclick={() => onEditUser && onEditUser(user)}
											class="inline-flex items-center rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
											aria-label="Редактировать клиента {user.name}"
										>
											<svg
												class="h-4 w-4"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												aria-hidden="true"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
												/>
											</svg>
										</button>
									{/if}
								</div>
							</td>
						{/if}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>

	<!-- Table description for screen readers -->
	<div id={tableDescriptionId} class="sr-only"></div>
</div>

<!-- Mobile Card View (visible on mobile only) -->
<div class="md:hidden">
	{#if users.length === 0}
		<div class="px-4 py-6">
			<EmptyState
				type={hasSearched ? 'no-results' : 'no-data'}
				searchTerm={hasSearched ? searchTerm : ''}
			/>
		</div>
	{:else}
		<div class="space-y-4" role="list" aria-label="Список клиентов">
			{#each users as user, index (user.id + '-' + user.status + '-' + updateCounter)}
				<div
					class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
					role="listitem"
					aria-labelledby="client-{user.id}-name"
					aria-describedby="client-{user.id}-details"
				>
					<!-- Client Header -->
					<div class="mb-3 flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<h3
								id="client-{user.id}-name"
								class="truncate text-sm font-medium text-gray-900 dark:text-white"
							>
								{user.name || 'Не указано'}
							</h3>
							{#if user.phones && user.phones.length > 0}
								<p class="truncate text-sm text-gray-500 dark:text-gray-400">
									{formatPhone(
										user.phones.find((p) => p.is_primary)?.value || user.phones[0]?.value
									)}
								</p>
							{/if}
						</div>
						<div class="ml-2 flex-shrink-0 flex items-center gap-2">
							<StatusBadge status={getClientStatus(user)} />
							<span
								class="inline-flex items-center rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400"
								aria-label="Номер по порядку {user.sequentialNumber || index + 1}"
							>
								№ {user.sequentialNumber || index + 1}
							</span>
						</div>
					</div>

					<!-- Client Details Grid -->
					<dl id="client-{user.id}-details" class="mb-4 grid grid-cols-2 gap-3">
						<div>
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Агент
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{user.agent?.name || 'Не указан'}
							</dd>
						</div>
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
						<div class="col-span-2">
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Регистрация
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{formatDate(user.created_at)}
							</dd>
						</div>
					</dl>

					<!-- Status Badge -->
					<div class="mb-4 flex flex-wrap gap-2">
						<div class="flex items-center">
							<span class="mr-2 text-xs font-medium text-gray-500 dark:text-gray-400"
								>Состояние:</span
							>
							<StatusBadge status={getClientStatus(user)} />
						</div>
					</div>

					<!-- Action Buttons -->
					{#if showActions}
						<div class="flex justify-end gap-2 border-t border-gray-200 pt-3 dark:border-gray-600">
							<button
								type="button"
								onclick={() => onViewUser && onViewUser(user)}
								class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-gray-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-gray-500"
								aria-label="Просмотреть клиента {user.name}"
							>
								<svg
									class="h-5 w-5"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/>
								</svg>
							</button>
							<!-- Edit Button - Only visible for admin -->
							{#if isAdmin}
								<button
									type="button"
									onclick={() => onEditUser && onEditUser(user)}
									class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-indigo-500"
									aria-label="Редактировать клиента {user.name}"
								>
									<svg
										class="h-5 w-5"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
										/>
									</svg>
								</button>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Tablet Horizontal Scroll View (visible on small tablets) -->
<div class="hidden sm:block md:hidden">
	<div class="overflow-x-auto">
		<div class="inline-block min-w-full align-middle">
			<div class="ring-opacity-5 overflow-hidden rounded-lg shadow ring-1 ring-black">
				<table class="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
					<thead class="bg-gray-50 dark:bg-gray-800">
						<tr>
							<th
								scope="col"
								class="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
							>
								№
							</th>
							<th
								scope="col"
								class="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
							>
								Имя
							</th>
							<th
								scope="col"
								class="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
							>
								Агент
							</th>
							<th
								scope="col"
								class="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
							>
								Телефон
							</th>
							<th
								scope="col"
								class="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
							>
								Регион
							</th>
							<th
								scope="col"
								class="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
							>
								Статус
							</th>
							{#if showActions}
								<th scope="col" class="relative px-4 py-3 whitespace-nowrap">
									<span class="sr-only">Действия</span>
								</th>
							{/if}
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
						{#if users.length === 0}
							<tr>
								<td colspan={showActions ? '7' : '6'} class="px-4 py-4">
									<EmptyState
										type={hasSearched ? 'no-results' : 'no-data'}
										searchTerm={hasSearched ? searchTerm : ''}
									/>
								</td>
							</tr>
						{:else}
							{#each users as user, index (user.id + '-' + user.status + '-' + updateCounter)}
								<tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
									<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
										{user.sequentialNumber || index + 1}
									</td>
									<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-900 dark:text-white">
										{user.name || 'Не указано'}
									</td>
									<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-900 dark:text-white">
										{user.agent?.name || 'Не указан'}
									</td>
									<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-900 dark:text-white">
										{#if user.phones && user.phones.length > 0}
											{formatPhone(
												user.phones.find((p) => p.is_primary)?.value || user.phones[0]?.value
											)}
										{:else}
											Не указан
										{/if}
									</td>
									<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-900 dark:text-white">
										{user.region || 'Не указан'}
									</td>
									<td class="px-4 py-3 text-sm whitespace-nowrap">
										<StatusBadge status={getClientStatus(user)} />
									</td>
									{#if showActions}
										<td
											class="relative py-3 pr-4 pl-3 text-center text-sm font-medium whitespace-nowrap"
										>
											<div class="flex justify-center gap-2">
												<button
													type="button"
													onclick={() => onViewUser && onViewUser(user)}
													class="inline-flex items-center rounded-md bg-gray-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-gray-500"
													aria-label="Просмотреть клиента {user.name}"
												>
													<svg
														class="h-4 w-4"
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
														aria-hidden="true"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
														/>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
														/>
													</svg>
												</button>
												<!-- Edit Button - Only visible for admin -->
												{#if isAdmin}
													<button
														type="button"
														onclick={() => onEditUser && onEditUser(user)}
														class="inline-flex items-center rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-indigo-500"
														aria-label="Редактировать клиента {user.name}"
													>
														<svg
															class="h-4 w-4"
															xmlns="http://www.w3.org/2000/svg"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
															aria-hidden="true"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
															/>
														</svg>
													</button>
												{/if}
											</div>
										</td>
									{/if}
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
