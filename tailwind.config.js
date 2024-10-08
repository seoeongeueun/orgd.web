/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			backgroundImage: {
				"gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
				"gradient-conic":
					"conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
			},
			fontSize: {
				main: "6px",
				sub: "5px",
				info: "12px",
				"nav-sm": "1.2rem",
				"nav-md": "1.4rem",
				"nav-lg": "1.6rem",
				"nav-xl": "2rem",
			},
			textColor: {
				main: "#000000",
				sub: "#ffffff",
			},
			spacing: {
				"main-width": 1920,
				"main-height": 1080,
				"nav-width": 200,
			},
			colors: {
				"theme-gray": "rgb(204,204,204)",
				"sub-light": "var(--sub-light)",
				"sub-dark": "var(--sub-dark)",
				info: "#333",
				"loading-white": "rgba(255,255,255,0.8)",
			},
			fontFamily: {
				global: ["pretendard", "sans-serif"],
			},
			animation: {
				"fade-in": "fadeIn 0.5s ease-in-out forwards",
				"fade-out": "fadeOut 0.5s ease-in-out forwards",
				move: "move 1s ease-in-out forwards",
			},
			screens: {
				lg: "2500px",
			},
		},
	},
	plugins: [],
};
