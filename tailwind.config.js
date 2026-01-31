

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: [
		'./index.html',
		'./src/**/*.{js,ts,jsx,tsx}',

		// 🌟 MANDATORY: Tell Tailwind to look inside your installed package's files
		// This ensures classes used by Button, Card, etc., are included in the build.
		'./node_modules/@abumble/design-system/dist/**/*.{js,jsx,ts,tsx}',
	],
}

