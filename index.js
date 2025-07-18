const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  console.log("開始");

  await page.goto('https://airdrops.io/', { waitUntil: 'domcontentloaded' });

  // 最新構造に合わせてセレクタ修正（2025年7月時点）
  await page.waitForSelector('.airdrops > div[class*="card"]', { timeout: 60000 });

  const data = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.airdrops > div[class*="card"]')).slice(0, 3);
    return items.map(card => ({
      title: card.querySelector('h3')?.innerText.trim() || 'No Title',
      description: card.querySelector('p')?.innerText.trim() || 'No Description',
      link: card.querySelector('a')?.href || ''
    }));
  });

  console.log(data);
  await browser.close();
})();
