/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable class-based dark mode
    theme: {
        extend: {
            colors: {
                background: "var(--bg-primary)",
                secondary: "var(--bg-secondary)", // Added alias
                sidebar: "var(--bg-secondary)",
                element: "var(--bg-element)",
                main: "var(--text-main)",
                muted: "var(--text-muted)",
                border: "var(--border-color)",
                accent: {
                    blue: "var(--accent-blue)",
                    red: "var(--accent-red)",
                    green: "var(--accent-green)",
                    yellow: "var(--accent-yellow)",
                    purple: "var(--accent-purple)",
                    aqua: "var(--accent-aqua)",
                    orange: "var(--accent-orange)",
                    DEFAULT: "var(--accent)", // Allow bg-accent coverage
                },
            },
        },
        fontFamily: {
            sans: ['Inter', 'sans-serif'],
            mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        },
        borderRadius: {
            DEFAULT: '0',
            none: '0',
            sm: '0',
            md: '0',
            lg: '0',
            xl: '0',
            '2xl': '0',
            '3xl': '0',
            full: '0',
        },
        boxShadow: {
            'retro': '6px 6px 0px 0px var(--border-color)',
            'retro-sm': '3px 3px 0px 0px var(--border-color)',
            'retro-lg': '8px 8px 0px 0px var(--border-color)',
        }
    },
    plugins: [
        require("tailwindcss-animate"),
        require("@tailwindcss/typography"), // Ensure typography is here if used
    ],
}
