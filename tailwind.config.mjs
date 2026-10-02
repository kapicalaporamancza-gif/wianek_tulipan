/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        andika: ['Andika', 'ui-rounded', 'sans-serif'],
      },
      colors: {
        'wianek-cream': '#fbf3de',
        'wianek-cream-dark': '#f1dfba',
        'wianek-rust': '#a85139',
        'wianek-green': '#474c2c',
        'wianek-green-dark': '#343921',
        'wianek-gold': '#e9b44c',
      },
    },
  },
  plugins: [],
};
