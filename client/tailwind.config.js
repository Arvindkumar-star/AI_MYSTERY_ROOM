/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        noir: {
          950: '#0a0a0c',
          900: '#121216',
          850: '#18181f',
          800: '#202028',
          700: '#2e2e38',
          600: '#42424f',
        },
        paper: {
          50: '#faf8f5',
          100: '#f3efe6',
          200: '#e5dec9',
          300: '#d4c7a5',
          800: '#2c251e',
          900: '#1e1914',
        },
        amber: {
          DEFAULT: '#d97706',
          glow: '#f59e0b',
          dim: '#92400e',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        mono: ['Courier New', 'Courier', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

