const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://airdrops.io/', { waitUntil: 'networkidle2' });

  // 描画が終わるまでしっかり待つ
  await page.waitForSelector('.list.list-airdrops .list-item');

  // スクレイピング処理
  const data = await page.evaluate(() => {
    const cards = document.querySelectorAll('.list.list-airdrops .list-item');

    return Array.from(cards).map(card => {
      const title = card.querySelector('h5')?.innerText.trim() ?? 'No Title';
      const description = card.querySelector('p')?.innerText.trim() ?? 'No Description';
      const link = card.querySelector('a')?.href ?? 'No Link';
      return { title, description, link };
    });
  });

  console.log(data);
  await browser.close();
})();
