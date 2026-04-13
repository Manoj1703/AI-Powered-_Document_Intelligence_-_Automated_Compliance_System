import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
    watch: {
      ignored: [
        "**/backend/**",
        "**/.venv/**",
        "**/.venv*/**",
        "**/.tmp/**",
        "**/previous-version/**",
        "**/node_modules/**",
      ],
    },
  },
});
