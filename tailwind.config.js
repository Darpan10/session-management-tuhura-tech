/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tuhura: {
          primary: '#6AA469',
          dark: '#4A8449',
          light: '#8BC68A',
          gray: '#6C757D',
        },
        primary: {
          50: '#f0f9f0',
          100: '#d9f0d8',
          200: '#b3e1b1',
          300: '#8dd28b',
          400: '#6AA469',
          500: '#6AA469',
          600: '#5A9459',
          700: '#4A8449',
          800: '#3a6439',
          900: '#2a4429',
        },
        tuhura: {
          blue: '#00A8E8',
          darkBlue: '#003554',
          lightBlue: '#5BC0DE',
          green: '#6AA469',
          gray: '#6C757D',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
