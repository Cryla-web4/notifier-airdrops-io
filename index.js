const puppeteer = require('puppeteer');

(async () => {
  try {
    // 🧭 ブラウザ起動（ヘッドレスモード）
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // 🌐 ページへアクセスし、完全に読み込まれるまで待機
    await page.goto('https://airdrops.io/', { waitUntil: 'networkidle2' });

    // 📦 データを3件だけ抽出
    const data = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.airdrops > div')).slice(0, 3);
      return items.map(card => ({
        title: card.querySelector('h3')?.innerText.trim() || 'No Title',
        description: card.querySelector('p')?.innerText.trim() || 'No Description',
        link: card.querySelector('a')?.href || '',
      }));
    });

    // 📤 結果をコンソールに表示
    console.log('✅ 最新エアドロップ情報（上位3件）:');
    console.log(JSON.stringify(data, null, 2));

    // 🛑 ブラウザを閉じる
    await browser.close();
  } catch (err) {
    // ❌ エラー処理
    console.error('❌ エラーが発生しました:', err.message);
  }
})();
