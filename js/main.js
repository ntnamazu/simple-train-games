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
    if (k) {
        try {
            k.quit();
        } catch (e) {
            // エラーを無視
        }
        k = null;
    }
    document.getElementById('game-canvas').classList.remove('active');
    document.getElementById('menu-screen').classList.remove('hidden');
};

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

// =====================================================
// ❓ 路線カラークイズ
// =====================================================
function startQuizGame() {
    k = kaboom({
        canvas: document.getElementById('game-canvas'),
        width: window.innerWidth,
        height: window.innerHeight,
        background: [70, 130, 180], // スチールブルー
        touchToMouse: true,
    });

    const WIDTH = k.width();
    const HEIGHT = k.height();

    let score = 0;
    let round = 1;
    const MAX_ROUNDS = 10;

    // シャッフル関数
    function shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    k.scene("quiz", () => {
        // 正解の路線を選ぶ
        const lineKeys = Object.keys(TRAIN_LINES);
        const correctKey = lineKeys[Math.floor(Math.random() * lineKeys.length)];
        const correctLine = { key: correctKey, ...TRAIN_LINES[correctKey] };

        // 選択肢を作成（正解 + 他3つ）
        const otherKeys = lineKeys.filter(k => k !== correctKey);
        const shuffledOthers = shuffle(otherKeys).slice(0, 3);
        const choices = shuffle([correctKey, ...shuffledOthers]);

        // タイトル
        k.add([
            k.text("この電車は なにせん？", { size: 32 }),
            k.pos(WIDTH / 2, 40),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);

        // スコア・ラウンド表示
        k.add([
            k.text(`スコア: ${score}`, { size: 24 }),
            k.pos(20, 30),
            k.color(255, 255, 255),
        ]);
        k.add([
            k.text(`${round}/${MAX_ROUNDS}`, { size: 24 }),
            k.pos(WIDTH - 20, 30),
            k.anchor("topright"),
            k.color(255, 255, 255),
        ]);

        // 電車を表示
        const trainY = HEIGHT * 0.35;
        k.add([
            k.rect(220, 90, { radius: 12 }),
            k.pos(WIDTH / 2, trainY),
            k.anchor("center"),
            k.color(...correctLine.color),
            k.outline(4, k.rgb(50, 50, 50)),
        ]);

        // 電車の窓
        for (let i = 0; i < 4; i++) {
            k.add([
                k.rect(35, 30),
                k.pos(WIDTH / 2 - 75 + i * 50, trainY - 10),
                k.anchor("center"),
                k.color(200, 230, 255),
                k.outline(2, k.rgb(50, 50, 50)),
            ]);
        }

        // 選択肢ボタン
        const btnStartY = HEIGHT * 0.55;
        const btnHeight = 60;
        const btnGap = 15;

        choices.forEach((choiceKey, index) => {
            const line = TRAIN_LINES[choiceKey];
            const btnY = btnStartY + index * (btnHeight + btnGap);

            const btn = k.add([
                k.rect(280, btnHeight, { radius: 12 }),
                k.pos(WIDTH / 2, btnY),
                k.anchor("center"),
                k.color(255, 255, 255),
                k.area(),
                "choiceBtn",
                { lineKey: choiceKey },
            ]);

            k.add([
                k.text(line.name, { size: 26 }),
                k.pos(WIDTH / 2, btnY),
                k.anchor("center"),
                k.color(50, 50, 50),
            ]);

            btn.onClick(() => {
                // 全ボタン無効化
                k.get("choiceBtn").forEach(b => b.unuse("area"));

                const isCorrect = choiceKey === correctKey;

                if (isCorrect) {
                    btn.color = k.rgb(100, 200, 100);
                    score += 10;
                } else {
                    btn.color = k.rgb(200, 100, 100);
                    // 正解を表示
                    k.get("choiceBtn").forEach(b => {
                        if (b.lineKey === correctKey) {
                            b.color = k.rgb(100, 200, 100);
                        }
                    });
                }

                // 結果表示
                k.add([
                    k.text(isCorrect ? "⭕ せいかい！" : "❌ ざんねん！", { size: 36 }),
                    k.pos(WIDTH / 2, HEIGHT * 0.9),
                    k.anchor("center"),
                    k.color(isCorrect ? [100, 255, 100] : [255, 100, 100]),
                ]);

                // 次へ
                k.wait(1.5, () => {
                    if (round >= MAX_ROUNDS) {
                        k.go("result");
                    } else {
                        round++;
                        k.go("quiz");
                    }
                });
            });
        });

        // 戻るボタン
        const backBtn = k.add([
            k.rect(80, 40, { radius: 8 }),
            k.pos(WIDTH - 100, HEIGHT - 60),
            k.color(100, 100, 100),
            k.area(),
        ]);
        k.add([
            k.text("もどる", { size: 18 }),
            k.pos(WIDTH - 60, HEIGHT - 48),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);
        backBtn.onClick(() => goToMenu());
    });

    // 結果シーン
    k.scene("result", () => {
        k.add([
            k.rect(320, 250, { radius: 20 }),
            k.pos(WIDTH / 2, HEIGHT / 2),
            k.anchor("center"),
            k.color(0, 0, 0),
            k.opacity(0.85),
        ]);

        k.add([
            k.text("けっか", { size: 36 }),
            k.pos(WIDTH / 2, HEIGHT / 2 - 80),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);

        k.add([
            k.text(`${score} てん`, { size: 48 }),
            k.pos(WIDTH / 2, HEIGHT / 2 - 20),
            k.anchor("center"),
            k.color(255, 215, 0),
        ]);

        let message = "";
        if (score >= 100) message = "🎉 パーフェクト！";
        else if (score >= 70) message = "⭐ すごい！";
        else if (score >= 50) message = "👍 いいね！";
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
            round = 1;
            k.go("quiz");
        });

        // 戻るボタン
        const backBtn = k.add([
            k.rect(80, 40, { radius: 8 }),
            k.pos(WIDTH - 100, HEIGHT - 60),
            k.color(100, 100, 100),
            k.area(),
        ]);
        k.add([
            k.text("もどる", { size: 18 }),
            k.pos(WIDTH - 60, HEIGHT - 48),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);
        backBtn.onClick(() => goToMenu());
    });

    k.go("quiz");
}

// =====================================================
// 👥 乗客乗せろゲーム
// =====================================================
function startPassengerGame() {
    k = kaboom({
        canvas: document.getElementById('game-canvas'),
        width: window.innerWidth,
        height: window.innerHeight,
        background: [100, 149, 237], // コーンフラワーブルー
        touchToMouse: true,
    });

    const WIDTH = k.width();
    const HEIGHT = k.height();

    let score = 0;
    let timeLeft = 30;
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
        const train = k.add([
            k.rect(200, 80, { radius: 10 }),
            k.pos(WIDTH / 2, trainY),
            k.anchor("center"),
            k.color(...currentLine.color),
            k.outline(4, k.rgb(50, 50, 50)),
            k.area(),
            "train",
        ]);

        // 電車の窓
        for (let i = 0; i < 3; i++) {
            k.add([
                k.rect(40, 30),
                k.pos(WIDTH / 2 - 60 + i * 60, trainY - 10),
                k.anchor("center"),
                k.color(200, 230, 255),
                k.outline(2, k.rgb(50, 50, 50)),
            ]);
        }

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
            if (gameOver) return;

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
        const spawnLoop = k.loop(1, spawnPassenger);
        spawnPassenger(); // 最初の1人

        // タイマー
        const timerLoop = k.loop(1, () => {
            if (gameOver) return;
            timeLeft--;
            timeText.text = `のこり: ${timeLeft}びょう`;

            if (timeLeft <= 0) {
                gameOver = true;
                k.go("result");
            }
        });

        // 戻るボタン
        const backBtn = k.add([
            k.rect(80, 40, { radius: 8 }),
            k.pos(WIDTH - 100, HEIGHT - 40),
            k.color(100, 100, 100),
            k.area(),
        ]);
        k.add([
            k.text("もどる", { size: 18 }),
            k.pos(WIDTH - 60, HEIGHT - 28),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);
        backBtn.onClick(() => goToMenu());
    });

    // 結果シーン
    k.scene("result", () => {
        k.add([
            k.rect(320, 250, { radius: 20 }),
            k.pos(WIDTH / 2, HEIGHT / 2),
            k.anchor("center"),
            k.color(0, 0, 0),
            k.opacity(0.85),
        ]);

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
        const backBtn = k.add([
            k.rect(80, 40, { radius: 8 }),
            k.pos(WIDTH - 100, HEIGHT - 60),
            k.color(100, 100, 100),
            k.area(),
        ]);
        k.add([
            k.text("もどる", { size: 18 }),
            k.pos(WIDTH - 60, HEIGHT - 48),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);
        backBtn.onClick(() => goToMenu());
    });

    k.go("game");
}

// =====================================================
// 🔀 路線パズル
// =====================================================
function startPuzzleGame() {
    k = kaboom({
        canvas: document.getElementById('game-canvas'),
        width: window.innerWidth,
        height: window.innerHeight,
        background: [60, 60, 80],
        touchToMouse: true,
    });

    const WIDTH = k.width();
    const HEIGHT = k.height();

    let currentLevel = 1;
    let moves = 0;

    // パズルのレベルデータ
    // 0=空, 1=直線縦, 2=直線横, 3=カーブ(右下), 4=カーブ(左下), 5=カーブ(左上), 6=カーブ(右上), 7=スタート, 8=ゴール
    const levels = [
        // レベル1: 簡単
        {
            grid: [
                [7, 2, 2, 8],
            ],
            start: { x: 0, y: 0 },
            goal: { x: 3, y: 0 },
        },
        // レベル2: カーブあり
        {
            grid: [
                [7, 2, 3, 0],
                [0, 0, 1, 0],
                [0, 0, 6, 8],
            ],
            start: { x: 0, y: 0 },
            goal: { x: 3, y: 2 },
        },
        // レベル3: ちょっと複雑
        {
            grid: [
                [7, 3, 0, 0],
                [0, 1, 0, 0],
                [0, 6, 2, 8],
            ],
            start: { x: 0, y: 0 },
            goal: { x: 3, y: 2 },
        },
    ];

    const currentLine = getRandomLine();

    k.scene("puzzle", () => {
        const level = levels[(currentLevel - 1) % levels.length];
        const gridRows = level.grid.length;
        const gridCols = level.grid[0].length;
        const cellSize = Math.min(80, (WIDTH - 40) / gridCols, (HEIGHT - 200) / gridRows);
        const gridWidth = cellSize * gridCols;
        const gridHeight = cellSize * gridRows;
        const startX = (WIDTH - gridWidth) / 2;
        const startY = (HEIGHT - gridHeight) / 2;

        moves = 0;

        // タイトル
        k.add([
            k.text(`レベル ${currentLevel}`, { size: 32 }),
            k.pos(WIDTH / 2, 40),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);

        // 移動回数
        const movesText = k.add([
            k.text(`タップ: ${moves}`, { size: 24 }),
            k.pos(20, 30),
            k.color(255, 255, 255),
        ]);

        // 説明
        k.add([
            k.text("せんろをタップしてまわそう！", { size: 20 }),
            k.pos(WIDTH / 2, 80),
            k.anchor("center"),
            k.color(200, 200, 200),
        ]);

        // グリッドを描画
        const tiles = [];

        for (let row = 0; row < gridRows; row++) {
            tiles[row] = [];
            for (let col = 0; col < gridCols; col++) {
                const tileType = level.grid[row][col];
                const x = startX + col * cellSize + cellSize / 2;
                const y = startY + row * cellSize + cellSize / 2;

                // 背景タイル
                k.add([
                    k.rect(cellSize - 4, cellSize - 4, { radius: 4 }),
                    k.pos(x, y),
                    k.anchor("center"),
                    k.color(40, 40, 50),
                ]);

                if (tileType > 0) {
                    const tile = k.add([
                        k.rect(cellSize - 8, cellSize - 8, { radius: 4 }),
                        k.pos(x, y),
                        k.anchor("center"),
                        k.color(80, 80, 100),
                        k.area(),
                        { tileType, row, col, rotation: 0 },
                        "tile",
                    ]);

                    tiles[row][col] = tile;

                    // 線路を描画
                    drawTrack(tile, tileType, cellSize, currentLine.color);

                    // スタート・ゴールのラベル
                    if (tileType === 7) {
                        k.add([
                            k.text("S", { size: 20 }),
                            k.pos(x, y),
                            k.anchor("center"),
                            k.color(100, 255, 100),
                        ]);
                    } else if (tileType === 8) {
                        k.add([
                            k.text("G", { size: 20 }),
                            k.pos(x, y),
                            k.anchor("center"),
                            k.color(255, 100, 100),
                        ]);
                    }

                    // タップで回転（スタート・ゴール以外）
                    if (tileType !== 7 && tileType !== 8) {
                        tile.onClick(() => {
                            tile.rotation = (tile.rotation + 90) % 360;
                            tile.angle = tile.rotation;
                            moves++;
                            movesText.text = `タップ: ${moves}`;
                        });
                    }
                }
            }
        }

        // クリアチェックボタン
        const checkBtn = k.add([
            k.rect(160, 50, { radius: 10 }),
            k.pos(WIDTH / 2, HEIGHT - 100),
            k.anchor("center"),
            k.color(80, 180, 80),
            k.area(),
        ]);
        k.add([
            k.text("チェック！", { size: 24 }),
            k.pos(WIDTH / 2, HEIGHT - 100),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);

        checkBtn.onClick(() => {
            // 簡易クリア判定（実際は線路の接続をチェックすべきだが、簡略化）
            k.go("clear");
        });

        // 戻るボタン
        const backBtn = k.add([
            k.rect(80, 40, { radius: 8 }),
            k.pos(WIDTH - 100, HEIGHT - 40),
            k.color(100, 100, 100),
            k.area(),
        ]);
        k.add([
            k.text("もどる", { size: 18 }),
            k.pos(WIDTH - 60, HEIGHT - 28),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);
        backBtn.onClick(() => goToMenu());
    });

    // 線路を描画する関数
    function drawTrack(tile, type, size, color) {
        const x = tile.pos.x;
        const y = tile.pos.y;
        const trackWidth = 12;
        const halfSize = size / 2 - 8;

        if (type === 1 || type === 7 || type === 8) {
            // 直線（縦）
            k.add([
                k.rect(trackWidth, size - 16),
                k.pos(x, y),
                k.anchor("center"),
                k.color(...color),
            ]);
        } else if (type === 2) {
            // 直線（横）
            k.add([
                k.rect(size - 16, trackWidth),
                k.pos(x, y),
                k.anchor("center"),
                k.color(...color),
            ]);
        } else if (type >= 3 && type <= 6) {
            // カーブ（簡易的に2本の線で表現）
            k.add([
                k.rect(halfSize, trackWidth),
                k.pos(x + halfSize / 4, y),
                k.anchor("center"),
                k.color(...color),
            ]);
            k.add([
                k.rect(trackWidth, halfSize),
                k.pos(x, y + halfSize / 4),
                k.anchor("center"),
                k.color(...color),
            ]);
        }
    }

    // クリアシーン
    k.scene("clear", () => {
        k.add([
            k.rect(320, 250, { radius: 20 }),
            k.pos(WIDTH / 2, HEIGHT / 2),
            k.anchor("center"),
            k.color(0, 0, 0),
            k.opacity(0.85),
        ]);

        k.add([
            k.text("🎉 クリア！", { size: 40 }),
            k.pos(WIDTH / 2, HEIGHT / 2 - 60),
            k.anchor("center"),
            k.color(255, 215, 0),
        ]);

        k.add([
            k.text(`${moves}タップでクリア！`, { size: 28 }),
            k.pos(WIDTH / 2, HEIGHT / 2),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);

        // 次のレベルボタン
        const nextBtn = k.add([
            k.rect(150, 50, { radius: 10 }),
            k.pos(WIDTH / 2, HEIGHT / 2 + 70),
            k.anchor("center"),
            k.color(80, 200, 120),
            k.area(),
        ]);
        k.add([
            k.text("つぎへ", { size: 24 }),
            k.pos(WIDTH / 2, HEIGHT / 2 + 70),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);
        nextBtn.onClick(() => {
            currentLevel++;
            if (currentLevel > levels.length) currentLevel = 1;
            k.go("puzzle");
        });

        // 戻るボタン
        const backBtn = k.add([
            k.rect(80, 40, { radius: 8 }),
            k.pos(WIDTH - 100, HEIGHT - 60),
            k.color(100, 100, 100),
            k.area(),
        ]);
        k.add([
            k.text("もどる", { size: 18 }),
            k.pos(WIDTH - 60, HEIGHT - 48),
            k.anchor("center"),
            k.color(255, 255, 255),
        ]);
        backBtn.onClick(() => goToMenu());
    });

    k.go("puzzle");
}
