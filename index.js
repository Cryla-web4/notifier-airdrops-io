const puppeteer = require('puppeteer');
const fs = require('fs');
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('https://airdrops.io/', { waitUntil: 'domcontentloaded' });

  const airdrops = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.airdrops > div')).map(card => ({
      title: card.querySelector('h3')?.innerText ?? 'No Title',
      description: card.querySelector('p')?.innerText ?? 'No Description',
      link: card.querySelector('a')?.href ?? '',
    }));
  });

  await browser.close();

  // OpenAI APIで詐欺度とジャンル判定を実行
  const scored = [];
  for (const airdrop of airdrops) {
    const prompt = `
あなたは詐欺判定AIです。以下のエアドロップ案件について評価してください。

---
タイトル: ${airdrop.title}
説明文: ${airdrop.description}
---

① この案件のジャンルは何ですか？（例：DeFi, NFT, ゲーム, DAO, ツールなど）
② 詐欺の可能性を0～10点で評価してください（0:安全、10:高リスク）。
日本語で箇条書きで出力してください。`;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const reply = response.data.choices[0].message.content;
      const genreMatch = reply.match(/ジャンル.*?:\s*(.+)/);
      const riskMatch = reply.match(/詐欺.*?(\d{1,2})点/);

      const genre = genreMatch ? genreMatch[1] : '不明';
      const scamScore = riskMatch ? parseInt(riskMatch[1]) : 10;

      // フィルタ条件
      if (!genre.includes('ゲーム') && scamScore < 7) {
        scored.push({ ...airdrop, genre, scamScore });
      }

    } catch (err) {
      console.error(`❌ OpenAI API error for "${airdrop.title}":`, err.message);
    }
  }

  // 上位3件のみ通知
  const top3 = scored.slice(0, 3);

  // Slack通知用テキスト作成
  const output = top3.map((item, i) => 
`🪙 ${item.title}
📃 ${item.description}
🔗 ${item.link}
📂 ジャンル: ${item.genre}
🚨 詐欺度: ${item.scamScore}/10

${i < top3.length - 1 ? '------' : ''}`).join('\n');

  fs.writeFileSync('output.txt', output, 'utf8');
  console.log('✅ output.txt に保存しました');
})();
