// 🛑 ぴったり停車ゲーム

import { COLORS, GAME_CONFIG } from '../constants.js';
import { initKaplay, getK, getRandomLine } from '../utils.js';
import { createBackButton } from '../components.js';

/**
 * ぴったりていしゃゲームを開始
 */
export function startStoppingGame() {
    // KaPlay初期化（再利用）
    initKaplay(COLORS.SKY_BLUE);
    const k = getK();

    const WIDTH = k.width();
    const HEIGHT = k.height();

    // ゲーム設定
    const GROUND_Y = HEIGHT * 0.7;
    const STOP_LINE_X = WIDTH * 0.25;
    const TRAIN_START_X = WIDTH + 200;

    let currentLine = getRandomLine();
    let trainSpeed = GAME_CONFIG.STOPPING.INITIAL_SPEED;
    let score = 0;
    let round = 1;
    let isBraking = false;
    let gameState = "ready"; // ready, running, braking, result

    // シーン: ゲームプレイ
    k.scene("game", () => {
        currentLine = getRandomLine();
        isBraking = false;
        gameState = "ready";

        // 速度は徐々に上がる
        trainSpeed = GAME_CONFIG.STOPPING.INITIAL_SPEED + (round - 1) * GAME_CONFIG.STOPPING.SPEED_INCREMENT;
        if (trainSpeed > GAME_CONFIG.STOPPING.MAX_SPEED) trainSpeed = GAME_CONFIG.STOPPING.MAX_SPEED;

        // 背景 - 地面
        k.add([
            k.rect(WIDTH, HEIGHT - GROUND_Y + 50),
            k.pos(0, GROUND_Y - 50),
            k.color(100, 100, 100),
        ]);

        // 線路
        k.add([
            k.rect(WIDTH, 20),
            k.pos(0, GROUND_Y),
            k.color(80, 80, 80),
        ]);

        // 停止線
        k.add([
            k.rect(8, 80),
            k.pos(STOP_LINE_X, GROUND_Y - 60),
            k.color(255, 255, 0),
            k.outline(2, k.rgb(0, 0, 0)),
        ]);

        // 停止線ラベル
        k.add([
            k.text("ていしせん", { size: 20 }),
            k.pos(STOP_LINE_X - 40, GROUND_Y - 90),
            k.color(255, 255, 255),
        ]);

        // ホーム
        k.add([
            k.rect(150, 40),
            k.pos(STOP_LINE_X - 180, GROUND_Y - 40),
            k.color(200, 200, 200),
            k.outline(3, k.rgb(100, 100, 100)),
        ]);

        // 駅名
        k.add([
            k.text("えき", { size: 24 }),
            k.pos(STOP_LINE_X - 140, GROUND_Y - 35),
            k.color(50, 50, 50),
        ]);

        // 電車
        const train = k.add([
            k.rect(180, 70, { radius: 10 }),
            k.pos(TRAIN_START_X, GROUND_Y - 70),
            k.color(...currentLine.color),
            k.outline(4, k.rgb(50, 50, 50)),
            "train",
        ]);

        // 電車の窓
        for (let i = 0; i < 3; i++) {
            k.add([
                k.rect(30, 25),
                k.pos(TRAIN_START_X + 20 + i * 50, GROUND_Y - 60),
                k.color(200, 230, 255),
                k.outline(2, k.rgb(50, 50, 50)),
                { follow: train, offsetX: 20 + i * 50, offsetY: 10 },
                "window",
            ]);
        }

        // 路線名表示
        k.add([
            k.text(currentLine.name, { size: 28 }),
            k.pos(WIDTH / 2, 30),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);

        // スコア表示
        const scoreText = k.add([
            k.text(`スコア: ${score}`, { size: 24 }),
            k.pos(20, 30),
            k.color(255, 255, 255),
        ]);

        // ラウンド表示
        k.add([
            k.text(`ラウンド ${round}`, { size: 24 }),
            k.pos(20, 60),
            k.color(255, 255, 255),
        ]);

        // 操作説明（最初のみ）
        const helpText = k.add([
            k.text("タップでブレーキ！", { size: 32 }),
            k.pos(WIDTH / 2, HEIGHT / 2 - 50),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);

        // 速度表示
        const speedText = k.add([
            k.text("", { size: 20 }),
            k.pos(WIDTH - 20, 30),
            k.anchor("topright"),
            k.color(255, 255, 255),
        ]);

        // 戻るボタン
        createBackButton(WIDTH - 100, HEIGHT - 60);

        // ゲーム開始（タップで開始）
        k.onClick(() => {
            if (gameState === "ready") {
                gameState = "running";
                helpText.text = "";
            } else if (gameState === "running") {
                gameState = "braking";
                isBraking = true;
            }
        });

        // 毎フレーム更新
        k.onUpdate(() => {
            // ゲームが終了している場合は何もしない
            if (!getK()) return;

            // 窓を電車に追従させる
            k.get("window").forEach((w, i) => {
                w.pos.x = train.pos.x + 20 + i * 50;
            });

            if (gameState === "running") {
                train.pos.x -= trainSpeed;
                speedText.text = `はやさ: ${trainSpeed.toFixed(1)}`;

                // 画面外に出たら失敗
                if (train.pos.x < -200) {
                    showResult(-100);
                }
            } else if (gameState === "braking") {
                // ブレーキ中は減速
                trainSpeed *= GAME_CONFIG.STOPPING.BRAKE_DECELERATION;
                train.pos.x -= trainSpeed;

                if (trainSpeed < 0.1) {
                    trainSpeed = 0;
                    // 結果判定
                    const trainFront = train.pos.x;
                    const diff = Math.abs(trainFront - STOP_LINE_X);

                    // スコア計算
                    let points = 0;
                    for (const threshold of GAME_CONFIG.STOPPING.SCORE_THRESHOLDS) {
                        if (diff < threshold.maxDiff) {
                            points = threshold.points;
                            break;
                        }
                    }

                    showResult(points);
                }
            }
        });

        function showResult(points) {
            gameState = "result";
            score += points;

            let message = "";
            let messageColor = [255, 255, 255];

            if (points >= 100) {
                message = "🎉 ピッタリ！すごい！";
                messageColor = [255, 215, 0];
            } else if (points >= 70) {
                message = "⭐ おしい！";
                messageColor = [255, 255, 100];
            } else if (points >= 40) {
                message = "👍 まあまあ！";
                messageColor = [200, 255, 200];
            } else if (points >= 0) {
                message = "😅 がんばろう！";
                messageColor = [255, 200, 200];
            } else {
                message = "😱 とおりすぎちゃった！";
                messageColor = [255, 100, 100];
            }

            // 結果表示
            k.add([
                k.rect(300, 200, { radius: 20 }),
                k.pos(WIDTH / 2, HEIGHT / 2),
                k.anchor("center"),
                k.color(0, 0, 0),
                k.opacity(0.8),
            ]);

            k.add([
                k.text(message, { size: 28 }),
                k.pos(WIDTH / 2, HEIGHT / 2 - 50),
                k.anchor("center"),
                k.color(...messageColor),
            ]);

            k.add([
                k.text(`+${Math.max(0, points)}てん`, { size: 36 }),
                k.pos(WIDTH / 2, HEIGHT / 2),
                k.anchor("center"),
                k.color(255, 255, 255),
            ]);

            // 次へボタン
            const nextBtn = k.add([
                k.rect(150, 50, { radius: 10 }),
                k.pos(WIDTH / 2, HEIGHT / 2 + 60),
                k.anchor("center"),
                k.color(80, 200, 120),
                k.area(),
                "nextBtn",
            ]);

            k.add([
                k.text("つぎへ", { size: 24 }),
                k.pos(WIDTH / 2, HEIGHT / 2 + 60),
                k.anchor("center"),
                k.color(255, 255, 255),
            ]);

            nextBtn.onClick(() => {
                round++;
                k.go("game");
            });
        }
    });

    // ゲーム開始
    k.go("game");
}
