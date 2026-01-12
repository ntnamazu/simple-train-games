// 👥 乗客乗せろゲーム

import { COLORS, GAME_CONFIG } from '../constants.js';
import { initKaplay, getGame, getRandomLine } from '../utils.js';
import { createBackButton, createResultOverlay, createTrain } from '../components.js';

/**
 * 乗客乗せろゲームを開始
 */
export function startPassengerGame() {
    // KaPlay初期化（再利用）
    initKaplay(COLORS.CORNFLOWER_BLUE);
    const game = getGame();

    const WIDTH = game.width();
    const HEIGHT = game.height();

    let score = 0;
    let timeLeft = GAME_CONFIG.PASSENGER.TIME_LIMIT;
    let gameOver = false;
    const currentLine = getRandomLine();

    game.scene("game", () => {
        gameOver = false;

        // 地面
        game.add([
            game.rect(WIDTH, 150),
            game.pos(0, HEIGHT - 150),
            game.color(180, 180, 180),
        ]);

        // 電車（画面下部）
        const trainY = HEIGHT - 100;
        createTrain(WIDTH / 2, trainY, currentLine.color, {
            width: 200,
            height: 80,
            windowCount: 3,
            windowWidth: 40,
            windowHeight: 30,
            windowGap: 60,
            anchor: "center",
            hasArea: true,
        });

        // 電車のドア（乗客が入る場所）
        game.add([
            game.rect(30, 50),
            game.pos(WIDTH / 2, trainY + 5),
            game.anchor("center"),
            game.color(100, 100, 100),
            "door",
        ]);

        // スコア表示
        const scoreText = game.add([
            game.text(`のせた: ${score}にん`, { size: 28 }),
            game.pos(20, 30),
            game.color(255, 255, 255),
        ]);

        // 残り時間
        const timeText = game.add([
            game.text(`のこり: ${timeLeft}びょう`, { size: 28 }),
            game.pos(WIDTH - 20, 30),
            game.anchor("topright"),
            game.color(255, 255, 255),
        ]);

        // 路線名
        game.add([
            game.text(currentLine.name, { size: 24 }),
            game.pos(WIDTH / 2, 30),
            game.anchor("center"),
            game.color(255, 255, 255),
        ]);

        // 乗客を生成
        function createPassenger() {
            if (gameOver || !getGame()) return;

            const x = game.rand(80, WIDTH - 80);
            const y = game.rand(150, HEIGHT - 250);

            const passenger = game.add([
                game.circle(25),
                game.pos(x, y),
                game.color(game.rand(100, 255), game.rand(100, 255), game.rand(100, 255)),
                game.outline(3, game.rgb(50, 50, 50)),
                game.area(),
                "passenger",
            ]);

            // 顔（乗客に追従）
            const face = game.add([
                game.text("😊", { size: 24 }),
                game.pos(x, y),
                game.anchor("center"),
                "face",
            ]);

            passenger.onClick(() => {
                if (gameOver) return;

                // 電車に向かって移動するアニメーション
                game.tween(
                    passenger.pos,
                    game.vec2(WIDTH / 2, trainY),
                    0.3,
                    (p) => {
                        passenger.pos = p;
                        face.pos = p; // 顔も一緒に移動
                    },
                    game.easings.easeOutQuad
                );

                // 乗客を消してスコア加算
                game.wait(0.3, () => {
                    passenger.destroy();
                    face.destroy();
                    score++;
                    scoreText.text = `のせた: ${score}にん`;

                    // エフェクト
                    const effect = game.add([
                        game.text("+1", { size: 24 }),
                        game.pos(WIDTH / 2, trainY - 60),
                        game.anchor("center"),
                        game.color(255, 255, 100),
                    ]);
                    game.tween(
                        effect.pos.y,
                        effect.pos.y - 40,
                        0.5,
                        (newY) => effect.pos.y = newY
                    );
                    game.wait(0.5, () => effect.destroy());
                });
            });
        }

        // 定期的に乗客を生成
        const spawnLoop = game.loop(GAME_CONFIG.PASSENGER.SPAWN_INTERVAL, createPassenger);
        createPassenger(); // 最初の1人

        // タイマー
        const timerLoop = game.loop(GAME_CONFIG.PASSENGER.SPAWN_INTERVAL, () => {
            if (gameOver || !getGame()) return;
            timeLeft--;
            timeText.text = `のこり: ${timeLeft}びょう`;

            if (timeLeft <= 0) {
                gameOver = true;
                game.go("result");
            }
        });

        // 戻るボタン
        createBackButton(WIDTH - 100, HEIGHT - 40);
    });

    // 結果シーン
    game.scene("result", () => {
        createResultOverlay();

        game.add([
            game.text("しゅうりょう！", { size: 32 }),
            game.pos(WIDTH / 2, HEIGHT / 2 - 80),
            game.anchor("center"),
            game.color(255, 255, 255),
        ]);

        game.add([
            game.text(`${score}にん のせた！`, { size: 40 }),
            game.pos(WIDTH / 2, HEIGHT / 2 - 20),
            game.anchor("center"),
            game.color(255, 215, 0),
        ]);

        let message = "";
        if (score >= 25) message = "🎉 すごすぎ！";
        else if (score >= 15) message = "⭐ いいかんじ！";
        else if (score >= 10) message = "👍 まあまあ！";
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
            timeLeft = 30;
            game.go("game");
        });

        // 戻るボタン
        createBackButton(WIDTH - 100, HEIGHT - 60);
    });

    game.go("game");
}
