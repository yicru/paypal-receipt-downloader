import { env } from "./utils/env";
import { sleep } from "./utils/sleep";
import path from "node:path";
import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launchPersistentContext("tmp/profile", {
    headless: false,
  });

  /**
   * ログイン
   */
  const page = await browser.newPage();
  await page.goto("https://www.paypal.com/signin?country.x=JP&locale.x=ja_JP");
  if (page.url().includes("signin")) {
    await page
      .getByPlaceholder("アドレスまたは携帯電話番号")
      .fill(env.PAYPAL_AUTH_EMAIL);
    await page.getByRole("button", { name: "次へ" }).click();
    await page.getByPlaceholder("パスワード").fill(env.PAYPAL_AUTH_PASSWORD);
    await page.getByRole("button", { name: "ログイン", exact: true }).click();
  }

  /**
   * 取引履歴
   */
  await page.goto(
    `https://www.paypal.com/myaccount/activities?start_date=${env.FILTER_START_DATE}&end_date=${env.FILTER_END_DATE}`
  );

  await sleep(2000);

  /**
   * ページ最下部までスクロール
   */
  let prevHeight = null;

  while (true) {
    await page.keyboard.down("End");
    await sleep(1000);

    const currentHeight = await page.evaluate(
      () => document.documentElement.scrollHeight
    );

    if (prevHeight === currentHeight) {
      break;
    }

    prevHeight = currentHeight;
  }

  /**
   * 全取引履歴をクリック
   */
  for await (const rowHeader of await page.getByTestId("rowHeader").all()) {
    await rowHeader.click();
    await sleep(1000);
  }

  const transactionIds = await page
    .locator('div[id="td_transactionId"] >> [data-cy="transactionIDValue"]')
    .all();

  console.log(`Found ${transactionIds.length} transactions.`);

  for await (const [index, locator] of Object.entries(transactionIds)) {
    console.log(`Processing ${Number(index) + 1} of ${transactionIds.length}...`);

    const transactionId = await locator.innerText();
    const page = await browser.newPage();
    await page.goto(
      `https://www.paypal.com/myaccount/activities/print-details/${transactionId}`,
      { waitUntil: "domcontentloaded" }
    );

    const date = await page.getByTestId("dateText").innerText();
    await page.emulateMedia({ media: "screen" });
    await page.pdf({
      path: path.join("pdfs", `paypal_${date}_${transactionId}.pdf`),
    });
    await page.close();
  }

  await browser.close();
})();
