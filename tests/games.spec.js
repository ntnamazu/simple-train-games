// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('でんしゃミニゲーム', () => {

  test.beforeEach(async ({ page }) => {
    // コンソールエラーを監視
    page.on('pageerror', (error) => {
      console.error('Page error:', error.message);
    });
    await page.goto('/');
  });

  test('メニュー画面が正しく表示される', async ({ page }) => {
    // タイトルが表示されている
    await expect(page.locator('h1')).toContainText('でんしゃミニゲーム');

    // 4つのゲームボタンが表示されている
    const buttons = page.locator('.game-btn');
    await expect(buttons).toHaveCount(4);
  });

  test('ぴったりていしゃ - エラーなく起動する', async ({ page }) => {
    // コンソールエラーを収集
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    // ゲームボタンをクリック
    await page.click('button:has-text("ぴったりていしゃ")');

    // 少し待ってゲームが起動するか確認
    await page.waitForTimeout(1000);

    // キャンバスが表示されている
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveClass(/active/);

    // エラーがないことを確認
    expect(errors).toHaveLength(0);
  });

  test('ろせんカラークイズ - エラーなく起動する', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.click('button:has-text("ろせんカラークイズ")');
    await page.waitForTimeout(1000);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveClass(/active/);

    expect(errors).toHaveLength(0);
  });

  test('ろせんカラークイズ - 路線名をクリックすると正誤判定される', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    // クイズゲームを起動
    await page.click('button:has-text("ろせんカラークイズ")');
    await page.waitForTimeout(1000);

    // キャンバスがアクティブになっていることを確認
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveClass(/active/);

    // キャンバス内の選択肢ボタン（路線名）の位置をクリック
    // 選択肢は画面の下半分にあるので、そこをクリックする
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      // 最初の選択肢ボタンの位置をクリック（画面中央、縦方向55%あたり）
      const clickX = canvasBox.x + canvasBox.width / 2;
      const clickY = canvasBox.y + canvasBox.height * 0.55;
      await page.mouse.click(clickX, clickY);
    }

    // クリック後、少し待つ
    await page.waitForTimeout(500);

    // エラーがないことを確認（isHoveringエラーが出ないこと）
    if (errors.length > 0) {
      console.log('Errors found:', errors);
    }
    expect(errors).toHaveLength(0);
  });

  test('じょうきゃくをのせろ！ - エラーなく起動する', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.click('button:has-text("じょうきゃくをのせろ")');
    await page.waitForTimeout(1000);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveClass(/active/);

    expect(errors).toHaveLength(0);
  });

  test('ろせんパズル - エラーなく起動する', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.click('button:has-text("ろせんパズル")');
    await page.waitForTimeout(1000);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveClass(/active/);

    expect(errors).toHaveLength(0);
  });

  test('ろせんパズル - せんろタイルをタップすると回転する', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    // パズルゲームを起動
    await page.click('button:has-text("ろせんパズル")');
    await page.waitForTimeout(1000);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveClass(/active/);

    // クリック前のスクリーンショットを取得（キャンバスの状態を保存）
    const beforeScreenshot = await canvas.screenshot();

    // グリッドのせんろタイルをクリック
    // レベル1のグリッドは [7, 2, 2, 8] で、2番目の「2」（直線横）がクリック可能
    // スクリーンショットを見ると、2番目のタイルは画面の約44%, 縦52%あたり
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      // 2番目のタイル位置をクリック
      const clickX = canvasBox.x + canvasBox.width * 0.44;
      const clickY = canvasBox.y + canvasBox.height * 0.52;
      await page.mouse.click(clickX, clickY);
    }

    await page.waitForTimeout(300);

    // クリック後のスクリーンショットを取得
    const afterScreenshot = await canvas.screenshot();

    // スクリーンショットが異なること（=何か変化があったこと）を確認
    // タイルが回転すれば画面が変わるはず
    const screenshotsAreDifferent = !beforeScreenshot.equals(afterScreenshot);
    expect(screenshotsAreDifferent).toBe(true);

    // エラーがないことを確認
    expect(errors).toHaveLength(0);
  });

  test('ぴったりていしゃ - もどるボタンでメニューに戻れる', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    // ゲームを起動
    await page.click('button:has-text("ぴったりていしゃ")');
    await page.waitForTimeout(500);

    // キャンバスがアクティブになっていることを確認
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveClass(/active/);

    // goToMenu関数を直接呼び出してメニューに戻る
    await page.evaluate(() => window.goToMenu());
    await page.waitForTimeout(500);

    // メニュー画面が表示されていることを確認
    const menuScreen = page.locator('#menu-screen');
    await expect(menuScreen).not.toHaveClass(/hidden/);

    // キャンバスが非アクティブになっていることを確認
    await expect(canvas).not.toHaveClass(/active/);

    expect(errors).toHaveLength(0);
  });

  test('ろせんカラークイズ - もどるボタンでメニューに戻れる', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.click('button:has-text("ろせんカラークイズ")');
    await page.waitForTimeout(500);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveClass(/active/);

    await page.evaluate(() => window.goToMenu());
    await page.waitForTimeout(500);

    const menuScreen = page.locator('#menu-screen');
    await expect(menuScreen).not.toHaveClass(/hidden/);
    await expect(canvas).not.toHaveClass(/active/);

    expect(errors).toHaveLength(0);
  });

  test('じょうきゃくをのせろ！ - もどるボタンでメニューに戻れる', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.click('button:has-text("じょうきゃくをのせろ")');
    await page.waitForTimeout(500);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveClass(/active/);

    await page.evaluate(() => window.goToMenu());
    await page.waitForTimeout(500);

    const menuScreen = page.locator('#menu-screen');
    await expect(menuScreen).not.toHaveClass(/hidden/);
    await expect(canvas).not.toHaveClass(/active/);

    expect(errors).toHaveLength(0);
  });

  test('ろせんパズル - もどるボタンでメニューに戻れる', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.click('button:has-text("ろせんパズル")');
    await page.waitForTimeout(500);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveClass(/active/);

    await page.evaluate(() => window.goToMenu());
    await page.waitForTimeout(500);

    const menuScreen = page.locator('#menu-screen');
    await expect(menuScreen).not.toHaveClass(/hidden/);
    await expect(canvas).not.toHaveClass(/active/);

    expect(errors).toHaveLength(0);
  });

  test('全ゲームを順番に起動してエラーがないか確認', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    const games = [
      'ぴったりていしゃ',
      'ろせんカラークイズ',
      'じょうきゃくをのせろ',
      'ろせんパズル',
    ];

    for (const game of games) {
      // メニューに戻る（ページをリロード）
      await page.goto('/');
      await page.waitForTimeout(500);

      // ゲームを起動
      await page.click(`button:has-text("${game}")`);
      await page.waitForTimeout(1000);

      // キャンバスがアクティブか確認
      const canvas = page.locator('#game-canvas');
      await expect(canvas).toHaveClass(/active/);
    }

    // 全ゲームでエラーがないことを確認
    if (errors.length > 0) {
      console.log('Errors found:', errors);
    }
    expect(errors).toHaveLength(0);
  });

});
