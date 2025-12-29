<script>
	import { onMount } from 'svelte';
	import ProtectedRoute from '$lib/components/common/ProtectedRoute.svelte';
	import { RefreshButton, SearchBar } from '$lib';
	import Pagination from '$lib/components/common/Pagination.svelte';
	import TableSkeleton from '$lib/components/common/TableSkeleton.svelte';
	import FinancesBonusTable from '$lib/components/business-processes/finances/FinancesBonusTable.svelte';
	import {
		getAdminBonuses,
		getAdminBonusStats,
		getBonusStatuses,
		getPartnerPaymentStatuses,
		updateContractPartnerPaymentStatus,
		updateOrderPartnerPaymentStatus
	} from '$lib/api/finances.js';
	import { addSuccessToast, handleApiError } from '$lib/utils/toastStore.js';

	// Tab state
	let activeTab = $state('contracts');

	// Data state
	let bonuses = $state([]);
	let stats = $state({
		total_pending: 0,
		total_paid: 0,
		contracts_count: 0,
		orders_count: 0
	});
	let bonusStatuses = $state([]);
	let partnerPaymentStatuses = $state([]);

	// Loading state
	let isLoading = $state(true);
	let isRefreshing = $state(false);

	// Search and filter state
	let searchTerm = $state('');
	let statusFilter = $state('all');
	let sortField = $state('accrued_at');
	let sortDirection = $state('desc');

	// Pagination
	let currentPage = $state(1);
	const itemsPerPage = 10;

	// Filter bonuses by source type
	let filteredBonuses = $derived.by(() => {
		let filtered = bonuses.filter(b => {
			if (activeTab === 'contracts') return b.source_type === 'contract';
			if (activeTab === 'orders') return b.source_type === 'order';
			return true;
		});

		// Apply status filter
		if (statusFilter !== 'all') {
			filtered = filtered.filter(b => b.status?.code === statusFilter);
		}

		// Apply search
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter(b => {
				const sourceNumber = b.source_type === 'contract' 
					? (b.contract?.contract_number || '').toLowerCase()
					: (b.order?.order_number || '').toLowerCase();
				const projectName = (b.project_name || '').toLowerCase();
				const agentName = (b.agent?.name || '').toLowerCase();
				return sourceNumber.includes(term) || projectName.includes(term) || agentName.includes(term);
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

	// Reset page on filter change
	$effect(() => {
		activeTab;
		searchTerm;
		statusFilter;
		currentPage = 1;
	});

	// Format currency
	function formatCurrency(amount) {
		if (amount === null || amount === undefined) return '0 ₽';
		return new Intl.NumberFormat('ru-RU', {
			style: 'currency',
			currency: 'RUB',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Load data
	async function loadData(showToast = false) {
		isRefreshing = true;
		try {
			const [bonusesData, statsData, statusesData, partnerStatusesData] = await Promise.all([
				getAdminBonuses(),
				getAdminBonusStats(),
				bonusStatuses.length === 0 ? getBonusStatuses() : Promise.resolve(bonusStatuses),
				partnerPaymentStatuses.length === 0 ? getPartnerPaymentStatuses() : Promise.resolve(partnerPaymentStatuses)
			]);
			bonuses = bonusesData;
			stats = statsData;
			if (statusesData !== bonusStatuses) bonusStatuses = statusesData;
			if (partnerStatusesData !== partnerPaymentStatuses) partnerPaymentStatuses = partnerStatusesData;
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
		bonuses = bonuses.map(b => 
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
						<!-- Header with SearchBar -->
						<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
							<div class="flex flex-1 items-center justify-start">
								<div class="w-full max-w-md">
									<SearchBar bind:value={searchTerm} placeholder="Поиск по таблице Финансы..." />
								</div>
							</div>
							<div class="flex items-center justify-end space-x-3">
								<RefreshButton
									{isRefreshing}
									onclick={() => loadData(true)}
								/>
							</div>
						</div>

						<!-- Hidden H1 for accessibility -->
						<h1 id="page-title" class="sr-only">
							Финансы
						</h1>

						<!-- Metrics Cards -->
						<div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
							<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Ожидание</dt>
								<dd class="mt-1 text-2xl font-semibold text-gray-600 dark:text-gray-400">
									{formatCurrency(stats.total_pending)}
								</dd>
							</div>
							<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Выплачено</dt>
								<dd class="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
									{formatCurrency(stats.total_paid)}
								</dd>
							</div>
							<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
								<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Всего</dt>
								<dd class="mt-1 text-2xl font-semibold text-gray-600 dark:text-gray-300">
									{formatCurrency((stats.total_pending || 0) + (stats.total_paid || 0))}
								</dd>
							</div>
						</div>

						<!-- Tabs -->
						<div class="mb-6 border-b border-gray-200 dark:border-gray-700">
							<nav class="-mb-px flex space-x-8" aria-label="Tabs">
								<button
									type="button"
									onclick={() => activeTab = 'contracts'}
									class="whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors {activeTab === 'contracts' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
								>
									Договора
									<span class="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
										{stats.contracts_count || 0}
									</span>
								</button>
								<button
									type="button"
									onclick={() => activeTab = 'orders'}
									class="whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors {activeTab === 'orders' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
								>
									Заказы
									<span class="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
										{stats.orders_count || 0}
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
									onclick={() => sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'}
									class="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
									title={sortDirection === 'asc' ? 'По возрастанию' : 'По убыванию'}
								>
									{#if sortDirection === 'asc'}
										<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
										</svg>
									{:else}
										<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
										</svg>
									{/if}
								</button>
							</div>
						</div>

						<!-- Results summary -->
						{#if searchTerm.trim() || statusFilter !== 'all'}
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
								sourceType={activeTab === 'contracts' ? 'contract' : activeTab === 'orders' ? 'order' : 'all'}
								{searchTerm}
							/>
						{/if}

						<!-- Pagination -->
						<Pagination
							bind:currentPage
							totalItems={filteredBonuses.length}
							{itemsPerPage}
						/>
					</main>
				</div>
			</div>
		</div>
	{/snippet}
</ProtectedRoute>
