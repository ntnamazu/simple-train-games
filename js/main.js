// 🚃 でんしゃミニゲーム - メインスクリプト

import kaboom from "https://unpkg.com/kaboom@3000.1.17/dist/kaboom.mjs";

// 路線データ
const TRAIN_LINES = {
    yamanote: { name: "山手線", color: [128, 194, 65] },      // 黄緑
    keihinTohoku: { name: "京浜東北線", color: [0, 178, 229] }, // 水色
    chuo: { name: "中央線", color: [241, 90, 34] },           // オレンジ
    sobu: { name: "総武線", color: [255, 212, 0] },           // 黄色
};

// 路線をランダムに取得
function getRandomLine() {
    const keys = Object.keys(TRAIN_LINES);
    const key = keys[Math.floor(Math.random() * keys.length)];
    return { key, ...TRAIN_LINES[key] };
}

// グローバル変数
let k = null;

// ゲーム開始関数（HTMLから呼ばれる）
window.startGame = function(gameType) {
    if (gameType === 'stopping') {
        document.getElementById('menu-screen').classList.add('hidden');
        document.getElementById('game-canvas').classList.add('active');
        startStoppingGame();
    }
};

// メニューに戻る
function goToMenu() {
    if (k) {
        k.destroy();
        k = null;
    }
    document.getElementById('game-canvas').classList.remove('active');
    document.getElementById('menu-screen').classList.remove('hidden');
}

// =====================================================
// 🛑 ぴったり停車ゲーム
// =====================================================
function startStoppingGame() {
    // Kaboom初期化
    k = kaboom({
        canvas: document.getElementById('game-canvas'),
        width: window.innerWidth,
        height: window.innerHeight,
        background: [135, 206, 235], // 空色
        touchToMouse: true,
    });

    const WIDTH = k.width();
    const HEIGHT = k.height();

    // ゲーム設定
    const GROUND_Y = HEIGHT * 0.7;
    const STOP_LINE_X = WIDTH * 0.25;
    const TRAIN_START_X = WIDTH + 200;

    let currentLine = getRandomLine();
    let trainSpeed = 5;
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
        trainSpeed = 5 + (round - 1) * 0.5;
        if (trainSpeed > 12) trainSpeed = 12;

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
        const backBtn = k.add([
            k.rect(80, 40, { radius: 8 }),
            k.pos(WIDTH - 100, HEIGHT - 60),
            k.color(100, 100, 100),
            k.area(),
            "backBtn",
        ]);
        k.add([
            k.text("もどる", { size: 18 }),
            k.pos(WIDTH - 60, HEIGHT - 48),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);

        backBtn.onClick(() => {
            goToMenu();
        });

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
                trainSpeed *= 0.95;
                train.pos.x -= trainSpeed;

                if (trainSpeed < 0.1) {
                    trainSpeed = 0;
                    // 結果判定
                    const trainFront = train.pos.x;
                    const diff = Math.abs(trainFront - STOP_LINE_X);

                    let points = 0;
                    if (diff < 10) {
                        points = 100;
                    } else if (diff < 30) {
                        points = 70;
                    } else if (diff < 60) {
                        points = 40;
                    } else if (diff < 100) {
                        points = 20;
                    } else {
                        points = 0;
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
