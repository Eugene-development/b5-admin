import { hasNewProjects } from '$lib/api/projects.js';

/**
 * Reactive state for tracking if there are new projects
 * Used to display badge in sidebar
 */
class NewProjectsState {
	hasNew = $state(false);
	isLoading = $state(false);

	/**
	 * Check if there are new projects from API
	 * Queries backend for projects with status_id "01K7HRKTSQV1894Y3JD9WV5KZX" (Новый проект)
	 * @param {Object} options - Additional options
	 * @param {boolean} options.silent - If true, don't show toast notifications on errors (for background checks)
	 */
	async load(options = {}) {
		const { silent = false } = options;
		this.isLoading = true;
		try {
			const hasNew = await hasNewProjects(null, null, { silent });
			this.hasNew = hasNew;
		} catch (error) {
			// Only log errors if not in silent mode
			if (!silent) {
				console.error('Failed to check new projects:', error);
			}
			this.hasNew = false;
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Refresh state (alias for load) - always uses silent mode for background updates
	 */
	async refresh() {
		await this.load({ silent: true });
	}
}

export const newProjectsState = new NewProjectsState();
