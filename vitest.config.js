import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'happy-dom',
		setupFiles: ['./src/test-setup.js'],
		globals: true,
		alias: {
			$lib: new URL('./src/lib', import.meta.url).pathname
		}
	}
});
