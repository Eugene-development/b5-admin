import { getProjectsWithPagination } from '$lib/api/projects.js';

/**
 * Reactive state for tracking new projects count
 * Used to display badge in sidebar
 */
class NewProjectsCountState {
	count = $state(0);
	isLoading = $state(false);

	/**
	 * Load new projects count from API
	 */
	async load() {
		this.isLoading = true;
		try {
			const projectsResult = await getProjectsWithPagination(1000, 1);
			const projects = projectsResult.data || [];
			
			// Count projects with status slug 'new-project'
			const count = projects.filter(
				(project) => project.status && project.status.slug === 'new-project'
			).length;
			
			this.count = count;
		} catch (error) {
			console.error('Failed to load new projects count:', error);
			this.count = 0;
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Refresh count (alias for load)
	 */
	async refresh() {
		await this.load();
	}
}

export const newProjectsCountState = new NewProjectsCountState();
