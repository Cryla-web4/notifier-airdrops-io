const puppeteer = require('puppeteer');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto('https://airdrops.io/', { waitUntil: 'networkidle2' });

  const airdrops = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.airdrops > div')).slice(0, 3);
    return items.map(card => ({
      title: card.querySelector('h3')?.innerText ?? 'No Title',
      description: card.querySelector('p')?.innerText ?? 'No Description',
      link: card.querySelector('a')?.href ?? '',
    }));
  });

  console.log(airdrops);

  await browser.close();
})();
