/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,ts}',
    './src/index.html'
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors for session roles
        'user-bg': '#f0f9ff',
        'assistant-bg': '#fefce8',
        'tool-bg': '#f0fdf4',
        'error-bg': '#fef2f2'
      },
      fontFamily: {
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', 'Droid Sans Mono', 'Source Code Pro', 'monospace']
      }
    }
  },
  plugins: []
};
