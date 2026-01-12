/**
 * 🚃 でんしゃミニゲーム - 定数定義
 *
 * ゲーム全体で使用する定数を一箇所に集約
 * - TILE_TYPES: パズルゲームのタイル種類
 * - DIRECTIONS: 方向（上下左右）
 * - COLORS: UI・背景・電車の色
 * - FONT_SIZES: フォントサイズ
 * - BUTTON_SIZES: ボタンサイズ
 * - GAME_CONFIG: 各ゲームの設定値
 * - TRAIN_LINES: 路線データ
 */

/** タイルタイプ（ろせんパズル用） */
export const TILE_TYPES = {
    EMPTY: 0,
    STRAIGHT_VERTICAL: 1,   // 直線（縦）
    STRAIGHT_HORIZONTAL: 2, // 直線（横）
    CURVE_BOTTOM_RIGHT: 3,  // カーブ（右下）
    CURVE_BOTTOM_LEFT: 4,   // カーブ（左下）
    CURVE_TOP_LEFT: 5,      // カーブ（左上）
    CURVE_TOP_RIGHT: 6,     // カーブ（右上）
    START: 7,               // スタート駅
    GOAL: 8,                // ゴール駅
};

/** 方向定数（経路探索で使用） */
export const DIRECTIONS = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3,
};

/** 色定数（RGB配列形式） */
export const COLORS = {
    // 背景色
    SKY_BLUE: [135, 206, 235],
    STEEL_BLUE: [70, 130, 180],
    CORNFLOWER_BLUE: [100, 149, 237],
    DARK_GRAY: [60, 60, 80],

    // UI色
    WHITE: [255, 255, 255],
    BLACK: [0, 0, 0],
    GOLD: [255, 215, 0],
    SUCCESS_GREEN: [80, 200, 120],
    FAIL_RED: [200, 80, 80],
    BUTTON_GRAY: [100, 100, 100],

    // 電車・線路関連
    WINDOW_BLUE: [200, 230, 255],
    OUTLINE_DARK: [50, 50, 50],
    GROUND_GRAY: [100, 100, 100],
    RAIL_GRAY: [80, 80, 80],
    PLATFORM_GRAY: [180, 180, 180],
    TILE_BG: [40, 40, 50],
    TILE_SURFACE: [80, 80, 100],
};

/** フォントサイズ（ピクセル） */
export const FONT_SIZES = {
    TITLE: 32,
    LARGE: 28,
    MEDIUM: 24,
    SMALL: 20,
    TINY: 18,
};

/** ボタンサイズ（width, height, radius） */
export const BUTTON_SIZES = {
    BACK: { width: 80, height: 40, radius: 8 },
    ACTION: { width: 150, height: 50, radius: 10 },
    CHECK: { width: 160, height: 50, radius: 10 },
    CHOICE: { width: 280, height: 60, radius: 12 },
};

/** 各ゲームの設定値 */
export const GAME_CONFIG = {
    STOPPING: {
        INITIAL_SPEED: 5,
        SPEED_INCREMENT: 0.5,
        MAX_SPEED: 12,
        BRAKE_DECELERATION: 0.95,
        SCORE_THRESHOLDS: [
            { maxDiff: 10, points: 100 },
            { maxDiff: 30, points: 70 },
            { maxDiff: 60, points: 40 },
            { maxDiff: 100, points: 20 },
        ],
    },
    QUIZ: {
        MAX_ROUNDS: 10,
        POINTS_PER_CORRECT: 10,
        NEXT_DELAY: 1.5,
    },
    PASSENGER: {
        TIME_LIMIT: 30,
        SPAWN_INTERVAL: 1,
    },
    PUZZLE: {
        TRACK_WIDTH: 12,
        FAIL_MESSAGE_DURATION: 2,
    },
};

/** 路線データ（名前とRGBカラー） */
export const TRAIN_LINES = {
    yamanote: { name: "山手線", color: [128, 194, 65] },      // 黄緑
    keihinTohoku: { name: "京浜東北線", color: [0, 178, 229] }, // 水色
    chuo: { name: "中央線", color: [241, 90, 34] },           // オレンジ
    sobu: { name: "総武線", color: [255, 212, 0] },           // 黄色
};
