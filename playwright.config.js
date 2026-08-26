// @ts-check
import { defineConfig, devices } from '@playwright/test';



/**
 * @see https://playwright.dev/docs/test-configuration
 */
const config =({

  testDir: './tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  reporter: 'html',
  //  retries: 1,
  use: {
  browserName: "chromium",
  headless: false,
  baseURL:'https://eventhub.rahulshettyacademy.com/',
 
  screenshot:"on",
  trace:"retain-on-failure",
  // video:"on",

  }
});
module.exports = config
