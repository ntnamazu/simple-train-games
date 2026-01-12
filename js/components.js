// 🚃 でんしゃミニゲーム - 共通UIコンポーネント

import { COLORS, FONT_SIZES, BUTTON_SIZES } from './constants.js';
import { getGame } from './utils.js';

/**
 * 戻るボタンを作成
 * @param {number} x - ボタンのX座標
 * @param {number} y - ボタンのY座標
 * @returns {object} - ボタンオブジェクト
 */
export function createBackButton(x, y) {
    const game = getGame();
    const btn = game.add([
        game.rect(BUTTON_SIZES.BACK.width, BUTTON_SIZES.BACK.height, {
            radius: BUTTON_SIZES.BACK.radius
        }),
        game.pos(x, y),
        game.color(...COLORS.BUTTON_GRAY),
        game.area(),
    ]);
    game.add([
        game.text("もどる", { size: FONT_SIZES.TINY }),
        game.pos(x + BUTTON_SIZES.BACK.width / 2, y + BUTTON_SIZES.BACK.height / 2),
        game.anchor("center"),
        game.color(...COLORS.WHITE),
    ]);
    btn.onClick(() => window.goToMenu());
    return btn;
}

/**
 * 結果画面のオーバーレイを作成
 * @param {number} width - オーバーレイの幅（デフォルト320）
 * @param {number} height - オーバーレイの高さ（デフォルト250）
 * @returns {object} - オーバーレイオブジェクト
 */
export function createResultOverlay(width = 320, height = 250) {
    const game = getGame();
    return game.add([
        game.rect(width, height, { radius: 20 }),
        game.pos(game.width() / 2, game.height() / 2),
        game.anchor("center"),
        game.color(...COLORS.BLACK),
        game.opacity(0.85),
    ]);
}

/**
 * 電車を描画
 * @param {number} x - 電車のX座標
 * @param {number} y - 電車のY座標
 * @param {number[]} color - 電車の色 [R, G, B]
 * @param {object} options - オプション設定
 * @returns {object} - 電車オブジェクト（本体と窓の配列）
 */
export function createTrain(x, y, color, options = {}) {
    const game = getGame();
    const {
        width = 180,
        height = 70,
        windowCount = 3,
        windowWidth = 30,
        windowHeight = 25,
        windowGap = 50,
        anchor = null,
        tag = "train",
        hasArea = false,
    } = options;

    const trainComponents = [];
    const anchorComp = anchor ? [game.anchor(anchor)] : [];
    const areaComp = hasArea ? [game.area()] : [];

    // 電車本体
    const train = game.add([
        game.rect(width, height, { radius: 10 }),
        game.pos(x, y),
        game.color(...color),
        game.outline(4, game.rgb(...COLORS.OUTLINE_DARK)),
        ...anchorComp,
        ...areaComp,
        tag,
    ]);
    trainComponents.push(train);

    // 電車の窓
    const windowStartX = anchor === "center"
        ? x - (windowCount - 1) * windowGap / 2
        : x + 20;
    const windowY = anchor === "center" ? y - 10 : y + 10;

    for (let i = 0; i < windowCount; i++) {
        const windowX = windowStartX + i * windowGap;
        const win = game.add([
            game.rect(windowWidth, windowHeight),
            game.pos(windowX, windowY),
            game.color(...COLORS.WINDOW_BLUE),
            game.outline(2, game.rgb(...COLORS.OUTLINE_DARK)),
            ...(anchor === "center" ? [game.anchor("center")] : []),
            "window",
        ]);
        trainComponents.push(win);
    }

    return { train, windows: trainComponents.slice(1), all: trainComponents };
}
