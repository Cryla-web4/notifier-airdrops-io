const puppeteer = require('puppeteer');
const fs = require('fs');
const { Configuration, OpenAIApi } = require('openai');

// OpenAI APIキー（環境変数から取得）
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('https://airdrops.io/', { waitUntil: 'domcontentloaded' });

  // すべての案件を取得（最新順）
  const airdrops = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.airdrops > div'));
    return items.map(card => {
      const title = card.querySelector('h3')?.innerText ?? 'No Title';
      const description = card.querySelector('p')?.innerText ?? 'No Description';
      const link = card.querySelector('a')?.href ?? '';
      return { title, description, link };
    });
  });

  await browser.close();

  // OpenAIでフィルタリング（非ゲーム系・詐欺度7未満）
  const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
  const openai = new OpenAIApi(configuration);

  const filtered = [];

  for (const item of airdrops) {
    const prompt = `
次のプロジェクトのジャンルと詐欺度を10点満点で評価してください。

プロジェクト名: ${item.title}
説明: ${item.description}

出力形式: 
{
  "ジャンル": "DeFi / Game / NFT / その他",
  "詐欺度": 数字 (1～10の整数)
}
    `.trim();

    try {
      const response = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }]
      });

      const result = JSON.parse(response.data.choices[0].message.content);

      if (result.ジャンル !== 'Game' && result.詐欺度 < 7) {
        filtered.push({ ...item, genre: result.ジャンル, risk: result.詐欺度 });
      }
    } catch (err) {
      console.error('OpenAI error:', err);
    }
  }

  // 上位3件のみ
  const top3 = filtered.slice(0, 3);

  // 保存用テキスト生成
  const output = top3.map((item, i) => `
${i + 1}. 🪙 ${item.title}
📃 ${item.description}
🎮 ジャンル: ${item.genre}
🚨 詐欺度: ${item.risk}/10
🔗 URL: ${item.link}
  `.trim()).join('\n\n');

  fs.writeFileSync('output.txt', output, 'utf8');
  console.log('✅ フィルタ済みのエアドロップ情報を output.txt に保存しました。');
})();
