<script>
	import StatusBadge from '$lib/components/common/StatusBadge.svelte';
	import ActionButtons from '$lib/components/business-processes/actions/ActionButtons.svelte';
	import EmptyState from '$lib/components/common/EmptyState.svelte';
	import DateBadge from '$lib/components/common/DateBadge.svelte';
	import { ActionButton, MobileActionButton } from '$lib';
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
		<thead class="bg-gray-100 dark:bg-gray-900">
			<tr>
				<th
					id="col-number"
					scope="col"
					role="columnheader"
					class="px-3 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					№
				</th>
				<th
					id="col-name"
					scope="col"
					role="columnheader"
					class="px-3 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					Имя
				</th>
				<th
					id="col-email"
					scope="col"
					role="columnheader"
					class="px-3 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					Почта
				</th>

				<th
					id="col-region"
					scope="col"
					role="columnheader"
					class="px-3 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					Регион
				</th>
				<th
					id="col-registration"
					scope="col"
					role="columnheader"
					class="px-3 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					Регистрация
				</th>
				<th
					id="col-ban"
					scope="col"
					role="columnheader"
					class="px-3 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
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
					<td colspan="7" class="px-3 py-3" role="cell">
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
							class="px-3 py-5 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400"
							role="cell"
							headers="col-number"
						>
							{user.sequentialNumber || index + 1}
						</td>
						<td
							class="px-3 py-5 text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
							headers="col-name"
						>
							{user.name || 'Not specified'}
						</td>
						<td
							class="px-3 py-5 text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
							headers="col-email"
						>
							{user.email} /
							<StatusBadge status={getEmailVerificationStatus(user.email_verified_at)} />
						</td>

						<td
							class="px-3 py-5 text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
							headers="col-region"
						>
							{user.region || 'Не указан'}
						</td>
						<td
							class="px-3 py-5 text-sm whitespace-nowrap"
							role="cell"
							headers="col-registration"
						>
							<DateBadge date={user.created_at} fallback="Не указана" />
						</td>
						<td class="px-3 py-5 text-sm whitespace-nowrap" role="cell" headers="col-ban">
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
									Активен
								{/if}
							</button>
						</td>
						<td
							class="relative py-3 pr-4 pl-3 text-center text-sm font-medium whitespace-nowrap sm:pr-6"
							role="cell"
							headers="col-actions"
						>
							<div class="flex items-center justify-center space-x-2">
								<ActionButton
									variant="view"
									onclick={() => onViewUser && onViewUser(user)}
									ariaLabel="Просмотреть пользователя {user.name || user.email}"
									title="Просмотреть"
								/>
								{#if isAdmin}
									<ActionButton
										variant="edit"
										onclick={() => onEditUser && onEditUser(user)}
										ariaLabel="Редактировать пользователя {user.name || user.email}"
										title="Редактировать"
									/>
									<ActionButton
										variant="delete"
										onclick={() => onDeleteUser(user)}
										disabled={isLoading}
										{isLoading}
										ariaLabel="Удалить пользователя {user.name || user.email}"
										title="Удалить"
									/>
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
		<div class="px-3 py-6">
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
							<h3
								id="user-{user.id}-name"
								class="truncate text-sm font-medium text-gray-900 dark:text-white"
							>
								{user.name || 'Not specified'}
							</h3>
							<div class="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
								<span class="truncate">{user.email}</span>
								<span>/</span>
								<StatusBadge status={getEmailVerificationStatus(user.email_verified_at)} />
							</div>
						</div>
						<div class="ml-2 flex-shrink-0">
							<span
								class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
								aria-label="Номер по порядку {user.sequentialNumber || index + 1}"
							>
								№ {user.sequentialNumber || index + 1}
							</span>
						</div>
					</div>

					<!-- User Details Grid -->
					<dl id="user-{user.id}-details" class="mb-4 grid grid-cols-2 gap-3">
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
						<MobileActionButton
							variant="view"
							onclick={() => onViewUser && onViewUser(user)}
							ariaLabel="Просмотреть пользователя {user.name || user.email}"
							title="Просмотреть"
						/>
						{#if isAdmin}
							<MobileActionButton
								variant="edit"
								onclick={() => onEditUser && onEditUser(user)}
								ariaLabel="Редактировать пользователя {user.name || user.email}"
								title="Редактировать"
							/>
							<MobileActionButton
								variant="delete"
								onclick={() => onDeleteUser(user)}
								disabled={isLoading}
								isLoading={isLoading}
								ariaLabel="Удалить пользователя {user.name || user.email}"
								title="Удалить"
							/>
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
					<thead class="bg-gray-100 dark:bg-gray-900">
						<tr>
							<th
								scope="col"
								class="px-3 py-4 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
							>
								№
							</th>
							<th
								scope="col"
								class="px-3 py-4 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
							>
								Имя
							</th>
							<th
								scope="col"
								class="px-3 py-4 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
							>
								Почта
							</th>
							<th
								scope="col"
								class="px-3 py-4 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
							>
								Регион
							</th>
							<th
								scope="col"
								class="px-3 py-4 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
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
								<td colspan="6" class="px-3 py-3 text-center">
									<div class="flex justify-center">
										<div class="hidden h-6 w-6"></div>
									</div>
								</td>
							</tr>
						{:else if users.length === 0}
							<tr>
								<td colspan="6" class="px-3 py-3">
									<EmptyState
										type={hasSearched ? 'no-results' : 'no-data'}
										searchTerm={hasSearched ? searchTerm : ''}
									/>
								</td>
							</tr>
						{:else}
							{#each users as user, index (user.id + '-' + user.status + '-' + updateCounter)}
								<tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
									<td class="px-3 py-5 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
										{user.sequentialNumber || index + 1}
									</td>
									<td class="px-3 py-5 text-sm whitespace-nowrap text-gray-900 dark:text-white">
										{user.name || 'Not specified'}
									</td>
									<td class="px-3 py-5 text-sm whitespace-nowrap text-gray-900 dark:text-white">
										{user.email}
									</td>
									<td class="px-3 py-5 text-sm whitespace-nowrap text-gray-900 dark:text-white">
										{user.region || 'Не указан'}
									</td>
									<td class="px-3 py-5 text-sm whitespace-nowrap">
										<div class="flex flex-col space-y-1">
											{#if user.status === 'banned' || user.status === 'inactive' || user.status === 'suspended'}
												<StatusBadge status="banned" />
											{:else}
												<StatusBadge status="verified" text="Активен" />
											{/if}
											<StatusBadge status={getEmailVerificationStatus(user.email_verified_at)} />
										</div>
									</td>
									<td
										class="relative py-3 pr-4 pl-3 text-center text-sm font-medium whitespace-nowrap"
									>
										<div class="flex items-center justify-center space-x-2">
											<ActionButton
												variant="view"
												onclick={() => onViewUser && onViewUser(user)}
												ariaLabel="Просмотреть пользователя {user.name || user.email}"
												title="Просмотреть"
											/>
											{#if isAdmin}
												<ActionButton
													variant="edit"
													onclick={() => onEditUser && onEditUser(user)}
													ariaLabel="Редактировать пользователя {user.name || user.email}"
													title="Редактировать"
												/>
												<ActionButton
													variant="delete"
													onclick={() => onDeleteUser(user)}
													disabled={isLoading}
													{isLoading}
													ariaLabel="Удалить пользователя {user.name || user.email}"
													title="Удалить"
												/>
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
