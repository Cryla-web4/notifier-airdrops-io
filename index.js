const puppeteer = require('puppeteer');
const { Configuration, OpenAIApi } = require('openai');

// ローカル環境用：.envからAPIキーを読み込む（GitHub Actionsでは自動で process.env 経由）
require('dotenv').config();

// OpenAIクライアント初期化
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

// OpenAIでプロジェクトを分析する関数（最大3回リトライ）
const analyzeWithOpenAI = async (item, retries = 3) => {
  const prompt = `
以下は仮想通貨のエアドロッププロジェクトです。

タイトル: ${item.title}
リンク: ${item.link}
画像URL: ${item.image}

以下の2つをJSON形式で出力してください：
1. 詐欺度（1〜10の整数）
2. ジャンル（Game, NFT, Finance, DeFi, AI, Meme など1語で）

例：
{
  "scam_score": 3,
  "genre": "DeFi"
}
`;

  try {
    const res = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const parsed = JSON.parse(res.data.choices[0].message.content);
    return { ...item, scam_score: parsed.scam_score, genre: parsed.genre };

  } catch (err) {
    console.warn(`⚠️ エラー発生: ${err.message}`);
    if (retries > 0) {
      console.log(`🔁 再試行 (${3 - retries + 1}回目)...`);
      return await analyzeWithOpenAI(item, retries - 1);
    } else {
      console.error("❌ 再試行失敗：スキップします");
      return { ...item, scam_score: 10, genre: "Unknown" }; // 除外対象として返す
    }
  }
};

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.goto('https://airdrops.io/', { waitUntil: 'networkidle2' });

  const rawData = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.airdrops > div')).slice(0, 10);
    return cards.map(card => ({
      title: card.querySelector('h3')?.innerText ?? 'No Title',
      link: card.querySelector('a')?.href ?? '',
      image: card.querySelector('img')?.src ?? '',
      source: 'airdrops.io',
    }));
  });

  // 並列でOpenAIに分析リクエスト（高速化）
  const enriched = await Promise.all(
    rawData.map(item => analyzeWithOpenAI(item))
  );

  // フィルタリング：詐欺度6以下、かつジャンルが "Game" 以外
  const filtered = enriched.filter(d => d.scam_score <= 6 && d.genre.toLowerCase() !== "game");

  // コンソールに出力
  console.log('🟢 フィルター通過結果：');
  console.log(filtered);

  await browser.close();
})();
