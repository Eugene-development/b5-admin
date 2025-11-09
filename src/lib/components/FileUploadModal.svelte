<script>
	let {
		isOpen = false,
		title = 'Загрузить файл',
		onUpload,
		onCancel,
		isLoading = false
	} = $props();

	let selectedFile = $state(null);
	let fileInput = $state(null);
	let dragActive = $state(false);

	// Reset form when modal opens/closes
	$effect(() => {
		if (isOpen) {
			selectedFile = null;
			if (fileInput) {
				fileInput.value = '';
			}
		}
	});

	// Handle body scroll when modal is open/closed
	$effect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}

		return () => {
			document.body.style.overflow = '';
		};
	});

	function handleFileSelect(event) {
		const file = event.target.files?.[0];
		if (file) {
			selectedFile = file;
		}
	}

	function handleDragEnter(e) {
		e.preventDefault();
		e.stopPropagation();
		dragActive = true;
	}

	function handleDragLeave(e) {
		e.preventDefault();
		e.stopPropagation();
		dragActive = false;
	}

	function handleDragOver(e) {
		e.preventDefault();
		e.stopPropagation();
	}

	function handleDrop(e) {
		e.preventDefault();
		e.stopPropagation();
		dragActive = false;

		const file = e.dataTransfer?.files?.[0];
		if (file) {
			selectedFile = file;
		}
	}

	function handleSubmit(event) {
		event.preventDefault();
		if (selectedFile && onUpload) {
			onUpload(selectedFile);
		}
	}

	function handleBackdropClick(event) {
		if (event.target === event.currentTarget && !isLoading) {
			onCancel();
		}
	}

	function handleKeydown(event) {
		if (event.key === 'Escape' && !isLoading) {
			onCancel();
		}
	}

	function handleModalClick(event) {
		event.stopPropagation();
	}

	function formatFileSize(bytes) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 overflow-y-auto"
		aria-labelledby="modal-title"
		role="dialog"
		aria-modal="true"
	>
		<div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
			<!-- Background overlay -->
			<div
				class="fixed inset-0 bg-black/80 transition-opacity dark:bg-black/80"
				onclick={handleBackdropClick}
				onkeydown={handleKeydown}
				tabindex="0"
				role="button"
				aria-label="Close modal"
				aria-hidden="true"
			></div>

			<!-- Modal panel -->
			<div
				class="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 dark:bg-gray-800"
				onclick={handleModalClick}
				onkeydown={handleKeydown}
				tabindex="0"
				role="dialog"
			>
				<!-- Modal header -->
				<div
					class="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-600"
				>
					<h3
						class="text-lg leading-6 font-semibold text-gray-900 dark:text-white"
						id="modal-title"
					>
						{title}
					</h3>
					<button
						type="button"
						onclick={onCancel}
						disabled={isLoading}
						class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white"
						aria-label="Закрыть модальное окно"
					>
						<svg
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<!-- Modal content -->
				<form onsubmit={handleSubmit} class="mt-6">
					<div class="space-y-6">
						<!-- File upload area -->
						<div>
							<label
								for="file-upload"
								class="block text-sm font-medium text-gray-900 dark:text-white"
							>
								Выберите файл <span class="text-red-500">*</span>
							</label>
							<div
								class="mt-2"
								role="button"
								tabindex="0"
								ondragenter={handleDragEnter}
								ondragleave={handleDragLeave}
								ondragover={handleDragOver}
								ondrop={handleDrop}
							>
								<label
									for="file-upload"
									class="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors {dragActive
										? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
										: 'border-gray-300 hover:border-indigo-400 dark:border-gray-600 dark:hover:border-indigo-500'}"
								>
									<svg
										class="mb-3 h-10 w-10 text-gray-400 dark:text-gray-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
										/>
									</svg>
									<p class="mb-2 text-sm text-gray-700 dark:text-gray-300">
										<span class="font-semibold text-indigo-600 dark:text-indigo-400"
											>Нажмите для выбора</span
										>
										или перетащите файл
									</p>
									<p class="text-xs text-gray-500 dark:text-gray-400">
										PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (MAX. 10MB)
									</p>
									<input
										id="file-upload"
										type="file"
										class="hidden"
										bind:this={fileInput}
										onchange={handleFileSelect}
										accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
										disabled={isLoading}
									/>
								</label>
							</div>
						</div>

						<!-- Selected file preview -->
						{#if selectedFile}
							<div
								class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900"
							>
								<div class="flex items-center space-x-3">
									<svg
										class="h-8 w-8 text-indigo-600 dark:text-indigo-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
									<div>
										<p class="text-sm font-medium text-gray-900 dark:text-white">
											{selectedFile.name}
										</p>
										<p class="text-xs text-gray-500 dark:text-gray-400">
											{formatFileSize(selectedFile.size)}
										</p>
									</div>
								</div>
								<button
									type="button"
									onclick={() => {
										selectedFile = null;
										if (fileInput) fileInput.value = '';
									}}
									disabled={isLoading}
									class="text-gray-400 hover:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-500 dark:hover:text-gray-400"
									aria-label="Удалить выбранный файл"
								>
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>
						{/if}
					</div>

					<!-- Modal footer -->
					<div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
						<button
							type="button"
							onclick={onCancel}
							disabled={isLoading}
							class="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
						>
							Отмена
						</button>
						<button
							type="submit"
							disabled={!selectedFile || isLoading}
							class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
								Загрузка...
							{:else}
								Загрузить
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
