<script>
	/**
	 * ContractActionButtons Component
	 *
	 * Action buttons specifically for contract management (View, Edit, Delete).
	 * Provides proper styling, loading states, and accessibility features.
	 *
	 * @param {Function} onView - Callback function for view action
	 * @param {Function} onEdit - Callback function for edit action
	 * @param {Function} onDelete - Callback function for delete action
	 * @param {boolean} [isLoading=false] - Loading state for disabling buttons
	 */
	let {
		onView,
		onEdit,
		onDelete,
		isLoading = false
	} = $props();
</script>

<div class="flex justify-end space-x-2">
	<!-- View Button -->
	<button
		type="button"
		onclick={(e) => {
			e.stopPropagation();
			onView();
		}}
		disabled={isLoading}
		class="inline-flex items-center rounded-md bg-gray-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
		aria-label="Просмотреть контракт"
	>
		<svg
			class="h-4 w-4"
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
				d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
			/>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
			/>
		</svg>
	</button>

	<!-- Edit Button -->
	<button
		type="button"
		onclick={(e) => {
			e.stopPropagation();
			onEdit();
		}}
		disabled={isLoading}
		class="inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
		aria-label="Редактировать контракт"
	>
		<svg
			class="h-4 w-4"
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
				d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
			/>
		</svg>
	</button>

	<!-- Delete Button -->
	<button
		type="button"
		onclick={(e) => {
			e.stopPropagation();
			onDelete();
		}}
		disabled={isLoading}
		class="inline-flex items-center rounded-md bg-red-800 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
		aria-label="Удалить контракт"
	>
		<svg
			class="h-5 w-5"
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
				d="M6 18L18 6M6 6l12 12"
			/>
		</svg>
	</button>
</div>
