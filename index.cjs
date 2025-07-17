const puppeteer = require('puppeteer');

(async () => {
  try {
    // ブラウザ起動（ヘッドレスモード）
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // ページにアクセスし、完全に読み込まれるまで待機
    await page.goto('https://airdrops.io/', { waitUntil: 'networkidle2' });

    // データを3件抽出
    const data = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.airdrops > div')).slice(0, 3);

      return items.map(card => ({
        title: card.querySelector('h3')?.innerText ?? 'No Title',
        description: card.querySelector('p')?.innerText ?? 'No Description',
        link: card.querySelector('a')?.href ?? '',
      }));
    });

    // 結果をコンソールに出力
    console.log('✅ 最新エアドロップ情報（上位3件）:');
    console.log(JSON.stringify(data, null, 2));

    // ブラウザを閉じる
    await browser.close();
  } catch (err) {
    // エラー処理
    console.error('❌ エラーが発生しました:', err.message);
  }
})();
