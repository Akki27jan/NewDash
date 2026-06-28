/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        mono: ['GeistMono_400Regular'],
      },
      colors: {
        'theme-bg': 'var(--theme-bg, #000000)',
        'theme-primary': 'var(--theme-primary, #3b82f6)',
        'theme-secondary': 'var(--theme-secondary, #60a5fa)',
        'theme-muted': 'var(--theme-muted, #1e40af)',
        'theme-border': 'var(--theme-border, #1e3a8a)',
        'theme-border-bg': 'var(--theme-border-bg, rgba(30, 58, 138, 0.2))',
        'theme-accent': 'var(--theme-accent, #ef4444)',
        'theme-accent-bg': 'var(--theme-accent-bg, #450a0a)',
        'theme-success': 'var(--theme-success, #22c55e)',
        'theme-success-bg': 'var(--theme-success-bg, #052e16)',
        'theme-warning': 'var(--theme-warning, #eab308)',
      }
    },
  },
  plugins: [],
}
