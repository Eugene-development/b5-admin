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
	let modalElement = $state();

	$effect(() => {
		if (isOpen) {
			selectedFile = null;
			if (fileInput) fileInput.value = '';
		}
	});

	$effect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
			document.addEventListener('keydown', handleKeydown);
		} else {
			document.body.style.overflow = '';
			document.removeEventListener('keydown', handleKeydown);
		}
		return () => {
			document.body.style.overflow = '';
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	function handleFileSelect(event) {
		const file = event.target.files?.[0];
		if (file) selectedFile = file;
	}

	function handleDragEnter(e) { e.preventDefault(); e.stopPropagation(); dragActive = true; }
	function handleDragLeave(e) { e.preventDefault(); e.stopPropagation(); dragActive = false; }
	function handleDragOver(e) { e.preventDefault(); e.stopPropagation(); }

	function handleDrop(e) {
		e.preventDefault();
		e.stopPropagation();
		dragActive = false;
		const file = e.dataTransfer?.files?.[0];
		if (file) selectedFile = file;
	}

	function handleSubmit(event) {
		event.preventDefault();
		if (selectedFile && onUpload) onUpload(selectedFile);
	}

	function handleBackdropClick(event) {
		if (event.target === event.currentTarget && !isLoading) onCancel();
	}

	function handleKeydown(event) {
		if (event.key === 'Escape' && !isLoading) onCancel();
	}

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

	function formatFileSize(bytes) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	}

	// Determine gradient color based on title
	let gradientClass = $derived(
		title.includes('КП') 
			? 'from-blue-500 via-cyan-500 to-teal-500' 
			: 'from-violet-600 via-purple-500 to-fuchsia-500'
	);
	
	let accentColor = $derived(title.includes('КП') ? 'blue' : 'violet');
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
		<div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onclick={handleBackdropClick} aria-hidden="true"></div>

		<div class="flex min-h-full items-center justify-center p-4">
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				bind:this={modalElement}
				class="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-gray-900"
				onkeydown={handleTabKey}
				tabindex="-1"
				role="document"
			>
				<!-- Header with gradient -->
				<div class="relative overflow-hidden bg-gradient-to-r {gradientClass} px-6 py-5">
					<div class="absolute inset-0 bg-grid-white/10"></div>
					<div class="relative flex items-start justify-between">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
								<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
								</svg>
							</div>
							<div>
								<h2 class="text-xl font-bold text-white">{title}</h2>
								<p class="mt-0.5 text-sm text-white/80">Выберите файл для загрузки</p>
							</div>
						</div>
						<button type="button" onclick={onCancel} disabled={isLoading} aria-label="Закрыть" class="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white disabled:opacity-50">
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
						</button>
					</div>
				</div>

				<!-- Form Content -->
				<form onsubmit={handleSubmit} class="p-6">
					<div class="space-y-5">
						<!-- File upload area -->
						<div>
							<label for="file-upload" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
									class="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-all {dragActive
										? `border-${accentColor}-500 bg-${accentColor}-50 dark:bg-${accentColor}-900/20`
										: `border-gray-300 hover:border-${accentColor}-400 dark:border-gray-600 dark:hover:border-${accentColor}-500`}"
								>
									<div class="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
										<svg class="h-7 w-7 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
										</svg>
									</div>
									<p class="mt-4 text-sm text-gray-700 dark:text-gray-300">
										<span class="font-semibold text-{accentColor}-600 dark:text-{accentColor}-400">Нажмите для выбора</span>
										или перетащите файл
									</p>
									<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
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
							<div class="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-{accentColor}-100 dark:bg-{accentColor}-900/30">
										<svg class="h-5 w-5 text-{accentColor}-600 dark:text-{accentColor}-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
										</svg>
									</div>
									<div>
										<p class="text-sm font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
										<p class="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(selectedFile.size)}</p>
									</div>
								</div>
								<button
									type="button"
									onclick={() => { selectedFile = null; if (fileInput) fileInput.value = ''; }}
									disabled={isLoading}
									class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-300"
									aria-label="Удалить выбранный файл"
								>
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						{/if}
					</div>
				</form>

				<!-- Footer -->
				<div class="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
					<div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
						<button
							type="button"
							onclick={onCancel}
							disabled={isLoading}
							class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
						>
							Отмена
						</button>
						<button
							type="submit"
							onclick={handleSubmit}
							disabled={!selectedFile || isLoading}
							class="inline-flex items-center justify-center gap-2 rounded-lg bg-{accentColor}-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-{accentColor}-500 focus:outline-none focus:ring-2 focus:ring-{accentColor}-600 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-gray-900"
						>
							{#if isLoading}
								<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							{/if}
							{isLoading ? 'Загрузка...' : 'Загрузить файл'}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
