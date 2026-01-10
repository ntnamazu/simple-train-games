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
