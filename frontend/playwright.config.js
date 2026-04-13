import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:8003",
    trace: "on-first-retry",
  },
  webServer: {
    command: 'cmd /c "cd .. && python -m uvicorn backend.main:app --host 127.0.0.1 --port 8003"',
    url: "http://127.0.0.1:8003",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
