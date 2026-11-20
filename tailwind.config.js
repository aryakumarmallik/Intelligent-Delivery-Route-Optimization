/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hub: "#1e3a8a",       // Navy: Central Hub / Warehouse
        normal: "#334155",    // Slate: Normal roads, unvisited stops
        normalMuted: "#94a3b8",
        active: "#1d4ed8",    // Blue: Currently active / relaxing
        greedy: "#d97706",    // Amber: Nearest Neighbour baseline / moderate traffic
        optimized: "#0f766e", // Teal: 2-opt route / accepted improvement
        alert: "#dc2626",     // Red: Congested / blocked / backtrack / cut edges
        canvasBg: "#f8fafc",
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
