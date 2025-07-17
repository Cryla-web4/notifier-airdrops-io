const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://airdrops.io/', { waitUntil: 'domcontentloaded' });

  const data = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.airdrops > div')).slice(0, 3);
    return items.map(card => ({
      title: card.querySelector('h3')?.innerText ?? 'No Title',
      description: card.querySelector('p')?.innerText ?? 'No Description',
      link: card.querySelector('a')?.href ?? '',
    }));
  });

  // 保存処理（ファイル：output.txt）
  fs.writeFileSync('output.txt', JSON.stringify(data, null, 2), 'utf-8');

  console.log('✅ Airdrop情報を output.txt に保存しました');
  console.log(data); // ログにも出力
  await browser.close();
})();
