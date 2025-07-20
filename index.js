require('dotenv').config();

const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://airdrops.io/', { waitUntil: 'networkidle2' });

  await page.waitForSelector('.topbar-promo');

  const airdrops = await page.$$eval('.topbar-promo', promos =>
    promos.map(promo => {
      const title = promo.querySelector('.topbar-promo-text span')?.innerText.trim() ?? 'No Title';
      const link = promo.getAttribute('onclick')?.match(/"(https:\/\/[^"]+)"/)?.[1] ?? '';
      const image = promo.querySelector('img')?.src ?? '';
      return {
        title,
        link,
        image,
        source: 'airdrops.io' // ✅ 追加：将来の複数ソース対応に備える
      };
    })
  );

  // フィルターを一時的に無効化して全件表示（確認用）
  console.log('🟩 全取得データ:', airdrops);

  await browser.close();
})();
