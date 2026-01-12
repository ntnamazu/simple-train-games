// 🚃 でんしゃミニゲーム - ユーティリティ関数

import kaplay from "https://unpkg.com/kaplay@3001/dist/kaplay.mjs";
import { TRAIN_LINES } from './constants.js';

// 後方互換性のためのエイリアス
const kaboom = kaplay;

// グローバル変数（KaPlayインスタンス）
let k = null;

/**
 * KaPlayインスタンスを取得
 * @returns {object} - KaPlayインスタンス
 */
export function getK() {
    return k;
}

/**
 * KaPlayインスタンスを初期化または再利用する
 * @param {number[]} backgroundColor - 背景色 [R, G, B]
 * @returns {object} - KaPlayインスタンス
 */
export function initKaplay(backgroundColor) {
    if (k) {
        // 既存のインスタンスがある場合は、全てのオブジェクトを削除して再利用
        k.destroyAll();
        k.setBackground(...backgroundColor);
    } else {
        // 初回のみ新しいインスタンスを作成
        k = kaboom({
            canvas: document.getElementById('game-canvas'),
            width: window.innerWidth,
            height: window.innerHeight,
            background: backgroundColor,
            touchToMouse: true,
        });
    }
    return k;
}

/**
 * KaPlayインスタンスをクリーンアップ（メニューに戻る時用）
 */
export function cleanupKaplay() {
    if (k) {
        try {
            k.destroyAll();
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
