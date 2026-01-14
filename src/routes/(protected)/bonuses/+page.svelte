<script>
	import { onMount } from 'svelte';
	import ProtectedRoute from '$lib/components/common/ProtectedRoute.svelte';
	import { RefreshButton, SearchBar, PageTitle } from '$lib';
	import Pagination from '$lib/components/common/Pagination.svelte';
	import TableSkeleton from '$lib/components/common/TableSkeleton.svelte';
	import FinancesBonusTable from '$lib/components/business-processes/finances/FinancesBonusTable.svelte';
	import PayoutRequestModal from '$lib/components/finances/PayoutRequestModal.svelte';
	import {
		getAdminBonuses,
		getAdminBonusStats,
		getBonusStatuses,
		getPartnerPaymentStatuses,
		updateContractPartnerPaymentStatus,
		updateOrderPartnerPaymentStatus
	} from '$lib/api/finances.js';
	import { getBonusPaymentRequests } from '$lib/api/bonusPayments.js';
	import { addSuccessToast, handleApiError } from '$lib/utils/toastStore.js';
	import { authState } from '$lib/state/auth.svelte.js';
	import { hasAdminAccess } from '$lib/utils/domainAccess.svelte.js';

	/**
	 * Filter bonuses based on user role:
	 * - Admin: sees ALL bonuses
	 * - Curator: sees only their own curator bonuses (recipient_type = 'curator' AND user_id = current user)
	 */
	function filterBonusesByUserRole(bonusList, userId, isAdmin) {
		if (isAdmin) {
			return bonusList; // Admin sees all bonuses
		}

		// Curator filter: only bonuses where recipient_type = 'curator' AND user_id = current user
		return bonusList.filter((bonus) => {
			return bonus.recipient_type === 'curator' && bonus.user_id == userId;
		});
	}

	// Tab state
	let activeTab = $state('contracts');

	// Data state
	let bonuses = $state([]);
	let stats = $state({
		total_pending: 0,
		total_available: 0,
		total_paid: 0,
		contracts_count: 0,
		orders_count: 0,
		total_referral: 0,
		referral_count: 0,
		total_agent: 0,
		agent_count: 0,
		total_curator: 0,
		curator_count: 0
	});
	let bonusStatuses = $state([]);
	let partnerPaymentStatuses = $state([]);

	// Curator payment requests state
	let curatorPaymentRequests = $state([]);
	let curatorRequestedAmount = $state(0);

	// Payout request modal state
	let showPayoutModal = $state(false);

	// Loading state
	let isLoading = $state(true);
	let isRefreshing = $state(false);

	// Search and filter state
	let searchTerm = $state('');
	let statusFilter = $state('all');
	let recipientTypeFilter = $state('all');
	let sortField = $state('accrued_at');
	let sortDirection = $state('desc');

	// Pagination
	let currentPage = $state(1);
	const itemsPerPage = 10;

	// Filter bonuses by source type
	let filteredBonuses = $derived.by(() => {
		// Apply role-based filtering first
		const isAdmin = hasAdminAccess();
		const userId = authState.user?.id;
		let filtered = filterBonusesByUserRole(bonuses, userId, isAdmin);

		// Filter by source type (tab)
		filtered = filtered.filter((b) => {
			if (activeTab === 'contracts') return b.source_type === 'contract';
			if (activeTab === 'orders') return b.source_type === 'order';
			return true;
		});

		// Apply status filter
		if (statusFilter !== 'all') {
			filtered = filtered.filter((b) => b.status?.code === statusFilter);
		}

		// Apply recipient type filter
		if (recipientTypeFilter !== 'all') {
			filtered = filtered.filter((b) => b.recipient_type === recipientTypeFilter);
		}

		// Apply search
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter((b) => {
				const sourceNumber =
					b.source_type === 'contract'
						? (b.contract?.contract_number || b.contract_number || '').toLowerCase()
						: (b.order?.order_number || b.order_number || '').toLowerCase();
				const projectName = (b.project_name || '').toLowerCase();
				const userName = (b.user?.name || b.agent?.name || '').toLowerCase();
				return sourceNumber.includes(term) || projectName.includes(term) || userName.includes(term);
			});
		}

		// Apply sorting
		filtered.sort((a, b) => {
			let aVal, bVal;
			switch (sortField) {
				case 'commission_amount':
					aVal = a.commission_amount || 0;
					bVal = b.commission_amount || 0;
					break;
				case 'accrued_at':
					aVal = new Date(a.accrued_at || 0).getTime();
					bVal = new Date(b.accrued_at || 0).getTime();
					break;
				case 'paid_at':
					aVal = new Date(a.paid_at || 0).getTime();
					bVal = new Date(b.paid_at || 0).getTime();
					break;
				default:
					aVal = new Date(a.accrued_at || 0).getTime();
					bVal = new Date(b.accrued_at || 0).getTime();
			}
			return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
		});

		return filtered;
	});

	// Paginated bonuses
	let paginatedBonuses = $derived.by(() => {
		const start = (currentPage - 1) * itemsPerPage;
		return filteredBonuses.slice(start, start + itemsPerPage);
	});

	// Computed stats based on role filtering
	// For admins - use server stats, for curators - also use server stats (filtered by API)
	let displayStats = $derived.by(() => {
		// Both admin and curator use server stats
		// For curator, stats are already filtered by user_id and recipient_type='curator'
		// total_requested is now included in API response
		return stats;
	});

	// Reset page on filter change
	$effect(() => {
		activeTab;
		searchTerm;
		statusFilter;
		recipientTypeFilter;
		currentPage = 1;
	});

	// Format currency
	function formatCurrency(amount) {
		if (amount === null || amount === undefined) return '0';
		return new Intl.NumberFormat('ru-RU', {
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Load data
	async function loadData(showToast = false) {
		isRefreshing = true;
		try {
			const isAdmin = hasAdminAccess();
			const userId = authState.user?.id;

			// For curators, add filters to get only their curator bonuses
			const curatorFilters = !isAdmin && userId 
				? { user_id: userId, recipient_type: 'curator' } 
				: null;

			const promises = [
				getAdminBonuses(curatorFilters),
				getAdminBonusStats(curatorFilters),
				bonusStatuses.length === 0 ? getBonusStatuses() : Promise.resolve(bonusStatuses),
				partnerPaymentStatuses.length === 0
					? getPartnerPaymentStatuses()
					: Promise.resolve(partnerPaymentStatuses)
			];

			// For curators, also load their payment requests
			if (!isAdmin && userId) {
				promises.push(getBonusPaymentRequests(100, 1, { requester_type: 'curator' }));
			}

			const results = await Promise.all(promises);
			const [bonusesData, statsData, statusesData, partnerStatusesData] = results;

			bonuses = bonusesData;
			stats = statsData;
			if (statusesData !== bonusStatuses) bonusStatuses = statusesData;
			if (partnerStatusesData !== partnerPaymentStatuses)
				partnerPaymentStatuses = partnerStatusesData;

			// Process curator payment requests
			if (!isAdmin && userId && results[4]) {
				const requestsData = results[4];
				// Filter only current user's requests
				curatorPaymentRequests = (requestsData.data || []).filter(
					(r) => r.agent_id == userId && r.requester_type === 'curator'
				);
				// Calculate total requested amount (only pending/approved, not paid)
				curatorRequestedAmount = curatorPaymentRequests
					.filter((r) => r.status?.code !== 'paid')
					.reduce((sum, r) => sum + (r.amount || 0), 0);
			}

			if (showToast) addSuccessToast('Данные обновлены');
		} catch (error) {
			handleApiError(error, 'Не удалось загрузить данные');
		} finally {
			isLoading = false;
			isRefreshing = false;
		}
	}

	// Handle bonus status change
	function handleStatusChange(bonusId, result) {
		bonuses = bonuses.map((b) =>
			b.id === bonusId ? { ...b, status: result.status, paid_at: result.paid_at } : b
		);
		loadData(); // Refresh stats
	}

	// Handle partner payment status change
	function handlePartnerPaymentStatusChange(bonus, result) {
		// Refresh data to get updated statuses
		loadData();
	}

	// Toggle sort
	function toggleSort(field) {
		if (sortField === field) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortField = field;
			sortDirection = 'desc';
		}
	}

	onMount(() => {
		loadData();
	});
</script>

<ProtectedRoute>
	{#snippet children()}
		<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
			<div class="px-4 py-7 sm:px-6 lg:px-7">
				<div class="mx-auto">
					<main id="main-content" aria-labelledby="page-title">
						<!-- Header with H1, Search and Refresh Button -->
						<div
							class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
						>
							<PageTitle title="Бонусы" />
							<div class="flex items-center space-x-3">
								<div class="w-80">
									<SearchBar bind:value={searchTerm} placeholder="Поиск по таблице Финансы..." />
								</div>
								<RefreshButton {isRefreshing} onclick={() => loadData(true)} />
							</div>
						</div>

						<!-- Metrics Cards -->
						<div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
							<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Ожидание</dt>
								<dd class="mt-1 text-2xl font-semibold text-gray-600 dark:text-gray-400">
									{formatCurrency(displayStats.total_pending)}
								</dd>
							</div>
							<!-- Available card with request button for curators -->
							<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
								<div class="flex items-start justify-between">
									<div>
										<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Доступно</dt>
										<dd class="mt-1 text-2xl font-semibold text-blue-600 dark:text-blue-400">
											{formatCurrency(displayStats.total_available)}
										</dd>
									</div>
									{#if !hasAdminAccess() && displayStats.total_available > 0}
										<button
											type="button"
											onclick={() => (showPayoutModal = true)}
											class="rounded-full bg-green-100 p-2 text-green-600 transition-colors hover:bg-green-200 dark:bg-green-500/20 dark:text-green-400 dark:hover:bg-green-500/30"
											title="Запросить выплату"
											aria-label="Запросить выплату"
										>
											<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
											</svg>
										</button>
									{/if}
								</div>
							</div>
							<!-- Requested card for curators -->
							{#if !hasAdminAccess()}
								<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
									<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Запрошено</dt>
									<dd class="mt-1 text-2xl font-semibold text-orange-600 dark:text-orange-400">
										{formatCurrency(displayStats.total_requested || 0)}
									</dd>
								</div>
							{/if}
							<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Выплачено</dt>
								<dd class="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
									{formatCurrency(displayStats.total_paid)}
								</dd>
							</div>
							{#if hasAdminAccess()}
								<div
									class="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow dark:bg-gray-800 dark:from-blue-900/20 dark:to-indigo-900/20"
								>
									<dt class="text-sm font-medium text-blue-600 dark:text-blue-400">Агентские</dt>
									<dd class="mt-1 text-2xl font-semibold text-blue-700 dark:text-blue-300">
										{formatCurrency(displayStats.total_agent || 0)}
									</dd>
									<dd class="mt-1 text-xs text-blue-500 dark:text-blue-400">
										{displayStats.agent_count || 0} бонусов
									</dd>
								</div>
							{/if}
							<div
								class="rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 p-4 shadow dark:bg-gray-800 dark:from-green-900/20 dark:to-emerald-900/20"
							>
								<dt class="text-sm font-medium text-green-600 dark:text-green-400">Кураторские</dt>
								<dd class="mt-1 text-2xl font-semibold text-green-700 dark:text-green-300">
									{formatCurrency(displayStats.total_curator || 0)}
								</dd>
								<dd class="mt-1 text-xs text-green-500 dark:text-green-400">
									{displayStats.curator_count || 0} бонусов
								</dd>
							</div>
							{#if hasAdminAccess()}
								<div
									class="rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 p-4 shadow dark:bg-gray-800 dark:from-purple-900/20 dark:to-pink-900/20"
								>
									<dt class="text-sm font-medium text-purple-600 dark:text-purple-400">
										Реферальные
									</dt>
									<dd class="mt-1 text-2xl font-semibold text-purple-700 dark:text-purple-300">
										{formatCurrency(displayStats.total_referral || 0)}
									</dd>
									<dd class="mt-1 text-xs text-purple-500 dark:text-purple-400">
										{displayStats.referral_count || 0} бонусов
									</dd>
								</div>
							{/if}
						</div>

						<!-- Tabs -->
						<div class="mb-6 border-b border-gray-200 dark:border-gray-700">
							<nav class="-mb-px flex space-x-8" aria-label="Tabs">
								<button
									type="button"
									onclick={() => (activeTab = 'contracts')}
									class="whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors {activeTab ===
									'contracts'
										? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
										: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
								>
									Договора
									<span
										class="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
									>
										{displayStats.contracts_count || 0}
									</span>
								</button>
								<button
									type="button"
									onclick={() => (activeTab = 'orders')}
									class="whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors {activeTab ===
									'orders'
										? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
										: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
								>
									Заказы
									<span
										class="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
									>
										{displayStats.orders_count || 0}
									</span>
								</button>
							</nav>
						</div>

						<!-- Filters -->
						<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div class="flex flex-1 items-center gap-4">
								<!-- Status Filter -->
								<select
									bind:value={statusFilter}
									class="rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm dark:bg-gray-800 dark:text-white dark:ring-gray-600"
								>
									<option value="all">Все статусы</option>
									{#each bonusStatuses as status}
										<option value={status.code}>{status.name}</option>
									{/each}
								</select>

								<!-- Recipient Type Filter (only for admins) -->
								{#if hasAdminAccess()}
									<select
										bind:value={recipientTypeFilter}
										class="rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm dark:bg-gray-800 dark:text-white dark:ring-gray-600"
									>
										<option value="all">Все получатели</option>
										<option value="agent">Агенты</option>
										<option value="curator">Кураторы</option>
										<option value="referrer">Рефереры</option>
									</select>
								{/if}
							</div>

							<!-- Sort -->
							<div class="flex items-center gap-2">
								<select
									bind:value={sortField}
									class="rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm dark:bg-gray-800 dark:text-white dark:ring-gray-600"
								>
									<option value="accrued_at">Дата начисления</option>
									<option value="paid_at">Дата выплаты</option>
									<option value="commission_amount">Сумма бонуса</option>
								</select>
								<button
									type="button"
									onclick={() => (sortDirection = sortDirection === 'asc' ? 'desc' : 'asc')}
									class="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
									title={sortDirection === 'asc' ? 'По возрастанию' : 'По убыванию'}
								>
									{#if sortDirection === 'asc'}
										<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
											/>
										</svg>
									{:else}
										<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
											/>
										</svg>
									{/if}
								</button>
							</div>
						</div>

						<!-- Results summary -->
						{#if searchTerm.trim() || statusFilter !== 'all' || recipientTypeFilter !== 'all'}
							<div class="mb-4 text-sm text-gray-600 dark:text-gray-400">
								Найдено: {filteredBonuses.length} записей
							</div>
						{/if}

						<!-- Table -->
						{#if isLoading}
							<TableSkeleton columns={10} />
						{:else}
							<FinancesBonusTable
								bonuses={paginatedBonuses}
								{bonusStatuses}
								{partnerPaymentStatuses}
								isLoading={isRefreshing}
								onStatusChange={handleStatusChange}
								onPartnerPaymentStatusChange={handlePartnerPaymentStatusChange}
								sourceType={activeTab === 'contracts'
									? 'contract'
									: activeTab === 'orders'
										? 'order'
										: 'all'}
								{searchTerm}
							/>
						{/if}

						<!-- Pagination -->
						<Pagination bind:currentPage totalItems={filteredBonuses.length} {itemsPerPage} />
					</main>
				</div>
			</div>
		</div>
	{/snippet}
</ProtectedRoute>

<!-- Payout Request Modal for Curators -->
<PayoutRequestModal
	isOpen={showPayoutModal}
	availableAmount={displayStats.total_available || 0}
	onClose={() => (showPayoutModal = false)}
	onSuccess={() => loadData(true)}
/>
