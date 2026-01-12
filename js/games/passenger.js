// 👥 乗客乗せろゲーム

import { COLORS, GAME_CONFIG } from '../constants.js';
import { initKaplay, getK, getRandomLine } from '../utils.js';
import { createBackButton, createResultOverlay, createTrain } from '../components.js';

/**
 * 乗客乗せろゲームを開始
 */
export function startPassengerGame() {
    // KaPlay初期化（再利用）
    initKaplay(COLORS.CORNFLOWER_BLUE);
    const k = getK();

    const WIDTH = k.width();
    const HEIGHT = k.height();

    let score = 0;
    let timeLeft = GAME_CONFIG.PASSENGER.TIME_LIMIT;
    let gameOver = false;
    const currentLine = getRandomLine();

    k.scene("game", () => {
        gameOver = false;

        // 地面
        k.add([
            k.rect(WIDTH, 150),
            k.pos(0, HEIGHT - 150),
            k.color(180, 180, 180),
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
        k.add([
            k.rect(30, 50),
            k.pos(WIDTH / 2, trainY + 5),
            k.anchor("center"),
            k.color(100, 100, 100),
            "door",
        ]);

        // スコア表示
        const scoreText = k.add([
            k.text(`のせた: ${score}にん`, { size: 28 }),
            k.pos(20, 30),
            k.color(255, 255, 255),
        ]);

        // 残り時間
        const timeText = k.add([
            k.text(`のこり: ${timeLeft}びょう`, { size: 28 }),
            k.pos(WIDTH - 20, 30),
            k.anchor("topright"),
            k.color(255, 255, 255),
        ]);

        // 路線名
        k.add([
            k.text(currentLine.name, { size: 24 }),
            k.pos(WIDTH / 2, 30),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);

        // 乗客を生成
        function spawnPassenger() {
            if (gameOver || !getK()) return;

            const x = k.rand(80, WIDTH - 80);
            const y = k.rand(150, HEIGHT - 250);

            const passenger = k.add([
                k.circle(25),
                k.pos(x, y),
                k.color(k.rand(100, 255), k.rand(100, 255), k.rand(100, 255)),
                k.outline(3, k.rgb(50, 50, 50)),
                k.area(),
                "passenger",
            ]);

            // 顔（乗客に追従）
            const face = k.add([
                k.text("😊", { size: 24 }),
                k.pos(x, y),
                k.anchor("center"),
                "face",
            ]);

            passenger.onClick(() => {
                if (gameOver) return;

                // 電車に向かって移動するアニメーション
                k.tween(
                    passenger.pos,
                    k.vec2(WIDTH / 2, trainY),
                    0.3,
                    (p) => {
                        passenger.pos = p;
                        face.pos = p; // 顔も一緒に移動
                    },
                    k.easings.easeOutQuad
                );

                // 乗客を消してスコア加算
                k.wait(0.3, () => {
                    passenger.destroy();
                    face.destroy();
                    score++;
                    scoreText.text = `のせた: ${score}にん`;

                    // エフェクト
                    const effect = k.add([
                        k.text("+1", { size: 24 }),
                        k.pos(WIDTH / 2, trainY - 60),
                        k.anchor("center"),
                        k.color(255, 255, 100),
                    ]);
                    k.tween(
                        effect.pos.y,
                        effect.pos.y - 40,
                        0.5,
                        (y) => effect.pos.y = y
                    );
                    k.wait(0.5, () => effect.destroy());
                });
            });
        }

        // 定期的に乗客を生成
        const spawnLoop = k.loop(GAME_CONFIG.PASSENGER.SPAWN_INTERVAL, spawnPassenger);
        spawnPassenger(); // 最初の1人

        // タイマー
        const timerLoop = k.loop(GAME_CONFIG.PASSENGER.SPAWN_INTERVAL, () => {
            if (gameOver || !getK()) return;
            timeLeft--;
            timeText.text = `のこり: ${timeLeft}びょう`;

            if (timeLeft <= 0) {
                gameOver = true;
                k.go("result");
            }
        });

        // 戻るボタン
        createBackButton(WIDTH - 100, HEIGHT - 40);
    });

    // 結果シーン
    k.scene("result", () => {
        createResultOverlay();

        k.add([
            k.text("しゅうりょう！", { size: 32 }),
            k.pos(WIDTH / 2, HEIGHT / 2 - 80),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);

        k.add([
            k.text(`${score}にん のせた！`, { size: 40 }),
            k.pos(WIDTH / 2, HEIGHT / 2 - 20),
            k.anchor("center"),
            k.color(255, 215, 0),
        ]);

        let message = "";
        if (score >= 25) message = "🎉 すごすぎ！";
        else if (score >= 15) message = "⭐ いいかんじ！";
        else if (score >= 10) message = "👍 まあまあ！";
        else message = "💪 がんばろう！";

        k.add([
            k.text(message, { size: 28 }),
            k.pos(WIDTH / 2, HEIGHT / 2 + 30),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);

        // もう一度ボタン
        const retryBtn = k.add([
            k.rect(150, 50, { radius: 10 }),
            k.pos(WIDTH / 2, HEIGHT / 2 + 90),
            k.anchor("center"),
            k.color(80, 200, 120),
            k.area(),
        ]);
        k.add([
            k.text("もういちど", { size: 22 }),
            k.pos(WIDTH / 2, HEIGHT / 2 + 90),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);
        retryBtn.onClick(() => {
            score = 0;
            timeLeft = 30;
            k.go("game");
        });

        // 戻るボタン
        createBackButton(WIDTH - 100, HEIGHT - 60);
    });

    k.go("game");
}
