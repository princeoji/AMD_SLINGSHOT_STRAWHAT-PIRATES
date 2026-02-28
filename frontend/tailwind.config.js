/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                risk: {
                    low: '#22c55e',
                    medium: '#eab308',
                    high: '#f97316',
                    severe: '#ef4444',
                },
                dark: {
                    900: '#0a0e1a',
                    800: '#111827',
                    700: '#1e2740',
                    600: '#2a3555',
                }
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(239, 68, 68, 0.3)' },
                    '100%': { boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)' },
                }
            }
        },
    },
    plugins: [],
}
