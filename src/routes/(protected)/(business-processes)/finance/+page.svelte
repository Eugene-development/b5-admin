<script>
	import { onMount } from 'svelte';
	import ProtectedRoute from '$lib/components/common/ProtectedRoute.svelte';
	import TableSkeleton from '$lib/components/common/TableSkeleton.svelte';
	import Pagination from '$lib/components/common/Pagination.svelte';
	import { RefreshButton, AddButton, ErrorBoundary, SearchBar } from '$lib';
	import AgentPaymentsTable from '$lib/components/business-processes/finance/AgentPaymentsTable.svelte';
	import CreatePaymentModal from '$lib/components/business-processes/finance/CreatePaymentModal.svelte';
	import PaymentDetailModal from '$lib/components/business-processes/finance/PaymentDetailModal.svelte';
	import {
		getAgentPaymentsAdmin,
		getAgentsWithAvailableBonuses,
		getPaymentMethods,
		getPaymentStatuses,
		updatePaymentStatus
	} from '$lib/api/finances.js';
	import {
		addSuccessToast,
		handleApiError,
		clearAllToasts
	} from '$lib/utils/toastStore.js';

	let { data } = $props();

	// Data state
	let payments = $state([]);
	let agents = $state([]);
	let paymentMethods = $state([]);
	let paymentStatuses = $state([]);

	// UI state
	let isLoading = $state(false);
	let isRefreshing = $state(false);
	let searchTerm = $state('');

	// Pagination
	let currentPage = $state(1);
	const itemsPerPage = 8;

	// Modals
	let showCreateModal = $state(false);
	let showDetailModal = $state(false);
	let selectedPayment = $state(null);

	// Error boundary
	let hasError = $state(false);
	let errorBoundaryError = $state(null);

	// Filtered payments
	let filteredPayments = $derived.by(() => {
		if (!searchTerm.trim()) return payments;
		const term = searchTerm.toLowerCase();
		return payments.filter((p) =>
			p.agent?.name?.toLowerCase().includes(term) ||
			p.agent?.email?.toLowerCase().includes(term) ||
			p.reference_number?.toLowerCase().includes(term)
		);
	});

	// Paginated payments
	let paginatedPayments = $derived.by(() => {
		const start = (currentPage - 1) * itemsPerPage;
		return filteredPayments.slice(start, start + itemsPerPage);
	});

	// Load data
	async function refreshData(isInitialLoad = false) {
		isRefreshing = true;
		try {
			const [paymentsData, agentsData, methodsData, statusesData] = await Promise.all([
				getAgentPaymentsAdmin(),
				getAgentsWithAvailableBonuses(),
				getPaymentMethods(),
				getPaymentStatuses()
			]);
			payments = paymentsData;
			agents = agentsData;
			paymentMethods = methodsData;
			paymentStatuses = statusesData;

			if (!isInitialLoad) {
				addSuccessToast('Данные обновлены');
			}
		} catch (error) {
			handleApiError(error, 'Не удалось загрузить данные');
		} finally {
			isRefreshing = false;
		}
	}

	// Handle create payment
	function handleCreatePayment() {
		showCreateModal = true;
		clearAllToasts();
	}

	// Handle payment created
	function handlePaymentCreated(payment) {
		payments = [payment, ...payments];
		refreshData(); // Refresh to update agents list
	}

	// Handle view payment
	function handleViewPayment(payment) {
		selectedPayment = payment;
		showDetailModal = true;
	}

	// Handle update status
	async function handleUpdateStatus(payment, statusCode) {
		isLoading = true;
		try {
			const result = await updatePaymentStatus(payment.id, statusCode);
			payments = payments.map((p) =>
				p.id === payment.id ? { ...p, status: result.status } : p
			);
			addSuccessToast('Статус выплаты обновлён');
			refreshData(); // Refresh to update agents list
		} catch (error) {
			console.error('Failed to update status:', error);
		} finally {
			isLoading = false;
		}
	}

	// Handle error boundary
	function handleErrorBoundaryError(error) {
		hasError = true;
		errorBoundaryError = error;
		handleApiError(error, 'Критическая ошибка');
	}

	function retryFromErrorBoundary() {
		hasError = false;
		errorBoundaryError = null;
		refreshData();
	}

	// Reset page on search
	$effect(() => {
		searchTerm;
		currentPage = 1;
	});

	onMount(() => {
		refreshData(true);
	});
</script>

<ProtectedRoute>
	{#snippet children()}
		<ErrorBoundary
			{hasError}
			error={errorBoundaryError}
			onError={handleErrorBoundaryError}
			onRetry={retryFromErrorBoundary}
		>
			{#if isRefreshing && payments.length === 0}
				<TableSkeleton columns={7} />
			{:else}
				<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
					<div class="px-4 py-7 sm:px-6 lg:px-7">
						<div class="mx-auto ">
							<main>
								<!-- Header with Search -->
								<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
									<div class="flex flex-1 items-center justify-start">
										<div class="w-full max-w-md">
											<SearchBar 
												bind:value={searchTerm} 
												placeholder="Поиск по агенту или номеру документа..." 
											/>
										</div>
									</div>
									<div class="flex items-center justify-end space-x-3">
										<AddButton onclick={handleCreatePayment} disabled={isLoading} />
										<RefreshButton {isRefreshing} onclick={() => refreshData()} />
									</div>
								</div>
								
								<!-- Hidden H1 for accessibility -->
								<h1 class="sr-only">
									Выплаты агентам
								</h1>
								<p class="sr-only">
									Управление выплатами бонусов агентам
								</p>

								<div class="my-4 border-t border-gray-200 dark:border-gray-700"></div>

								<!-- Stats Cards -->
								{#if agents.length > 0}
									<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
										<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
											<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
												Агентов с доступными бонусами
											</dt>
											<dd class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
												{agents.length}
											</dd>
										</div>
										<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
											<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
												Всего к выплате
											</dt>
											<dd class="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
												{new Intl.NumberFormat('ru-RU', {
													style: 'currency',
													currency: 'RUB',
													minimumFractionDigits: 0
												}).format(agents.reduce((sum, a) => sum + (a.available_bonuses_total || 0), 0))}
											</dd>
										</div>
										<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
											<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
												Выплат создано
											</dt>
											<dd class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
												{payments.length}
											</dd>
										</div>
									</div>
								{/if}

								<!-- Table -->
								<AgentPaymentsTable
									payments={paginatedPayments}
									{isLoading}
									{paymentStatuses}
									{searchTerm}
									hasSearched={searchTerm.trim().length > 0}
									onViewPayment={handleViewPayment}
									onUpdateStatus={handleUpdateStatus}
								/>

								<!-- Pagination -->
								<Pagination
									bind:currentPage
									totalItems={filteredPayments.length}
									{itemsPerPage}
									filteredFrom={searchTerm.trim() ? payments.length : null}
								/>
							</main>
						</div>
					</div>
				</div>
			{/if}
		</ErrorBoundary>
	{/snippet}
</ProtectedRoute>

<!-- Create Payment Modal -->
<CreatePaymentModal
	isOpen={showCreateModal}
	{agents}
	{paymentMethods}
	onClose={() => (showCreateModal = false)}
	onPaymentCreated={handlePaymentCreated}
/>

<!-- Payment Detail Modal -->
<PaymentDetailModal
	isOpen={showDetailModal}
	payment={selectedPayment}
	onClose={() => {
		showDetailModal = false;
		selectedPayment = null;
	}}
/>
