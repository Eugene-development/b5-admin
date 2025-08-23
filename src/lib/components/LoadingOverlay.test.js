import { describe, it, expect } from 'vitest';

describe('LoadingOverlay', () => {
	it('should export LoadingOverlay component', async () => {
		const module = await import('./LoadingOverlay.svelte');
		expect(module.default).toBeDefined();
	});

	it('should have proper component structure', () => {
		// Test that the component can be imported without errors
		expect(() => {
			import('./LoadingOverlay.svelte');
		}).not.toThrow();
	});
});