const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.goto('https://airdrops.io/', { waitUntil: 'domcontentloaded' });

    const data = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.airdrops > div')).slice(0, 3);
      return items.map(card => ({
        title: card.querySelector('h3')?.innerText ?? 'No Title',
        description: card.querySelector('p')?.innerText ?? 'No Description',
        link: card.querySelector('a')?.href ?? '',
      }));
    });

    console.log('🪙 最新エアドロップ一覧：');
    data.forEach(drop => {
      console.log(`📢 ${drop.title}\n📃 ${drop.description}\n🔗 ${drop.link}\n`);
    });

    // Slack通知（必要に応じて）
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (webhookUrl) {
      const payload = {
        text: `🪙 *最新のAirdrops.io情報（上位3件）*\n\n` + data.map(drop => 
          `• *${drop.title}*\n${drop.description}\n${drop.link}`
        ).join('\n\n')
      };

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Slack通知失敗: ${res.statusText}`);
    }

    await browser.close();
  } catch (err) {
    console.error('🚨 エラー:', err);
    process.exit(1);
  }
})();
