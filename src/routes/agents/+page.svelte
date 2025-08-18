<script>
	import { AgentsTable, SearchBar, ConfirmationModal } from '$lib';
	import { gql, request } from 'graphql-request';

	let { data } = $props();

	// Search state management
	let searchTerm = $state('');

	// Action state management
	let isActionLoading = $state(false);
	let showConfirmModal = $state(false);
	let confirmAction = $state(null);
	let actionError = $state('');
	let actionSuccess = $state('');

	// Local agents state for updates
	let localAgents = $state([...(data?.agents || [])]);

	// Computed filteredAgents reactive statement
	let filteredAgents = $derived.by(() => {
		if (!searchTerm.trim()) {
			return localAgents;
		}

		const term = searchTerm.toLowerCase().trim();
		return localAgents.filter((agent) => {
			const name = (agent.name || '').toLowerCase();
			const email = (agent.email || '').toLowerCase();
			const city = (agent.city || '').toLowerCase();

			return name.includes(term) || email.includes(term) || city.includes(term);
		});
	});

	// Search handler function
	function handleSearch(term) {
		searchTerm = term;
	}

	// Ban agent handler with confirmation
	function handleBanAgent(agent) {
		const isBanned = agent.status === 'banned';
		confirmAction = {
			type: isBanned ? 'unban' : 'ban',
			agent: agent,
			title: isBanned ? 'Разбанить агента' : 'Забанить агента',
			message: isBanned 
				? `Вы уверены, что хотите разбанить агента "${agent.name || agent.email}"? Агент снова сможет получить доступ к системе.`
				: `Вы уверены, что хотите забанить агента "${agent.name || agent.email}"? Агент потеряет доступ к системе.`,
			confirmText: isBanned ? 'Разбанить' : 'Забанить',
			isDestructive: !isBanned
		};
		showConfirmModal = true;
		clearMessages();
	}

	// Delete agent handler (placeholder for future implementation)
	function handleDeleteAgent(agent) {
		console.log('Delete agent:', agent);
		// TODO: Implement delete functionality
	}

	// Execute confirmed action
	async function confirmActionHandler() {
		if (!confirmAction) return;

		isActionLoading = true;
		clearMessages();

		try {
			const { type, agent } = confirmAction;
			
			if (type === 'ban') {
				await banAgent(agent.id);
				updateAgentStatus(agent.id, 'banned');
				actionSuccess = `Агент "${agent.name || agent.email}" успешно забанен.`;
			} else if (type === 'unban') {
				await unbanAgent(agent.id);
				updateAgentStatus(agent.id, 'active');
				actionSuccess = `Агент "${agent.name || agent.email}" успешно разбанен.`;
			}
		} catch (error) {
			console.error('Action error:', error);
			
			// More specific error handling
			if (error.name === 'TypeError' && error.message.includes('fetch')) {
				actionError = `Ошибка сети: Не удается подключиться к серверу. Проверьте, что API сервер запущен на ${import.meta.env.VITE_B5_API_URL}`;
			} else if (error.response) {
				actionError = `Ошибка сервера: ${error.response.errors?.[0]?.message || error.message}`;
			} else {
				actionError = `Ошибка при выполнении действия: ${error.message || 'Неизвестная ошибка'}`;
			}
		} finally {
			isActionLoading = false;
			showConfirmModal = false;
			confirmAction = null;
		}
	}

	// Cancel action
	function cancelAction() {
		showConfirmModal = false;
		confirmAction = null;
		isActionLoading = false;
	}

	// Ban agent GraphQL mutation
	async function banAgent(agentId) {
		console.log('Banning agent:', agentId);
		console.log('API URL:', import.meta.env.VITE_B5_API_URL);
		
		const mutation = gql`
			mutation BanUser($id: ID!) {
				banUser(id: $id) {
					id
					status
				}
			}
		`;

		const variables = { id: agentId };
		
		try {
			const result = await request(
				import.meta.env.VITE_B5_API_URL, 
				mutation, 
				variables,
				{
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				}
			);
			console.log('Ban result:', result);
			return result.banUser;
		} catch (error) {
			console.error('Ban request failed:', error);
			throw error;
		}
	}

	// Unban agent GraphQL mutation
	async function unbanAgent(agentId) {
		console.log('Unbanning agent:', agentId);
		console.log('API URL:', import.meta.env.VITE_B5_API_URL);
		
		const mutation = gql`
			mutation UnbanUser($id: ID!) {
				unbanUser(id: $id) {
					id
					status
				}
			}
		`;

		const variables = { id: agentId };
		
		try {
			const result = await request(
				import.meta.env.VITE_B5_API_URL, 
				mutation, 
				variables,
				{
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				}
			);
			console.log('Unban result:', result);
			return result.unbanUser;
		} catch (error) {
			console.error('Unban request failed:', error);
			throw error;
		}
	}

	// Update agent status in local state
	function updateAgentStatus(agentId, newStatus) {
		localAgents = localAgents.map(agent => 
			agent.id === agentId 
				? { ...agent, status: newStatus }
				: agent
		);
	}

	// Clear success/error messages
	function clearMessages() {
		actionError = '';
		actionSuccess = '';
	}

	// Auto-clear messages after 5 seconds
	$effect(() => {
		if (actionSuccess || actionError) {
			const timer = setTimeout(clearMessages, 5000);
			return () => clearTimeout(timer);
		}
	});
</script>

<div class="space-y-6 bg-gray-900">
	<div class="sm:flex sm:items-center">
		<div class="sm:flex-auto">
			<h1 class="text-base font-semibold text-gray-900 dark:text-white">Агенты</h1>
			<!-- <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
				Lis		t of all registered agents in the system.
			</p> -->
		</div>
	</div>

	<!-- Success/Error Messages -->
	{#if actionSuccess}
		<div class="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.53 10.23a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm font-medium text-green-800 dark:text-green-200">
						{actionSuccess}
					</p>
				</div>
				<div class="ml-auto pl-3">
					<div class="-mx-1.5 -my-1.5">
						<button
							type="button"
							onclick={clearMessages}
							class="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
						>
							<span class="sr-only">Dismiss</span>
							<svg class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if actionError}
		<div class="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm font-medium text-red-800 dark:text-red-200">
						{actionError}
					</p>
				</div>
				<div class="ml-auto pl-3">
					<div class="-mx-1.5 -my-1.5">
						<button
							type="button"
							onclick={clearMessages}
							class="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
						>
							<span class="sr-only">Dismiss</span>
							<svg class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Search Bar -->
	<div class="max-w-md">
		<SearchBar placeholder="Локальный поиск" onSearch={handleSearch} value={searchTerm} />
	</div>

	<!-- Results summary -->
	{#if searchTerm.trim()}
		<div class="text-sm text-gray-600 dark:text-gray-400">
			{#if filteredAgents.length === 0}
				<p>No agents found matching "{searchTerm}". Try adjusting your search terms.</p>
			{:else if filteredAgents.length === 1}
				<p>Found 1 agent matching "{searchTerm}"</p>
			{:else}
				<p>Found {filteredAgents.length} agents matching "{searchTerm}"</p>
			{/if}
		</div>
	{/if}

	<AgentsTable
		agents={filteredAgents}
		isLoading={isActionLoading}
		onBanAgent={handleBanAgent}
		onDeleteAgent={handleDeleteAgent}
	/>
</div>

<!-- Confirmation Modal -->
{#if confirmAction}
	<ConfirmationModal
		isOpen={showConfirmModal}
		title={confirmAction.title}
		message={confirmAction.message}
		confirmText={confirmAction.confirmText}
		cancelText="Отмена"
		onConfirm={confirmActionHandler}
		onCancel={cancelAction}
		isDestructive={confirmAction.isDestructive}
		isLoading={isActionLoading}
	/>
{/if}
