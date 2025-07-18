const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://airdrops.io/', { waitUntil: 'networkidle2' });

  // しっかり描画を待つ
  await page.waitForSelector('.container .list');

  // スクレイピング
  const data = await page.evaluate(() => {
    const cards = document.querySelectorAll('.container .list .list-item');

    return Array.from(cards).map(card => {
      const title = card.querySelector('h5')?.innerText ?? 'No Title';
      const description = card.querySelector('p')?.innerText ?? 'No Description';
      const link = card.querySelector('a')?.href ?? 'No Link';
      return { title, description, link };
    });
  });

  console.log(data);
  await browser.close();
})();
