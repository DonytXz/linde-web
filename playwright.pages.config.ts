import { defineConfig, devices } from "@playwright/test";
const remote = process.env.PAGES_TEST_URL;
export default defineConfig({
  testDir: "./tests/pages",
  timeout: 45_000,
  use: {
    baseURL: remote || "http://127.0.0.1:5181/linde-web/",
    ...devices["Desktop Chrome"],
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: remote
    ? undefined
    : {
        command: "npm run preview -- --port 5181 --strictPort --base /linde-web/",
        url: "http://127.0.0.1:5181/linde-web/",
        reuseExistingServer: false,
      },
});
