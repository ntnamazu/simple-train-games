// ❓ 路線カラークイズ

import { COLORS, GAME_CONFIG, TRAIN_LINES } from '../constants.js';
import { initKaplay, getGame, shuffle } from '../utils.js';
import { createBackButton, createResultOverlay, createTrain } from '../components.js';

/**
 * 路線カラークイズゲームを開始
 */
export function startQuizGame() {
    // KaPlay初期化（再利用）
    initKaplay(COLORS.STEEL_BLUE);
    const game = getGame();

    const WIDTH = game.width();
    const HEIGHT = game.height();

    let score = 0;
    let round = 1;
    const MAX_ROUNDS = GAME_CONFIG.QUIZ.MAX_ROUNDS;

    game.scene("quiz", () => {
        // 正解の路線を選ぶ
        const lineKeys = Object.keys(TRAIN_LINES);
        const correctKey = lineKeys[Math.floor(Math.random() * lineKeys.length)];
        const correctLine = { key: correctKey, ...TRAIN_LINES[correctKey] };

        // 選択肢を作成（正解 + 他3つ）
        const otherKeys = lineKeys.filter(key => key !== correctKey);
        const shuffledOthers = shuffle(otherKeys).slice(0, 3);
        const choices = shuffle([correctKey, ...shuffledOthers]);

        // タイトル
        game.add([
            game.text("この電車は なにせん？", { size: 32 }),
            game.pos(WIDTH / 2, 40),
            game.anchor("center"),
            game.color(255, 255, 255),
        ]);

        // スコア・ラウンド表示
        game.add([
            game.text(`スコア: ${score}`, { size: 24 }),
            game.pos(20, 30),
            game.color(255, 255, 255),
        ]);
        game.add([
            game.text(`${round}/${MAX_ROUNDS}`, { size: 24 }),
            game.pos(WIDTH - 20, 30),
            game.anchor("topright"),
            game.color(255, 255, 255),
        ]);

        // 電車を表示
        const trainY = HEIGHT * 0.35;
        createTrain(WIDTH / 2, trainY, correctLine.color, {
            width: 220,
            height: 90,
            windowCount: 4,
            windowWidth: 35,
            windowHeight: 30,
            windowGap: 50,
            anchor: "center",
        });

        // 選択肢ボタン
        const btnStartY = HEIGHT * 0.55;
        const btnHeight = 60;
        const btnGap = 15;
        let answered = false;

        choices.forEach((choiceKey, index) => {
            const line = TRAIN_LINES[choiceKey];
            const btnY = btnStartY + index * (btnHeight + btnGap);

            const btn = game.add([
                game.rect(280, btnHeight, { radius: 12 }),
                game.pos(WIDTH / 2, btnY),
                game.anchor("center"),
                game.color(255, 255, 255),
                game.area(),
                "choiceBtn",
                { lineKey: choiceKey },
            ]);

            game.add([
                game.text(line.name, { size: 26 }),
                game.pos(WIDTH / 2, btnY),
                game.anchor("center"),
                game.color(50, 50, 50),
            ]);

            btn.onClick(() => {
                // 既に回答済みなら何もしない
                if (answered) return;
                answered = true;

                const isCorrect = choiceKey === correctKey;

                if (isCorrect) {
                    btn.color = game.rgb(100, 200, 100);
                    score += GAME_CONFIG.QUIZ.POINTS_PER_CORRECT;
                } else {
                    btn.color = game.rgb(200, 100, 100);
                    // 正解を表示
                    game.get("choiceBtn").forEach(button => {
                        if (button.lineKey === correctKey) {
                            button.color = game.rgb(100, 200, 100);
                        }
                    });
                }

                // 結果表示
                game.add([
                    game.text(isCorrect ? "⭕ せいかい！" : "❌ ざんねん！", { size: 36 }),
                    game.pos(WIDTH / 2, HEIGHT * 0.9),
                    game.anchor("center"),
                    game.color(isCorrect ? [100, 255, 100] : [255, 100, 100]),
                ]);

                // 次へ
                game.wait(GAME_CONFIG.QUIZ.NEXT_DELAY, () => {
                    if (round >= MAX_ROUNDS) {
                        game.go("result");
                    } else {
                        round++;
                        game.go("quiz");
                    }
                });
            });
        });

        // 戻るボタン
        createBackButton(WIDTH - 100, HEIGHT - 60);
    });

    // 結果シーン
    game.scene("result", () => {
        createResultOverlay();

        game.add([
            game.text("けっか", { size: 36 }),
            game.pos(WIDTH / 2, HEIGHT / 2 - 80),
            game.anchor("center"),
            game.color(255, 255, 255),
        ]);

        game.add([
            game.text(`${score} てん`, { size: 48 }),
            game.pos(WIDTH / 2, HEIGHT / 2 - 20),
            game.anchor("center"),
            game.color(255, 215, 0),
        ]);

        let message = "";
        if (score >= 100) message = "🎉 パーフェクト！";
        else if (score >= 70) message = "⭐ すごい！";
        else if (score >= 50) message = "👍 いいね！";
        else message = "💪 がんばろう！";

        game.add([
            game.text(message, { size: 28 }),
            game.pos(WIDTH / 2, HEIGHT / 2 + 30),
            game.anchor("center"),
            game.color(255, 255, 255),
        ]);

        // もう一度ボタン
        const retryBtn = game.add([
            game.rect(150, 50, { radius: 10 }),
            game.pos(WIDTH / 2, HEIGHT / 2 + 90),
            game.anchor("center"),
            game.color(80, 200, 120),
            game.area(),
        ]);
        game.add([
            game.text("もういちど", { size: 22 }),
            game.pos(WIDTH / 2, HEIGHT / 2 + 90),
            game.anchor("center"),
            game.color(255, 255, 255),
        ]);
        retryBtn.onClick(() => {
            score = 0;
            round = 1;
            game.go("quiz");
        });

        // 戻るボタン
        createBackButton(WIDTH - 100, HEIGHT - 60);
    });

    game.go("quiz");
}
