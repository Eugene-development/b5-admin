<script>
	import { addErrorToast } from '$lib/utils/toastStore.js';

	let { isOpen = false, complaint = null, onSave = () => {}, onCancel = () => {}, isLoading = false, contracts = [], orders = [] } = $props();

	const safeContracts = $derived(Array.isArray(contracts) ? contracts : []);
	const safeOrders = $derived(Array.isArray(orders) ? orders : []);

	let modalElement = $state();
	let previousActiveElement;

	let formData = $state({
		id: '',
		title: '',
		description: '',
		contract_id: '',
		order_id: '',
		responsible_person: '',
		guilty_party: '',
		planned_resolution_date: '',
		actual_resolution_date: '',
		priority: 'medium',
		status: 'open',
		resolution_notes: '',
		is_active: true
	});

	$effect(() => {
		if (isOpen && complaint) {
			formData = {
				id: complaint.id,
				title: complaint.title || '',
				description: complaint.description || '',
				contract_id: complaint.contract_id || '',
				order_id: complaint.order_id || '',
				responsible_person: complaint.responsible_person || '',
				guilty_party: complaint.guilty_party || '',
				planned_resolution_date: complaint.planned_resolution_date || '',
				actual_resolution_date: complaint.actual_resolution_date || '',
				priority: complaint.priority || 'medium',
				status: complaint.status || 'open',
				resolution_notes: complaint.resolution_notes || '',
				is_active: complaint.is_active ?? true
			};
		}
	});

	function handleSubmit(event) {
		event.preventDefault();
		if (!formData.title.trim()) {
			addErrorToast('Название обязательно для заполнения');
			return;
		}
		onSave({
			id: formData.id,
			title: formData.title.trim(),
			description: formData.description.trim() || null,
			contract_id: formData.contract_id || null,
			order_id: formData.order_id || null,
			responsible_person: formData.responsible_person.trim() || null,
			guilty_party: formData.guilty_party.trim() || null,
			planned_resolution_date: formData.planned_resolution_date || null,
			actual_resolution_date: formData.actual_resolution_date || null,
			priority: formData.priority,
			status: formData.status,
			resolution_notes: formData.resolution_notes.trim() || null,
			is_active: formData.is_active
		});
	}

	function handleCancel() {
		if (!isLoading) onCancel();
	}

	function handleBackdropClick(event) {
		if (event.target === event.currentTarget && !isLoading) handleCancel();
	}

	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen && !isLoading) handleCancel();
	}

	$effect(() => {
		if (isOpen) {
			previousActiveElement = document.activeElement;
			document.addEventListener('keydown', handleKeydown);
			document.body.style.overflow = 'hidden';
		} else {
			document.removeEventListener('keydown', handleKeydown);
			document.body.style.overflow = '';
			if (previousActiveElement) previousActiveElement.focus();
		}
		return () => {
			document.removeEventListener('keydown', handleKeydown);
			document.body.style.overflow = '';
		};
	});

	function handleTabKey(event) {
		if (!isOpen) return;
		const focusableElements = modalElement?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
		if (!focusableElements || focusableElements.length === 0) return;
		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];
		if (event.key === 'Tab') {
			if (event.shiftKey) {
				if (document.activeElement === firstElement) { event.preventDefault(); lastElement.focus(); }
			} else {
				if (document.activeElement === lastElement) { event.preventDefault(); firstElement.focus(); }
			}
		}
	}
</script>

{#if isOpen && complaint}
	<div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
		<div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onclick={handleBackdropClick} aria-hidden="true"></div>

		<div class="flex min-h-full items-center justify-center p-4">
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				bind:this={modalElement}
				class="relative w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-gray-900"
				onkeydown={handleTabKey}
				tabindex="-1"
				role="document"
			>
				<!-- Header with gradient -->
				<div class="relative overflow-hidden bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 px-6 py-5">
					<div class="absolute inset-0 bg-grid-white/10"></div>
					<div class="relative flex items-start justify-between">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
								<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
								</svg>
							</div>
							<div>
								<h2 class="text-xl font-bold text-white">Редактировать рекламацию</h2>
								<p class="mt-0.5 text-sm text-rose-100">Обновите информацию о рекламации</p>
							</div>
						</div>
						<button type="button" onclick={handleCancel} disabled={isLoading} aria-label="Закрыть" class="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white disabled:opacity-50">
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
						</button>
					</div>
				</div>

				<!-- Form Content -->
				<form onsubmit={handleSubmit} class="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
					<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<!-- Title -->
						<div class="sm:col-span-2">
							<label for="edit-title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Название <span class="text-red-500">*</span></label>
							<input type="text" id="edit-title" bind:value={formData.title} required disabled={isLoading} class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white" placeholder="Краткое описание проблемы" />
						</div>

						<!-- Description -->
						<div class="sm:col-span-2">
							<label for="edit-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Описание</label>
							<textarea id="edit-description" bind:value={formData.description} rows="3" disabled={isLoading} class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white" placeholder="Подробное описание"></textarea>
						</div>

						<!-- Contract -->
						<div>
							<label for="edit-contract_id" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Контракт</label>
							<select id="edit-contract_id" bind:value={formData.contract_id} disabled={isLoading} class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
								<option value="">Не выбрано</option>
								{#each safeContracts as contract}<option value={contract.id}>{contract.contract_number || contract.id}</option>{/each}
							</select>
						</div>

						<!-- Order -->
						<div>
							<label for="edit-order_id" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Закупка</label>
							<select id="edit-order_id" bind:value={formData.order_id} disabled={isLoading} class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
								<option value="">Не выбрано</option>
								{#each safeOrders as order}<option value={order.id}>{order.order_number || order.id}</option>{/each}
							</select>
						</div>

						<!-- Responsible Person -->
						<div>
							<label for="edit-responsible_person" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Ответственный</label>
							<input type="text" id="edit-responsible_person" bind:value={formData.responsible_person} disabled={isLoading} class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white" placeholder="ФИО" />
						</div>

						<!-- Guilty Party -->
						<div>
							<label for="edit-guilty_party" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Виновная сторона</label>
							<input type="text" id="edit-guilty_party" bind:value={formData.guilty_party} disabled={isLoading} class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
						</div>

						<!-- Priority -->
						<div>
							<label for="edit-priority" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Приоритет</label>
							<select id="edit-priority" bind:value={formData.priority} disabled={isLoading} class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
								<option value="low">Низкий</option>
								<option value="medium">Средний</option>
								<option value="high">Высокий</option>
								<option value="critical">Критический</option>
							</select>
						</div>

						<!-- Status -->
						<div>
							<label for="edit-status" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Статус</label>
							<select id="edit-status" bind:value={formData.status} disabled={isLoading} class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
								<option value="open">Открыта</option>
								<option value="in_progress">В работе</option>
								<option value="resolved">Решена</option>
								<option value="closed">Закрыта</option>
							</select>
						</div>

						<!-- Dates -->
						<div>
							<label for="edit-planned_resolution_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Плановая дата решения</label>
							<input type="date" id="edit-planned_resolution_date" bind:value={formData.planned_resolution_date} disabled={isLoading} class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
						</div>

						<div>
							<label for="edit-actual_resolution_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Фактическая дата решения</label>
							<input type="date" id="edit-actual_resolution_date" bind:value={formData.actual_resolution_date} disabled={isLoading} class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
						</div>

						<!-- Resolution Notes -->
						<div class="sm:col-span-2">
							<label for="edit-resolution_notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Заметки о решении</label>
							<textarea id="edit-resolution_notes" bind:value={formData.resolution_notes} rows="2" disabled={isLoading} class="mt-1.5 block w-full rounded-lg border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white" placeholder="Как была решена проблема"></textarea>
						</div>

						<!-- Active Status -->
						<div class="sm:col-span-2">
							<div class="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
								<input type="checkbox" id="edit-is_active" bind:checked={formData.is_active} disabled={isLoading} class="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500 dark:border-gray-600 dark:bg-gray-700" />
								<label for="edit-is_active" class="text-sm font-medium text-gray-900 dark:text-white">Рекламация активна</label>
							</div>
						</div>
					</div>
				</form>

				<!-- Footer -->
				<div class="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
					<div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
						<button type="button" onclick={handleCancel} disabled={isLoading} class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
							Отмена
						</button>
						<button type="submit" onclick={handleSubmit} disabled={isLoading} class="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-gray-900">
							{#if isLoading}
								<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
							{/if}
							{isLoading ? 'Сохранение...' : 'Сохранить'}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
