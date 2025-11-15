<script>
	import StatusBadge from './StatusBadge.svelte';
	import ActionButtons from './ActionButtons.svelte';
	import EmptyState from './EmptyState.svelte';
	import { authState } from '$lib/state/auth.svelte.js';

	let {
		users = [],
		isLoading = false,
		onBanUser,
		onDeleteUser,
		onViewUser,
		onEditUser,
		updateCounter = 0,
		searchTerm = '',
		hasSearched = false
	} = $props();

	// Check if current user is admin
	const isAdmin = $derived(authState.user?.type === 'Админ');

	// Format date helper function
	function formatDate(dateString) {
		if (!dateString) return 'Not specified';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Get email verification status for StatusBadge
	function getEmailVerificationStatus(emailVerifiedAt) {
		return emailVerifiedAt ? 'verified' : 'unverified';
	}

	// Get user ban status for StatusBadge
	function getUserBanStatus(user) {
		console.log('Checking user ban status:', { id: user.id, status: user.status });
		return user.status === 'banned' || user.status === 'inactive' || user.status === 'suspended'
			? 'banned'
			: 'active';
	}

	// Generate unique table ID for accessibility
	const tableId = `users-table-${Math.random().toString(36).substr(2, 9)}`;
	const tableCaptionId = `${tableId}-caption`;
	const tableDescriptionId = `${tableId}-description`;

	// Log users data when it changes
	$effect(() => {
		console.log(
			'UsersTable received users:',
			users.map((u) => ({ id: u.id, status: u.status }))
		);
	});

	// Announce table updates to screen readers
	function announceTableUpdate() {
		const message =
			users.length === 0
				? hasSearched
					? `No users found matching "${searchTerm}"`
					: 'No users available'
				: `${users.length} user${users.length === 1 ? '' : 's'} ${hasSearched ? `found matching "${searchTerm}"` : 'displayed'}`;

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
			Users management table with {users.length} user{users.length === 1 ? '' : 's'}
			{hasSearched ? ` matching search term "${searchTerm}"` : ''}
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
					id="col-region"
					scope="col"
					role="columnheader"
					class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					Регион
				</th>
				<th
					id="col-ban"
					scope="col"
					role="columnheader"
					class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					Состояние
				</th>
				<th id="col-actions" scope="col" role="columnheader" class="relative px-4 py-3">
					<span class="sr-only">Actions</span>
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
			{#if users.length === 0}
				<tr>
					<td colspan="5" class="px-4 py-4" role="cell">
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
							class="px-4 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400"
							role="cell"
							headers="col-number"
						>
							{user.sequentialNumber || index + 1}
						</td>
						<td
							class="px-4 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
							headers="col-name"
						>
							{user.name || 'Not specified'}
						</td>
						<td
							class="px-4 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
							headers="col-region"
						>
							{user.region || 'Не указан'}
						</td>
						<td class="px-4 py-4 text-sm whitespace-nowrap" role="cell" headers="col-ban">
							<button
								type="button"
								onclick={() => onBanUser(user)}
								disabled={isLoading}
								class="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50
									{user.status === 'banned' || user.status === 'inactive' || user.status === 'suspended'
									? 'bg-red-100 text-red-800 hover:bg-red-200 focus-visible:outline-red-600 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
									: 'bg-green-100 text-green-800 hover:bg-green-200 focus-visible:outline-green-600 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30'}"
								aria-label={user.status === 'banned' ||
								user.status === 'inactive' ||
								user.status === 'suspended'
									? 'Разбанить пользователя'
									: 'Забанить пользователя'}
							>
								{#if user.status === 'banned' || user.status === 'inactive' || user.status === 'suspended'}
									Бан
								{:else}
									Активно
								{/if}
							</button>
						</td>
						<td
							class="relative py-4 pr-4 pl-3 text-center text-sm font-medium whitespace-nowrap sm:pr-6"
							role="cell"
							headers="col-actions"
						>
							<div class="flex items-center justify-center space-x-2">
								<!-- View Button -->
								<button
									type="button"
									onclick={() => onViewUser && onViewUser(user)}
									class="inline-flex items-center rounded-md bg-gray-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
									aria-label="Просмотреть пользователя {user.name || user.email}"
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
										class="inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
										aria-label="Редактировать пользователя {user.name || user.email}"
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
									<!-- Delete Button -->
									<button
										type="button"
										onclick={() => onDeleteUser(user)}
										disabled={isLoading}
										class="inline-flex items-center rounded-md bg-red-800 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
										aria-label="Удалить пользователя {user.name || user.email}"
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
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									</button>
								{/if}
							</div>
						</td>
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
		<div class="space-y-4" role="list" aria-label="Users list">
			{#each users as user, index (user.id + '-' + user.status + '-' + updateCounter)}
				<div
					class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
					role="listitem"
					aria-labelledby="user-{user.id}-name"
					aria-describedby="user-{user.id}-details"
				>
					<!-- User Header -->
					<div class="mb-3 flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<div class="mb-1 flex items-center gap-2">
								<span
									class="inline-flex items-center rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400"
									aria-label="Номер по порядку {user.sequentialNumber || index + 1}"
								>
									№ {user.sequentialNumber || index + 1}
								</span>
							</div>
							<h3
								id="user-{user.id}-name"
								class="truncate text-sm font-medium text-gray-900 dark:text-white"
							>
								{user.name || 'Not specified'}
							</h3>
							<p class="truncate text-sm text-gray-500 dark:text-gray-400">
								{user.email}
							</p>
						</div>
					</div>

					<!-- User Details Grid -->
					<dl id="user-{user.id}-details" class="mb-4 grid grid-cols-1 gap-3">
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
					</dl>

					<!-- Status Badges -->
					<div class="mb-4 flex flex-wrap gap-2">
						<div class="flex items-center">
							<span class="mr-2 text-xs font-medium text-gray-500 dark:text-gray-400"
								>Состояние:</span
							>
							{#if user.status === 'banned' || user.status === 'inactive' || user.status === 'suspended'}
								<StatusBadge status="banned" />
							{:else}
								<StatusBadge status="verified" text="Активен" />
							{/if}
						</div>
					</div>

					<!-- Action Buttons -->
					<div
						class="flex justify-end space-x-2 border-t border-gray-200 pt-3 dark:border-gray-600"
					>
						<!-- View Button -->
						<button
							type="button"
							onclick={() => onViewUser && onViewUser(user)}
							class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-gray-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-gray-500"
							aria-label="Просмотреть пользователя {user.name || user.email}"
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
								class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-500"
								aria-label="Редактировать пользователя {user.name || user.email}"
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
							<!-- Delete Button -->
							<button
								type="button"
								onclick={() => onDeleteUser(user)}
								disabled={isLoading}
								class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
								aria-label="Удалить пользователя {user.name || user.email}"
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
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							</button>
						{/if}
					</div>
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
								ID
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
								Регион
							</th>
							<th
								scope="col"
								class="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
							>
								Статус
							</th>
							<th scope="col" class="relative px-4 py-3 whitespace-nowrap">
								<span class="sr-only">Actions</span>
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
						{#if false && isLoading}
							<tr>
								<td colspan="5" class="px-4 py-4 text-center">
									<div class="flex justify-center">
										<div class="hidden h-6 w-6"></div>
									</div>
								</td>
							</tr>
						{:else if users.length === 0}
							<tr>
								<td colspan="5" class="px-4 py-4">
									<EmptyState
										type={hasSearched ? 'no-results' : 'no-data'}
										searchTerm={hasSearched ? searchTerm : ''}
									/>
								</td>
							</tr>
						{:else}
							{#each users as user, index (user.id + '-' + user.status + '-' + updateCounter)}
								<tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
									<td class="px-4 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
										{user.sequentialNumber || index + 1}
									</td>
									<td
										class="px-4 py-4 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white"
									>
										{user.id}
									</td>
									<td class="px-4 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white">
										{user.name || 'Not specified'}
									</td>
									<td class="px-4 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white">
										{user.region || 'Не указан'}
									</td>
									<td class="px-4 py-4 text-sm whitespace-nowrap">
										<div class="flex flex-col space-y-1">
											{#if user.status === 'banned' || user.status === 'inactive' || user.status === 'suspended'}
												<StatusBadge status="banned" />
											{:else}
												<StatusBadge status="verified" text="Активен" />
											{/if}
										</div>
									</td>
									<td
										class="relative py-4 pr-4 pl-3 text-center text-sm font-medium whitespace-nowrap"
									>
										<div class="flex items-center justify-center space-x-2">
											<!-- View Button -->
											<button
												type="button"
												onclick={() => onViewUser && onViewUser(user)}
												class="inline-flex items-center rounded-md bg-gray-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-gray-500"
												aria-label="Просмотреть пользователя {user.name || user.email}"
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
													class="inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-500"
													aria-label="Редактировать пользователя {user.name || user.email}"
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
												<!-- Delete Button -->
												<button
													type="button"
													onclick={() => onDeleteUser(user)}
													disabled={isLoading}
													class="inline-flex items-center rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
													aria-label="Удалить пользователя {user.name || user.email}"
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
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
													</svg>
												</button>
											{/if}
										</div>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
