<script>
	import OrderTable from '$lib/components/OrderTable.svelte';
	import { page } from '$app/stores';
	import { hasOrderAccess, initializeDomainDetection } from '$lib/utils/domainAccess.svelte.js';
	import { onMount } from 'svelte';
	import {
		ToastContainer,
		ErrorBoundary
	} from '$lib';
	import {
		toasts,
		addSuccessToast,
		addErrorToast,
		handleApiError,
		clearAllToasts
	} from '$lib/utils/toastStore.js';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
	let hasAccess = $state(false);
	let orders = $state(data.orders || []);
	let isLoading = $state(false);
	let searchTerm = $state('');
	let hasSearched = $state(false);
	let filteredOrders = $state([]);
	let updateCounter = $state(0);

	// Error boundary state
	let hasError = $state(false);
	let errorBoundaryError = $state(null);

	// Check for server-side load errors
	let loadError = $state(data?.error || null);

	// Initialize domain detection and check access
	onMount(() => {
		initializeDomainDetection();
		hasAccess = hasOrderAccess();
	});

	// Initialize filtered orders
	$effect(() => {
		filteredOrders = orders;
	});

	// Search functionality
	function handleSearch() {
		if (!searchTerm.trim()) {
			filteredOrders = orders;
			hasSearched = false;
			return;
		}

		hasSearched = true;
		const term = searchTerm.toLowerCase().trim();
		
		filteredOrders = orders.filter(order => {
			return (
				order.id.toString().includes(term) ||
				(order.supplier && order.supplier.toLowerCase().includes(term)) ||
				(order.phone && order.phone.toLowerCase().includes(term)) ||
				(order.deal && order.deal.toLowerCase().includes(term)) ||
				(order.comment && order.comment.toLowerCase().includes(term))
			);
		});
	}

	// Clear search
	function clearSearch() {
		searchTerm = '';
		filteredOrders = orders;
		hasSearched = false;
	}

	// Handle delete order
	async function handleDeleteOrder(order) {
		if (!confirm(`Вы уверены, что хотите удалить заказ #${order.id}?`)) {
			return;
		}

		isLoading = true;
		try {
			// Здесь будет запрос к API для удаления заказа
			// Пока просто удаляем из локального массива
			orders = orders.filter(o => o.id !== order.id);
			filteredOrders = filteredOrders.filter(o => o.id !== order.id);
			updateCounter++;
			
			addSuccessToast(`Заказ #${order.id} успешно удален`);
		} catch (error) {
			handleApiError(error, 'Ошибка при удалении заказа');
		} finally {
			isLoading = false;
		}
	}

	// Handle edit order
	function handleEditOrder(order) {
		// Здесь будет логика редактирования заказа
		console.log('Edit order:', order);
		alert(`Редактирование заказа #${order.id} (функция в разработке)`);
	}

	// Handle keyboard shortcuts
	function handleKeydown(event) {
		// Ctrl/Cmd + K to focus search
		if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
			event.preventDefault();
			document.getElementById('order-search')?.focus();
		}
		// Escape to clear search
		if (event.key === 'Escape' && searchTerm) {
			clearSearch();
		}
	}

	// Load orders
	async function loadServices() {
		isLoading = true;
		try {
			await invalidateAll();
			addSuccessToast('Данные успешно обновлены');
			updateCounter++;
		} catch (error) {
			handleApiError(error, 'Не удалось обновить данные');
		} finally {
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
		// Reinitialize access check
		initializeDomainDetection();
		hasAccess = hasOrderAccess();
	}

	// Handle initial load error
	onMount(() => {
		if (loadError) {
			addErrorToast(loadError.message, { duration: 0 });
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<ProtectedRoute>
	{#snippet children()}
		<ErrorBoundary
			{hasError}
			error={errorBoundaryError}
			onError={handleErrorBoundaryError}
			onRetry={retryFromErrorBoundary}
			fallbackTitle="Order Page Error"
			fallbackMessage="An error occurred while loading the order page."
			showDetails={true}
		>
			{#if !hasAccess}
	<div class="flex min-h-[400px] items-center justify-center">
		<div class="text-center">
			<div class="mx-auto h-12 w-12 text-gray-400">
				<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
					/>
				</svg>
			</div>
			<h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">Доступ запрещен</h3>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
				Страница заказов доступна только с доменов admin.bonus.band, bonus.band и rubonus.info
			</p>
		</div>
	</div>
{:else}
	<div class="space-y-6">
	<!-- Page Header -->
	<div class="border-b border-gray-200 pb-5 dark:border-gray-700">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl">
					Заказы
				</h1>
				<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
					Управление заказами и их статусами
				</p>
			</div>
			<div class="flex items-center space-x-3">
				<!-- Refresh Button -->
				<button
					type="button"
					onclick={loadServices}
					disabled={isLoading}
					class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-700"
				>
					{#if isLoading}
						<svg
							class="mr-2 h-4 w-4 animate-spin"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
					{:else}
						<svg
							class="mr-2 h-4 w-4"
							xmlns="http://www.w3.org/2000/svg"
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
					{/if}
					Обновить
				</button>
				<!-- Add Order Button -->
				<button
					type="button"
					class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
				>
					<svg
						class="-ml-0.5 mr-1.5 h-5 w-5"
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
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Добавить заказ
				</button>
			</div>
		</div>
	</div>

	<!-- Search and Filters -->
	<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
		<div class="flex flex-1 items-center space-x-4">
			<!-- Search Input -->
			<div class="relative flex-1 max-w-md">
				<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
					<svg
						class="h-5 w-5 text-gray-400"
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
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</div>
				<input
					id="order-search"
					type="text"
					bind:value={searchTerm}
					oninput={handleSearch}
					class="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500 sm:text-sm sm:leading-6"
					placeholder="Поиск заказов... (Ctrl+K)"
					aria-label="Поиск заказов"
				/>
				{#if searchTerm}
					<button
						type="button"
						onclick={clearSearch}
						class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
						aria-label="Очистить поиск"
					>
						<svg
							class="h-5 w-5"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				{/if}
			</div>
		</div>

		<!-- Results Counter -->
		<div class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
			{#if hasSearched}
				<span>
					Найдено: {filteredOrders.length} из {orders.length}
				</span>
			{:else}
				<span>
					Всего заказов: {orders.length}
				</span>
			{/if}
		</div>
	</div>

	<!-- Orders Table -->
	<div class="rounded-lg bg-white shadow dark:bg-gray-800">
		<OrderTable
			orders={filteredOrders}
			{isLoading}
			{searchTerm}
			{hasSearched}
			{updateCounter}
			onDeleteOrder={handleDeleteOrder}
			onEditOrder={handleEditOrder}
		/>
		</div>
	</div>
	{/if}
		</ErrorBoundary>
	{/snippet}
</ProtectedRoute>

<!-- Toast Notifications -->
<ToastContainer toasts={$toasts} position="top-center" />