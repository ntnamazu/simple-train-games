// 🚃 でんしゃミニゲーム - メインスクリプト（エントリーポイント）

import { cleanupKaplay } from './utils.js';
import { startStoppingGame } from './games/stopping.js';
import { startQuizGame } from './games/quiz.js';
import { startPassengerGame } from './games/passenger.js';
import { startPuzzleGame } from './games/puzzle.js';

// ゲーム開始関数（HTMLから呼ばれる）
window.startGame = function(gameType) {
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('game-canvas').classList.add('active');

    if (gameType === 'stopping') {
        startStoppingGame();
    } else if (gameType === 'quiz') {
        startQuizGame();
    } else if (gameType === 'passenger') {
        startPassengerGame();
    } else if (gameType === 'puzzle') {
        startPuzzleGame();
    }
};

// メニューに戻る
window.goToMenu = function() {
    cleanupKaplay();
    document.getElementById('game-canvas').classList.remove('active');
    document.getElementById('menu-screen').classList.remove('hidden');
};
