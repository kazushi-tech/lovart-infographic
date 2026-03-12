// Override parent project's PostCSS config (Tailwind v3).
// This reference app uses Tailwind v4 via @tailwindcss/vite plugin,
// so PostCSS should NOT load the parent's tailwindcss v3 plugin.
export default {
  plugins: {},
};
