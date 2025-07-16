const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // ✅ セキュリティオプション
  });
  const page = await browser.newPage();
  await page.goto('https://airdrops.io/');

  const data = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.airdrops > div')).slice(); // すべて取得

    return items.map(card => {
      const title = card.querySelector('h3')?.innerText?.trim() || '';
      const description = card.querySelector('p')?.innerText?.trim() || '';
      const link = card.querySelector('a')?.href || '';

      // ✅ 安全性チェック：空や不正なデータを除外
      if (!title || !link.startsWith('https://airdrops.io')) return null;

      return { title, description, link };
    }).filter(item => item !== null); // nullデータを除外
  });

  console.log(data); // ✅ 安全なデータだけを出力
  await browser.close();
})();
