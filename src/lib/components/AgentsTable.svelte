<script>
	import StatusBadge from './StatusBadge.svelte';
	import ActionButtons from './ActionButtons.svelte';
	import EmptyState from './EmptyState.svelte';

	let {
		agents = [],
		isLoading = false,
		onBanAgent,
		onDeleteAgent,
		updateCounter = 0,
		searchTerm = '',
		hasSearched = false
	} = $props();

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

	// Get agent ban status for StatusBadge
	function getAgentBanStatus(agent) {
		console.log('Checking agent ban status:', { id: agent.id, status: agent.status });
		return agent.status === 'banned' || agent.status === 'inactive' || agent.status === 'suspended'
			? 'banned'
			: 'active';
	}

	// Generate unique table ID for accessibility
	const tableId = `agents-table-${Math.random().toString(36).substr(2, 9)}`;
	const tableCaptionId = `${tableId}-caption`;
	const tableDescriptionId = `${tableId}-description`;

	// Log agents data when it changes
	$effect(() => {
		console.log(
			'AgentsTable received agents:',
			agents.map((a) => ({ id: a.id, status: a.status }))
		);
	});

	// Announce table updates to screen readers
	function announceTableUpdate() {
		const message =
			agents.length === 0
				? hasSearched
					? `No agents found matching "${searchTerm}"`
					: 'No agents available'
				: `${agents.length} agent${agents.length === 1 ? '' : 's'} ${hasSearched ? `found matching "${searchTerm}"` : 'displayed'}`;

		// Use a live region to announce changes
		const announcement = document.getElementById(`${tableId}-announcements`);
		if (announcement) {
			announcement.textContent = message;
			setTimeout(() => {
				announcement.textContent = '';
			}, 1000);
		}
	}

	// Announce updates when agents change
	$effect(() => {
		if (agents) {
			setTimeout(announceTableUpdate, 100); // Small delay to ensure DOM is updated
		}
	});
</script>

<!-- Live region for screen reader announcements -->
<div id="{tableId}-announcements" class="sr-only" aria-live="polite" aria-atomic="true">
	<!-- Dynamic table update announcements -->
</div>

<!-- Desktop Table View (hidden on mobile) -->
<div class="hidden overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:block md:rounded-lg">
	<table
		id={tableId}
		class="min-w-full divide-y divide-gray-300 dark:divide-gray-700"
		aria-labelledby={tableCaptionId}
		aria-describedby={tableDescriptionId}
	>
		<caption id={tableCaptionId} class="sr-only">
			Agents management table with {agents.length} agent{agents.length === 1 ? '' : 's'}
			{hasSearched ? ` matching search term "${searchTerm}"` : ''}
		</caption>
		<thead class="bg-gray-50 dark:bg-gray-800">
			<tr>
				<th
					id="col-number"
					scope="col"
					role="columnheader"
					class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					aria-sort="none"
				>
					№
				</th>
				<th
					id="col-id"
					scope="col"
					role="columnheader"
					class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					aria-sort="none"
				>
					ID
				</th>
				<th
					id="col-name"
					scope="col"
					role="columnheader"
					class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					aria-sort="none"
				>
					Имя
				</th>
				<th
					id="col-email"
					scope="col"
					role="columnheader"
					class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					aria-sort="none"
				>
					Почта
				</th>
				<th
					id="col-verified"
					scope="col"
					role="columnheader"
					class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					aria-sort="none"
				>
					<!-- Подтверждена -->
				</th>
				<th
					id="col-city"
					scope="col"
					role="columnheader"
					class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					aria-sort="none"
				>
					Город
				</th>
				<th
					id="col-registration"
					scope="col"
					role="columnheader"
					class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					aria-sort="none"
				>
					Регистрация
				</th>
				<th
					id="col-status"
					scope="col"
					role="columnheader"
					class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					aria-sort="none"
				>
					Статус
				</th>
				<th id="col-actions" scope="col" role="columnheader" class="relative px-6 py-3">
					<span class="sr-only">Actions</span>
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
			{#if isLoading}
				<tr>
					<td colspan="9" class="px-6 py-4 text-center" role="cell">
						<div class="flex justify-center" aria-label="Loading agents data">
							<div
								class="h-6 w-6 animate-spin rounded-full border-b-2 border-indigo-600"
								aria-hidden="true"
							></div>
						</div>
						<span class="sr-only">Loading agents data, please wait...</span>
					</td>
				</tr>
			{:else if agents.length === 0}
				<tr>
					<td colspan="9" class="px-6 py-4" role="cell">
						<EmptyState
							type={hasSearched ? 'no-results' : 'no-data'}
							searchTerm={hasSearched ? searchTerm : ''}
						/>
					</td>
				</tr>
			{:else}
				{#each agents as agent, index (agent.id + '-' + agent.status + '-' + updateCounter)}
					<tr
						class="transition-colors duration-150 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-800"
						aria-rowindex={index + 2}
					>
						<td
							class="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400"
							role="cell"
							headers="col-number"
						>
							{index + 1}
						</td>
						<td
							class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white"
							role="cell"
							headers="col-id"
						>
							{agent.id}
						</td>
						<td
							class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white"
							role="cell"
							headers="col-name"
						>
							{agent.name || 'Not specified'}
						</td>
						<td
							class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white"
							role="cell"
							headers="col-email"
						>
							{agent.email}
						</td>
						<td class="whitespace-nowrap px-6 py-4 text-sm" role="cell" headers="col-verified">
							<StatusBadge status={getEmailVerificationStatus(agent.email_verified_at)} />
						</td>
						<td
							class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white"
							role="cell"
							headers="col-city"
						>
							{agent.city || 'Не указан'}
						</td>
						<td
							class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white"
							role="cell"
							headers="col-registration"
						>
							{formatDate(agent.created_at)}
						</td>
						<td class="whitespace-nowrap px-6 py-4 text-sm" role="cell" headers="col-status">
							{#if agent.status === 'banned' || agent.status === 'inactive' || agent.status === 'suspended'}
								<StatusBadge status="banned" />
							{:else}
								<StatusBadge status="verified" text="Активен" />
							{/if}
						</td>
						<td
							class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6"
							role="cell"
							headers="col-actions"
						>
							<ActionButtons {agent} onBan={onBanAgent} onDelete={onDeleteAgent} {isLoading} />
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
	{#if isLoading}
		<div class="flex justify-center py-8">
			<div class="h-6 w-6 animate-spin rounded-full border-b-2 border-indigo-600"></div>
		</div>
	{:else if agents.length === 0}
		<div class="px-4 py-6">
			<EmptyState
				type={hasSearched ? 'no-results' : 'no-data'}
				searchTerm={hasSearched ? searchTerm : ''}
			/>
		</div>
	{:else}
		<div class="space-y-4" role="list" aria-label="Agents list">
			{#each agents as agent, index (agent.id + '-' + agent.status + '-' + updateCounter)}
				<div
					class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
					role="listitem"
					aria-labelledby="agent-{agent.id}-name"
					aria-describedby="agent-{agent.id}-details"
				>
					<!-- Agent Header -->
					<div class="mb-3 flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<div class="mb-1 flex items-center gap-2">
								<span
									class="inline-flex items-center rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400"
									aria-label="Номер по порядку {index + 1}"
								>
									№ {index + 1}
								</span>
							</div>
							<h3
								id="agent-{agent.id}-name"
								class="truncate text-sm font-medium text-gray-900 dark:text-white"
							>
								{agent.name || 'Not specified'}
							</h3>
							<p class="truncate text-sm text-gray-500 dark:text-gray-400">
								{agent.email}
							</p>
							<div class="mt-1 flex items-center gap-2">
								<span class="text-xs font-medium text-gray-500 dark:text-gray-400">Email:</span>
								<StatusBadge status={getEmailVerificationStatus(agent.email_verified_at)} />
							</div>
						</div>
						<div class="ml-3 flex-shrink-0">
							<span
								class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
								aria-label="Agent ID {agent.id}"
							>
								ID: {agent.id}
							</span>
						</div>
					</div>

					<!-- Agent Details Grid -->
					<dl id="agent-{agent.id}-details" class="mb-4 grid grid-cols-2 gap-3">
						<div>
							<dt
								class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Город
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{agent.city || 'Не указан'}
							</dd>
						</div>
						<div>
							<dt
								class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Регистрация
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{formatDate(agent.created_at)}
							</dd>
						</div>
					</dl>

					<!-- Status Badges -->
					<div class="mb-4 flex flex-wrap gap-2">
						<div class="flex items-center">
							<span class="mr-2 text-xs font-medium text-gray-500 dark:text-gray-400">Статус:</span>
							{#if agent.status === 'banned' || agent.status === 'inactive' || agent.status === 'suspended'}
								<StatusBadge status="banned" />
							{:else}
								<StatusBadge status="verified" text="Активен" />
							{/if}
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="flex justify-end border-t border-gray-200 pt-3 dark:border-gray-600">
						<ActionButtons
							{agent}
							onBan={onBanAgent}
							onDelete={onDeleteAgent}
							{isLoading}
							mobile={true}
						/>
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
			<div class="overflow-hidden rounded-lg shadow ring-1 ring-black ring-opacity-5">
				<table class="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
					<thead class="bg-gray-50 dark:bg-gray-800">
						<tr>
							<th
								scope="col"
								class="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								№
							</th>
							<th
								scope="col"
								class="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								ID
							</th>
							<th
								scope="col"
								class="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Имя
							</th>
							<th
								scope="col"
								class="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Почта
							</th>
							<th
								scope="col"
								class="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Город
							</th>
							<th
								scope="col"
								class="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Статус
							</th>
							<th scope="col" class="relative whitespace-nowrap px-4 py-3">
								<span class="sr-only">Actions</span>
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
						{#if isLoading}
							<tr>
								<td colspan="7" class="px-4 py-4 text-center">
									<div class="flex justify-center">
										<div
											class="h-6 w-6 animate-spin rounded-full border-b-2 border-indigo-600"
										></div>
									</div>
								</td>
							</tr>
						{:else if agents.length === 0}
							<tr>
								<td colspan="7" class="px-4 py-4">
									<EmptyState
										type={hasSearched ? 'no-results' : 'no-data'}
										searchTerm={hasSearched ? searchTerm : ''}
									/>
								</td>
							</tr>
						{:else}
							{#each agents as agent, index (agent.id + '-' + agent.status + '-' + updateCounter)}
								<tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
									<td class="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
										{index + 1}
									</td>
									<td
										class="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900 dark:text-white"
									>
										{agent.id}
									</td>
									<td class="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white">
										{agent.name || 'Not specified'}
									</td>
									<td class="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white">
										{agent.email}
									</td>
									<td class="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white">
										{agent.city || 'Не указан'}
									</td>
									<td class="whitespace-nowrap px-4 py-4 text-sm">
										<div class="flex flex-col space-y-1">
											{#if agent.status === 'banned' || agent.status === 'inactive' || agent.status === 'suspended'}
												<StatusBadge status="banned" />
											{:else}
												<StatusBadge status="verified" text="Активен" />
											{/if}
											<StatusBadge status={getEmailVerificationStatus(agent.email_verified_at)} />
										</div>
									</td>
									<td
										class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium"
									>
										<ActionButtons
											{agent}
											onBan={onBanAgent}
											onDelete={onDeleteAgent}
											{isLoading}
											compact={true}
										/>
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
