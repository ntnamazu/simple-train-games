// 🛑 ぴったり停車ゲーム

import { COLORS, GAME_CONFIG } from '../constants.js';
import { initKaplay, getGame, getRandomLine } from '../utils.js';
import { createBackButton } from '../components.js';

/**
 * ぴったりていしゃゲームを開始
 */
export function startStoppingGame() {
    // KaPlay初期化（再利用）
    initKaplay(COLORS.SKY_BLUE);
    const game = getGame();

    const WIDTH = game.width();
    const HEIGHT = game.height();

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
    game.scene("game", () => {
        currentLine = getRandomLine();
        isBraking = false;
        gameState = "ready";

        // 速度は徐々に上がる
        trainSpeed = GAME_CONFIG.STOPPING.INITIAL_SPEED + (round - 1) * GAME_CONFIG.STOPPING.SPEED_INCREMENT;
        if (trainSpeed > GAME_CONFIG.STOPPING.MAX_SPEED) trainSpeed = GAME_CONFIG.STOPPING.MAX_SPEED;

        // 背景 - 地面
        game.add([
            game.rect(WIDTH, HEIGHT - GROUND_Y + 50),
            game.pos(0, GROUND_Y - 50),
            game.color(100, 100, 100),
        ]);

        // 線路
        game.add([
            game.rect(WIDTH, 20),
            game.pos(0, GROUND_Y),
            game.color(80, 80, 80),
        ]);

        // 停止線
        game.add([
            game.rect(8, 80),
            game.pos(STOP_LINE_X, GROUND_Y - 60),
            game.color(255, 255, 0),
            game.outline(2, game.rgb(0, 0, 0)),
        ]);

        // 停止線ラベル
        game.add([
            game.text("ていしせん", { size: 20 }),
            game.pos(STOP_LINE_X - 40, GROUND_Y - 90),
            game.color(255, 255, 255),
        ]);

        // ホーム
        game.add([
            game.rect(150, 40),
            game.pos(STOP_LINE_X - 180, GROUND_Y - 40),
            game.color(200, 200, 200),
            game.outline(3, game.rgb(100, 100, 100)),
        ]);

        // 駅名
        game.add([
            game.text("えき", { size: 24 }),
            game.pos(STOP_LINE_X - 140, GROUND_Y - 35),
            game.color(50, 50, 50),
        ]);

        // 電車
        const train = game.add([
            game.rect(180, 70, { radius: 10 }),
            game.pos(TRAIN_START_X, GROUND_Y - 70),
            game.color(...currentLine.color),
            game.outline(4, game.rgb(50, 50, 50)),
            "train",
        ]);

        // 電車の窓
        for (let i = 0; i < 3; i++) {
            game.add([
                game.rect(30, 25),
                game.pos(TRAIN_START_X + 20 + i * 50, GROUND_Y - 60),
                game.color(200, 230, 255),
                game.outline(2, game.rgb(50, 50, 50)),
                { follow: train, offsetX: 20 + i * 50, offsetY: 10 },
                "window",
            ]);
        }

        // 路線名表示
        game.add([
            game.text(currentLine.name, { size: 28 }),
            game.pos(WIDTH / 2, 30),
            game.anchor("center"),
            game.color(255, 255, 255),
        ]);

        // スコア表示
        const scoreText = game.add([
            game.text(`スコア: ${score}`, { size: 24 }),
            game.pos(20, 30),
            game.color(255, 255, 255),
        ]);

        // ラウンド表示
        game.add([
            game.text(`ラウンド ${round}`, { size: 24 }),
            game.pos(20, 60),
            game.color(255, 255, 255),
        ]);

        // 操作説明（最初のみ）
        const helpText = game.add([
            game.text("タップでブレーキ！", { size: 32 }),
            game.pos(WIDTH / 2, HEIGHT / 2 - 50),
            game.anchor("center"),
            game.color(255, 255, 255),
        ]);

        // 速度表示
        const speedText = game.add([
            game.text("", { size: 20 }),
            game.pos(WIDTH - 20, 30),
            game.anchor("topright"),
            game.color(255, 255, 255),
        ]);

        // 戻るボタン
        createBackButton(WIDTH - 100, HEIGHT - 60);

        // ゲーム開始（タップで開始）
        game.onClick(() => {
            if (gameState === "ready") {
                gameState = "running";
                helpText.text = "";
            } else if (gameState === "running") {
                gameState = "braking";
                isBraking = true;
            }
        });

        // 毎フレーム更新
        game.onUpdate(() => {
            // ゲームが終了している場合は何もしない
            if (!getGame()) return;

            // 窓を電車に追従させる
            game.get("window").forEach((windowObj, i) => {
                windowObj.pos.x = train.pos.x + 20 + i * 50;
            });

            if (gameState === "running") {
                train.pos.x -= trainSpeed;
                speedText.text = `はやさ: ${trainSpeed.toFixed(1)}`;

                // 画面外に出たら失敗
                if (train.pos.x < -200) {
                    showRoundResult(-100);
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

                    showRoundResult(points);
                }
            }
        });

        /**
         * ラウンド結果を表示する
         * @param {number} points - 獲得ポイント（負の値は失敗時）
         */
        function showRoundResult(points) {
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
            game.add([
                game.rect(300, 200, { radius: 20 }),
                game.pos(WIDTH / 2, HEIGHT / 2),
                game.anchor("center"),
                game.color(0, 0, 0),
                game.opacity(0.8),
            ]);

            game.add([
                game.text(message, { size: 28 }),
                game.pos(WIDTH / 2, HEIGHT / 2 - 50),
                game.anchor("center"),
                game.color(...messageColor),
            ]);

            game.add([
                game.text(`+${Math.max(0, points)}てん`, { size: 36 }),
                game.pos(WIDTH / 2, HEIGHT / 2),
                game.anchor("center"),
                game.color(255, 255, 255),
            ]);

            // 次へボタン
            const nextBtn = game.add([
                game.rect(150, 50, { radius: 10 }),
                game.pos(WIDTH / 2, HEIGHT / 2 + 60),
                game.anchor("center"),
                game.color(80, 200, 120),
                game.area(),
                "nextBtn",
            ]);

            game.add([
                game.text("つぎへ", { size: 24 }),
                game.pos(WIDTH / 2, HEIGHT / 2 + 60),
                game.anchor("center"),
                game.color(255, 255, 255),
            ]);

            nextBtn.onClick(() => {
                round++;
                game.go("game");
            });
        }
    });

    // ゲーム開始
    game.go("game");
}
