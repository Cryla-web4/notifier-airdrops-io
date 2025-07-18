const puppeteer = require('puppeteer');
const { Configuration, OpenAIApi } = require('openai');
const axios = require('axios');
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto('https://airdrops.io/');

  const data = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.airdrops > div')).map(card => ({
      title: card.querySelector('h3')?.innerText ?? 'No Title',
      description: card.querySelector('p')?.innerText ?? 'No Description',
      url: card.querySelector('a')?.href ?? '',
    }));
  });

  await browser.close();

  const filtered = [];
  for (const item of data) {
    try {
      const prompt = `以下は暗号資産のエアドロップ情報です。\n\nタイトル: ${item.title}\n説明: ${item.description}\n\n1. この案件のジャンル（ゲーム or 非ゲーム）を教えてください。\n2. この案件の詐欺度（1〜10）を数値で評価してください。`;

      const response = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.data.choices[0].message.content;

      const genre = text.includes('非ゲーム') ? '非ゲーム' : (text.includes('ゲーム') ? 'ゲーム' : '不明');
      const match = text.match(/詐欺度[：: ]?(\d+)/);
      const risk = match ? parseInt(match[1], 10) : 10;

      if (genre === '非ゲーム' && risk < 7) {
        filtered.push({ ...item, 評価: text });
      }

      if (filtered.length >= 3) break;

    } catch (e) {
      console.error('評価エラー:', e);
    }
  }

  for (const item of filtered) {
    await axios.post(SLACK_WEBHOOK_URL, {
      text: `🪙 *${item.title}*\n📃 ${item.description}\n🔗 ${item.url}\n🤖 評価:\n${item.評価}`
    });
  }
})();
