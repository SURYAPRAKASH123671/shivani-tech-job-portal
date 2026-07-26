/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1B2A4A',
          light: '#2E4374',
          dark: '#101A30',
        },
        amber: {
          DEFAULT: '#E8A33D',
          light: '#F3C57D',
          dark: '#C17F1F',
        },
        surface: '#FFFFFF',
        canvas: '#EEF1F4',
        ink: '#1B2230',
        muted: '#6B7280',
        line: '#E2E5EA',
        success: '#1D9E75',
        danger: '#D64545',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
