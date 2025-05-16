/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          DEFAULT: '#2563eb',
        },
      },
      fontSize: {
        'prompt-title': 'var(--prompt-title-size, 1rem)',
        'prompt-desc': 'var(--prompt-desc-size, 0.875rem)',
        'prompt-tag': 'var(--prompt-tag-size, 0.75rem)',
        'category-name': 'var(--category-name-size, 1rem)',
        'category-count': 'var(--category-count-size, 0.75rem)',
      },
      animation: {
        'modal-in': 'modalIn 0.3s ease-out',
        'fadeIn': 'fadeIn 0.3s ease-in',
        'fadeOut': 'fadeOut 0.3s ease-out',
      },
      keyframes: {
        modalIn: {
          '0%': { opacity: 0, transform: 'translateY(-10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        fadeOut: {
          '0%': { opacity: 1 },
          '100%': { opacity: 0 },
        },
      },
    },
  },
  plugins: [],
}