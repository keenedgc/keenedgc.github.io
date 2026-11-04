import defaultTheme from 'tailwindcss/defaultTheme';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        keene: {
          red: '#FF4B33',
          crimson: '#A52A2A',
          olive: '#575F47',
          blue: '#4682B4',
          chartreuse: '#CCFF00',
          forest: '#2D4A22',
          bark: '#5C4033',
          sand: '#E8E0D4',
          cream: '#F5F0E8'
        }
      },
      fontFamily: {
        display: ['"Barlow Condensed"', ...defaultTheme.fontFamily.sans],
        body: ['"Source Sans 3"', ...defaultTheme.fontFamily.sans]
      },
      boxShadow: {
        soft: '0 12px 30px -18px rgba(60, 40, 20, 0.45)',
        panel: '0 18px 44px -26px rgba(60, 40, 20, 0.45)'
      }
    }
  },
  plugins: [typography]
};
