const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // セキュリティ対策で必須
  });

  const page = await browser.newPage();
  await page.goto('https://airdrops.io/', { waitUntil: 'domcontentloaded' });

  const data = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.airdrops > div'));
    
    return items.map(card => {
      const title = card.querySelector('h3')?.innerText?.trim() || '';
      const description = card.querySelector('p')?.innerText?.trim() || '';
      const link = card.querySelector('a')?.href?.trim() || '';

      return (title && link)
        ? { title, description, link }
        : null; // 無効なデータは除外
    }).filter(Boolean); // null や undefined を除外
  });

  console.log(JSON.stringify(data, null, 2)); // 整形して表示（Make連携しやすい）
  
  await browser.close();
})();
