// index.js（ChatGPT評価 + フィルタ付き）

const puppeteer = require('puppeteer');
const fs = require('fs');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

async function evaluateProject(title, description) {
  const prompt = `以下のエアドロップ案件を評価してください。\n\n【タイトル】${title}\n【説明】${description}\n\n---\n1. この案件のジャンルは？\n2. 詐欺度を10点満点で評価してください（0が安全、10が極めて危険）。\n---\n出力形式：\nジャンル: ◯◯\n詐欺度: ◯/10`;

  const res = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  });

  return res.data.choices[0].message.content.trim();
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://airdrops.io/');

  const data = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.airdrops > div'));
    return items.map(card => ({
      title: card.querySelector('h3')?.innerText ?? 'No Title',
      description: card.querySelector('p')?.innerText ?? 'No Description',
      link: card.querySelector('a')?.href ?? ''
    }));
  });

  let output = '';

  for (const item of data) {
    const evaluation = await evaluateProject(item.title, item.description);

    const genreMatch = evaluation.match(/ジャンル:\s*(.+)/);
    const riskMatch = evaluation.match(/詐欺度:\s*(\d+)\/10/);

    const genre = genreMatch ? genreMatch[1].trim() : '';
    const risk = riskMatch ? parseInt(riskMatch[1]) : 10;

    if (genre.includes('ゲーム') || risk >= 7) {
      console.log(`❌ 除外: ${item.title}（ジャンル: ${genre}, 詐欺度: ${risk}）`);
      continue;
    }

    output += `タイトル: ${item.title}\n説明: ${item.description}\nリンク: ${item.link}\n${evaluation}\n\n---\n\n`;
  }

  fs.writeFileSync('output.txt', output, 'utf-8');
  console.log('✅ output.txt に保存されました');

  await browser.close();
})();
