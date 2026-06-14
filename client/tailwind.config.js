/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Söhne', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['Söhne Mono', 'Monaco', 'Andale Mono', 'Ubuntu Mono', 'monospace'],
            },
            colors: {
                gray: {
                    850: '#1a1a2e',
                    950: '#0d0d0d',
                },
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-in': 'slideIn 0.3s ease-out',
                'pulse-dot': 'pulseDot 1.4s infinite ease-in-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(4px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideIn: {
                    '0%': { opacity: '0', transform: 'translateX(-10px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                pulseDot: {
                    '0%, 80%, 100%': { transform: 'scale(0)', opacity: '0.5' },
                    '40%': { transform: 'scale(1)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
};