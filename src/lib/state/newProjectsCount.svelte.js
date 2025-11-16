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
	 */
	async load() {
		this.isLoading = true;
		try {
			const hasNew = await hasNewProjects();
			this.hasNew = hasNew;
		} catch (error) {
			console.error('Failed to check new projects:', error);
			this.hasNew = false;
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Refresh state (alias for load)
	 */
	async refresh() {
		await this.load();
	}
}

export const newProjectsState = new NewProjectsState();
