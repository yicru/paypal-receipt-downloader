import { chromium } from "playwright";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://google.com");
  await sleep(1000);
  await browser.close();
})();
