// @ts-check
const { defineConfig } = require('@playwright/test');

const isCI = process.env.CI === 'true';

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: isCI ? 2 : 0,
  use: {
    // Docker内ではgameサービスに接続、ローカルではlocalhost
    baseURL: isCI ? 'http://game:80' : 'http://localhost:8080',
    headless: true,
    viewport: { width: 1024, height: 768 },
    screenshot: 'only-on-failure',
  },
  // ローカル実行時のみwebServerを起動
  ...(isCI ? {} : {
    webServer: {
      command: 'python3 -m http.server 8080',
      port: 8080,
      timeout: 10000,
      reuseExistingServer: true,
    },
  }),
});
