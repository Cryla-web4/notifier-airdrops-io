const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']  // ← これを追加！
  });
  const page = await browser.newPage();
  await page.goto('https://airdrops.io/');

  const data = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.airdrops > div')).slice(0, 3);
    return items.map(card => ({
      title: card.querySelector('h3')?.innerText ?? 'No Title',
      description: card.querySelector('p')?.innerText ?? 'No Description',
      link: card.querySelector('a')?.href ?? '',
    }));
  });

  const output = data.map(entry =>
    `🪙 ${entry.title}\n📃 ${entry.description}\n🔗 ${entry.link}\n`
  ).join('\n');

  fs.writeFileSync('output.txt', output);
  console.log('✅ output.txt saved');
  await browser.close();
})();
