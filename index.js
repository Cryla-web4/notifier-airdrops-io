const puppeteer = require('puppeteer');
const axios = require('axios');
require('dotenv').config();

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

  await browser.close();

  // 🧠 Slack送信用テキストを整形
  const message = airdrops.map(drop => 
    `🪙 *${drop.title}*\n📃 ${drop.description}\n🔗 <${drop.link}>`
  ).join('\n\n');

  // ✅ Slack通知
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  if (!slackWebhook) {
    console.error('❌ SLACK_WEBHOOK_URL が未設定です。');
    process.exit(1);
  }

  try {
    await axios.post(slackWebhook, {
      text: `🚀 今日の注目エアドロップ速報（airdrops.io より）\n\n${message}`,
    });
    console.log('✅ Slackに送信しました。');
  } catch (error) {
    console.error('❌ Slackへの送信に失敗:', error.message);
  }
})();
