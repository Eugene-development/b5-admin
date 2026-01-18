<script>
	/**
	 * Страница выплат бонусов
	 * Feature: bonus-payments
	 * Requirements: 6.1, 6.8
	 */
	import PaymentsTable from '$lib/components/finances/PaymentsTable.svelte';
	import TableSkeleton from '$lib/components/common/TableSkeleton.svelte';
	import Pagination from '$lib/components/common/Pagination.svelte';
	import { onMount } from 'svelte';
	import { ErrorBoundary, RefreshButton, SearchBar, PageTitle } from '$lib';
	import { addSuccessToast, handleApiError } from '$lib/utils/toastStore.js';
	import ProtectedRoute from '$lib/components/common/ProtectedRoute.svelte';
	import { invalidateAll } from '$app/navigation';
	import { getBonusPaymentRequests, getBonusPaymentStatuses } from '$lib/api/bonusPayments.js';

	let { data } = $props();
	let requests = $state([]);
	let statuses = $state([]);
	let isLoading = $state(true);
	let isRefreshing = $state(false);
	let searchTerm = $state('');
	let hasSearched = $state(false);
	let updateCounter = $state(0);

	// Tab state for filtering by requester type
	let activeTab = $state('agents');

	// Pagination state
	let currentPage = $state(1);
	const itemsPerPage = 10;

	// Error boundary state
	let hasError = $state(false);
	let errorBoundaryError = $state(null);

	// Initialize data
	onMount(async () => {
		// Check if we have SSR data
		if (data.paymentsData?.requests?.length > 0) {
			requests = data.paymentsData.requests;
			statuses = data.paymentsData.statuses || [];
			isLoading = false;
		} else if (data.paymentsData?.statuses?.length > 0) {
			statuses = data.paymentsData.statuses;
			isLoading = false;
		} else {
			await refreshData(true);
		}
	});

	// Filtered requests based on tab and search term
	let filteredRequests = $derived.by(() => {
		updateCounter;

		// First filter by requester type (tab)
		let filtered = requests.filter((request) => {
			const requesterType = request.requester_type || 'agent';
			if (activeTab === 'agents') return requesterType === 'agent';
			if (activeTab === 'curators') return requesterType === 'curator';
			return true;
		});

		// Then apply search filter
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase().trim();
			filtered = filtered.filter((request) => {
				return (
					request.id.toString().includes(term) ||
					(request.agent?.name && request.agent.name.toLowerCase().includes(term)) ||
					(request.agent?.email && request.agent.email.toLowerCase().includes(term)) ||
					(request.agent?.phone && request.agent.phone.toLowerCase().includes(term)) ||
					(request.card_number && request.card_number.toLowerCase().includes(term)) ||
					(request.phone_number && request.phone_number.toLowerCase().includes(term)) ||
					(request.contact_info && request.contact_info.toLowerCase().includes(term)) ||
					(request.comment && request.comment.toLowerCase().includes(term)) ||
					(request.status?.name && request.status.name.toLowerCase().includes(term))
				);
			});
		}

		return filtered;
	});

	// Count requests by type for tab badges
	let agentRequestsCount = $derived(
		requests.filter((r) => (r.requester_type || 'agent') === 'agent').length
	);
	let curatorRequestsCount = $derived(
		requests.filter((r) => r.requester_type === 'curator').length
	);

	// Get paginated requests
	let paginatedRequests = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredRequests.slice(startIndex, endIndex);
	});

	// Calculate total pages
	let totalPages = $derived(Math.ceil(filteredRequests.length / itemsPerPage));

	// Auto-correct currentPage if it exceeds total pages
	$effect(() => {
		if (totalPages > 0 && currentPage > totalPages) {
			currentPage = totalPages;
		}
	});

	// Search functionality
	function handleSearch() {
		hasSearched = searchTerm.trim().length > 0;
		currentPage = 1;
	}

	// Clear search
	function clearSearch() {
		searchTerm = '';
		hasSearched = false;
		currentPage = 1;
	}

	// Reset to first page when filters change
	$effect(() => {
		searchTerm;
		activeTab;
		currentPage = 1;
	});

	// Handle keyboard shortcuts
	function handleKeydown(event) {
		if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
			event.preventDefault();
			document.getElementById('payments-search')?.focus();
		}
		if (event.key === 'Escape' && searchTerm) {
			clearSearch();
		}
	}

	// Load data
	async function refreshData(isInitialLoad = false) {
		isRefreshing = true;
		try {
			const [requestsData, statusesData] = await Promise.all([
				getBonusPaymentRequests(100, 1),
				statuses.length === 0 ? getBonusPaymentStatuses() : Promise.resolve(statuses)
			]);

			requests = requestsData.data || [];
			if (statusesData && Array.isArray(statusesData)) {
				statuses = statusesData;
			}

			if (!isInitialLoad) {
				addSuccessToast('Данные обновлены');
			}
			updateCounter++;
		} catch (error) {
			handleApiError(error, 'Не удалось обновить данные');
		} finally {
			isRefreshing = false;
			isLoading = false;
		}
	}

	// Handle error boundary errors
	function handleErrorBoundaryError(error) {
		hasError = true;
		errorBoundaryError = error;
		handleApiError(error, 'Критическая ошибка');
	}

	// Retry from error boundary
	async function retryFromErrorBoundary() {
		hasError = false;
		errorBoundaryError = null;
	}

	// Handle retry for load errors
	async function handleRetry() {
		await invalidateAll();
	}

	// Handle status change
	function handleStatusChange(requestId, result) {
		requests = requests.map((request) =>
			request.id === requestId
				? {
						...request,
						status: result.status,
						status_id: result.status_id,
						payment_date: result.payment_date
					}
				: request
		);
		updateCounter++;
	}

	// Handle payment update
	function handlePaymentUpdate(updatedPayment) {
		requests = requests.map((request) =>
			request.id === updatedPayment.id ? updatedPayment : request
		);
		updateCounter++;
		addSuccessToast('Заявка обновлена');
	}

	// Handle payment delete
	function handlePaymentDelete(paymentId) {
		requests = requests.filter((request) => request.id !== paymentId);
		updateCounter++;
		addSuccessToast('Заявка удалена');
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<ProtectedRoute>
	{#snippet children()}
		<ErrorBoundary
			{hasError}
			error={errorBoundaryError}
			onError={handleErrorBoundaryError}
			onRetry={retryFromErrorBoundary}
			fallbackTitle="Payments Page Error"
			fallbackMessage="An error occurred while loading the payments page."
			showDetails={true}
		>
			{@const paymentsData = data.paymentsData}

			<!-- Initialize local state from loaded data -->
			{#if requests.length === 0 && paymentsData.requests?.length > 0}
				{((requests = paymentsData.requests), '')}
			{/if}
			{#if statuses.length === 0 && paymentsData.statuses?.length > 0}
				{((statuses = paymentsData.statuses), '')}
			{/if}

			{#if paymentsData.error}
				<!-- Error state from API -->
				<div class="flex min-h-[400px] items-center justify-center">
					<div class="mx-auto max-w-md text-center">
						<div class="rounded-lg border border-red-500/30 bg-red-500/10 p-8 dark:bg-red-500/20">
							<svg
								class="mx-auto h-12 w-12 text-red-600 dark:text-red-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
							<h3 class="mb-4 mt-4 text-xl font-semibold text-gray-900 dark:text-white">
								Ошибка загрузки выплат
							</h3>
							<p class="mb-6 text-sm text-red-600 dark:text-red-300">
								{paymentsData.error.message}
							</p>
							{#if paymentsData.error.canRetry}
								<button
									onclick={handleRetry}
									class="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
								>
									<svg
										class="mr-2 h-4 w-4"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
										/>
									</svg>
									Попробовать снова
								</button>
							{/if}
						</div>
					</div>
				</div>
			{:else if isLoading || (isRefreshing && requests.length === 0)}
				<TableSkeleton columns={9} />
			{:else}
				<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
					<div class="px-4 py-7 sm:px-6 lg:px-7">
						<div class="mx-auto">
							<main id="main-content" aria-labelledby="page-title">
								<!-- Header -->
								<div
									class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
								>
									<PageTitle title="Выплаты" />
									<div class="flex items-center space-x-3">
										<div class="w-80">
											<SearchBar
												bind:value={searchTerm}
												onSearch={handleSearch}
												placeholder="Поиск по выплатам..."
											/>
										</div>
										<RefreshButton {isRefreshing} onclick={refreshData} />
									</div>
								</div>

								<!-- Tabs for Agents/Curators -->
								<div class="mt-6 border-b border-gray-200 dark:border-gray-700">
									<nav class="-mb-px flex space-x-8" aria-label="Tabs">
										<button
											type="button"
											onclick={() => (activeTab = 'agents')}
											class="whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors {activeTab ===
											'agents'
												? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
												: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
										>
											Агенты
											<span
												class="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
											>
												{agentRequestsCount}
											</span>
										</button>
										<button
											type="button"
											onclick={() => (activeTab = 'curators')}
											class="whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors {activeTab ===
											'curators'
												? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
												: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
										>
											Кураторы
											<span
												class="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
											>
												{curatorRequestsCount}
											</span>
										</button>
									</nav>
								</div>

								<!-- Results info -->
								{#if searchTerm.trim()}
									<div class="mb-4 text-sm text-gray-600 dark:text-gray-400">
										{#if filteredRequests.length === 0}
											Выплаты не найдены по запросу "{searchTerm}"
										{:else}
											Найдено {filteredRequests.length} выплат{filteredRequests.length === 1
												? 'а'
												: filteredRequests.length < 5
													? 'ы'
													: ''} по запросу "{searchTerm}"
										{/if}
									</div>
								{/if}

								<!-- Table -->
								<div class="mt-4">
									<PaymentsTable
										requests={paginatedRequests}
										{isLoading}
										{statuses}
										{searchTerm}
										{hasSearched}
										{updateCounter}
										onStatusChange={handleStatusChange}
										onPaymentUpdate={handlePaymentUpdate}
										onPaymentDelete={handlePaymentDelete}
									/>
								</div>

								<!-- Pagination -->
								<Pagination
									bind:currentPage
									totalItems={filteredRequests.length}
									{itemsPerPage}
									filteredFrom={searchTerm.trim() ? requests.length : null}
								/>
							</main>
						</div>
					</div>
				</div>
			{/if}
		</ErrorBoundary>
	{/snippet}
</ProtectedRoute>
