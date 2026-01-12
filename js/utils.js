// 🚃 でんしゃミニゲーム - ユーティリティ関数

import kaplay from "https://unpkg.com/kaplay@3001/dist/kaplay.mjs";
import { TRAIN_LINES } from './constants.js';

// グローバル変数（KaPlayインスタンス）
let game = null;

/**
 * KaPlayインスタンスを取得
 * @returns {object} - KaPlayインスタンス
 */
export function getGame() {
    return game;
}

/**
 * KaPlayインスタンスを初期化または再利用する
 * @param {number[]} backgroundColor - 背景色 [R, G, B]
 * @returns {object} - KaPlayインスタンス
 */
export function initKaplay(backgroundColor) {
    if (game) {
        // 既存のインスタンスがある場合は、全てのオブジェクトを削除して再利用
        game.destroyAll();
        game.setBackground(...backgroundColor);
    } else {
        // 初回のみ新しいインスタンスを作成
        game = kaplay({
            canvas: document.getElementById('game-canvas'),
            width: window.innerWidth,
            height: window.innerHeight,
            background: backgroundColor,
            touchToMouse: true,
        });
    }
    return game;
}

/**
 * KaPlayインスタンスをクリーンアップ（メニューに戻る時用）
 */
export function cleanupKaplay() {
    if (game) {
        try {
            game.destroyAll();
        } catch (e) {
            // エラーを無視
        }
    }
}

/**
 * 路線をランダムに取得
 * @returns {object} - ランダムに選ばれた路線情報
 */
export function getRandomLine() {
    const keys = Object.keys(TRAIN_LINES);
    const key = keys[Math.floor(Math.random() * keys.length)];
    return { key, ...TRAIN_LINES[key] };
}

/**
 * 配列をシャッフルする
 * @param {Array} array - シャッフルする配列
 * @returns {Array} - シャッフルされた新しい配列
 */
export function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
