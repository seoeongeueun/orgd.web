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
				"loading-white": "rgba(255,255,255,0.6)",
			},
			boxShadow: {
				"loading-text": "0px 4px 10px 0px rgba(0, 0, 0, 0.10)",
			},
			fontFamily: {
				global: ["pretendard", "sans-serif"],
			},
		},
	},
	plugins: [],
};
