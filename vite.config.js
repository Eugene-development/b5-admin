import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	// Load environment variables based on mode
	const env = loadEnv(mode, process.cwd(), '');

	return {
		plugins: [tailwindcss(), sveltekit()],
		define: {
			// Make environment variables available in the app
			__APP_ENV__: JSON.stringify({
				API_BASE_URL: env.VITE_API_BASE_URL,
				AUTH_API_URL: env.VITE_AUTH_API_URL,
				FRONTEND_URL: env.VITE_FRONTEND_URL
			})
		}
	};
});
