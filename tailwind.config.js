/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: '#0f0f14',
        card: '#1a1a24',
        accent: '#7c3aed',
        'accent-light': '#a78bfa',
        'accent-glow': 'rgba(124,58,237,0.15)',
        'text-main': '#e4e4ed',
        'text-muted': '#8888a4',
        'border-main': '#2a2a3d',
        sidebar: '#13131b',
        'sidebar-active': 'rgba(124,58,237,0.09)',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
