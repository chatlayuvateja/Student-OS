/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFFDF8',
        ivory: '#FEFCF3',
        indigo: {
          50: '#F0EDFF',
          100: '#D4CCFF',
          200: '#B099FF',
          300: '#8C66FF',
          400: '#6B3FFF',
          500: '#3B1FA8',
          600: '#2E1886',
          700: '#221164',
          800: '#150B42',
          900: '#090520',
        },
        gold: '#F5A623',
        coral: '#FF6B6B',
        mint: '#00C2A8',
        soft: {
          yellow: '#FFF8E1',
          pink: '#FFE0F0',
          lavender: '#EDE0FF',
          mint: '#E0FFF5',
          peach: '#FFEDE0',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['Space Grotesk', 'DM Mono', 'monospace'],
      },
      boxShadow: {
        'soft': '0 4px 24px rgba(59, 31, 168, 0.06)',
        'glass': '0 8px 32px rgba(59, 31, 168, 0.08)',
        'warm': '0 8px 32px rgba(245, 166, 35, 0.12)',
        'card': '0 2px 16px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '28px',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
