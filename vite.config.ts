import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import "vitest/config"; // <-- just dummy import

import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'

import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vitejs.dev/config/
const config = defineConfig({
	plugins: [
		tanstackRouter({ autoCodeSplitting: true }),
		viteReact(),
		tailwindcss(),
	],
	test: {
		globals: true,
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
		coverage: {
			reporter: ['text', 'json', 'html'],
		},
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	}
})

export default config
