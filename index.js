const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto('https://airdrops.io/', { waitUntil: 'networkidle0' });

  const data = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.airdrops > div')).slice();
    return items.map(card => ({
      title: card.querySelector('h3')?.innerText ?? 'No Title',
      description: card.querySelector('p')?.innerText ?? 'No Description',
      link: card.querySelector('a')?.href ?? '',
    }));
  });

  console.log(data);
  await browser.close();
})();
