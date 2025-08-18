<script>
	import StatusBadge from './StatusBadge.svelte';

	let { agents = [], isLoading = false, onBanAgent, onDeleteAgent } = $props();

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

	// Get agent ban status for StatusBadge (preparation for ban functionality)
	function getAgentBanStatus(agent) {
		// Check if agent has a status field and is banned
		return agent.status === 'banned' ? 'banned' : null;
	}
</script>

<div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
	<table class="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
		<thead class="bg-gray-50 dark:bg-gray-800">
			<tr>
				<th
					scope="col"
					class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
				>
					ID
				</th>
				<th
					scope="col"
					class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
				>
					Имя
				</th>
				<th
					scope="col"
					class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
				>
					Почта
				</th>
				<th
					scope="col"
					class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
				>
					Город
				</th>
				<th
					scope="col"
					class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
				>
					Дата регистрации
				</th>
				<th
					scope="col"
					class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
				>
					Подтверждён
				</th>
				<th
					scope="col"
					class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
				>
					Статус
				</th>
				<th scope="col" class="relative px-6 py-3">
					<span class="sr-only">Actions</span>
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
			{#if isLoading}
				<tr>
					<td colspan="8" class="px-6 py-4 text-center">
						<div class="flex justify-center">
							<div class="h-6 w-6 animate-spin rounded-full border-b-2 border-indigo-600"></div>
						</div>
					</td>
				</tr>
			{:else if agents.length === 0}
				<tr>
					<td colspan="8" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
						<div class="py-8">
							<svg
								class="mx-auto h-12 w-12 text-gray-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
							<h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
								No agents found
							</h3>
							<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
								No agents match your current search criteria.
							</p>
						</div>
					</td>
				</tr>
			{:else}
				{#each agents as agent (agent.id)}
					<tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
						<td
							class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white"
						>
							{agent.id}
						</td>
						<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
							{agent.name || 'Not specified'}
						</td>
						<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
							{agent.email}
						</td>
						<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
							{agent.city || 'Не указан'}
						</td>
						<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
							{formatDate(agent.created_at)}
						</td>
						<td class="whitespace-nowrap px-6 py-4 text-sm">
							<StatusBadge status={getEmailVerificationStatus(agent.email_verified_at)} />
						</td>
						<td class="whitespace-nowrap px-6 py-4 text-sm">
							{#if getAgentBanStatus(agent)}
								<StatusBadge status={getAgentBanStatus(agent)} />
							{:else}
								<StatusBadge status="verified" text="Active" />
							{/if}
						</td>
						<td
							class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6"
						>
							<div class="flex justify-end space-x-2">
								<button
									type="button"
									onclick={() => onBanAgent?.(agent)}
									class="inline-flex items-center rounded-md bg-yellow-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 disabled:opacity-50"
									disabled={isLoading}
								>
									Бан
								</button>
								<button
									type="button"
									onclick={() => onDeleteAgent?.(agent)}
									class="inline-flex items-center rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
									disabled={isLoading}
								>
									Удалить
								</button>
							</div>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>
