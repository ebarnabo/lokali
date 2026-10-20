/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: '#1A7A4C',
          light: '#E8F5EE',
        },
        red: {
          DEFAULT: '#C8102E',
          light: '#FDECEA',
        },
        yellow: {
          DEFAULT: '#F5C518',
        },
        cream: '#F8F6F1',
        ink: '#1C1917',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}