// 🚃 でんしゃミニゲーム - メインスクリプト

import kaplay from "https://unpkg.com/kaplay@3001/dist/kaplay.mjs";

// 後方互換性のためのエイリアス
const kaboom = kaplay;

// =====================================================
// 定数定義
// =====================================================

// タイルタイプ（ろせんパズル用）
const TILE_TYPES = {
    EMPTY: 0,
    STRAIGHT_VERTICAL: 1,   // 直線（縦）
    STRAIGHT_HORIZONTAL: 2, // 直線（横）
    CURVE_BOTTOM_RIGHT: 3,  // カーブ（右下）
    CURVE_BOTTOM_LEFT: 4,   // カーブ（左下）
    CURVE_TOP_LEFT: 5,      // カーブ（左上）
    CURVE_TOP_RIGHT: 6,     // カーブ（右上）
    START: 7,               // スタート駅
    GOAL: 8,                // ゴール駅
};

// 方向定数
const DIRECTIONS = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3,
};

// 色定数
const COLORS = {
    // 背景色
    SKY_BLUE: [135, 206, 235],
    STEEL_BLUE: [70, 130, 180],
    CORNFLOWER_BLUE: [100, 149, 237],
    DARK_GRAY: [60, 60, 80],

    // UI色
    WHITE: [255, 255, 255],
    BLACK: [0, 0, 0],
    GOLD: [255, 215, 0],
    SUCCESS_GREEN: [80, 200, 120],
    FAIL_RED: [200, 80, 80],
    BUTTON_GRAY: [100, 100, 100],

    // 電車・線路関連
    WINDOW_BLUE: [200, 230, 255],
    OUTLINE_DARK: [50, 50, 50],
    GROUND_GRAY: [100, 100, 100],
    RAIL_GRAY: [80, 80, 80],
    PLATFORM_GRAY: [180, 180, 180],
    TILE_BG: [40, 40, 50],
    TILE_SURFACE: [80, 80, 100],
};

// フォントサイズ
const FONT_SIZES = {
    TITLE: 32,
    LARGE: 28,
    MEDIUM: 24,
    SMALL: 20,
    TINY: 18,
};

// ボタンサイズ
const BUTTON_SIZES = {
    BACK: { width: 80, height: 40, radius: 8 },
    ACTION: { width: 150, height: 50, radius: 10 },
    CHECK: { width: 160, height: 50, radius: 10 },
    CHOICE: { width: 280, height: 60, radius: 12 },
};

// ゲーム設定
const GAME_CONFIG = {
    STOPPING: {
        INITIAL_SPEED: 5,
        SPEED_INCREMENT: 0.5,
        MAX_SPEED: 12,
        BRAKE_DECELERATION: 0.95,
        SCORE_THRESHOLDS: [
            { maxDiff: 10, points: 100 },
            { maxDiff: 30, points: 70 },
            { maxDiff: 60, points: 40 },
            { maxDiff: 100, points: 20 },
        ],
    },
    QUIZ: {
        MAX_ROUNDS: 10,
        POINTS_PER_CORRECT: 10,
        NEXT_DELAY: 1.5,
    },
    PASSENGER: {
        TIME_LIMIT: 30,
        SPAWN_INTERVAL: 1,
    },
    PUZZLE: {
        TRACK_WIDTH: 12,
        FAIL_MESSAGE_DURATION: 2,
    },
};

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

// KaPlayインスタンスを初期化または再利用する
function initKaplay(backgroundColor) {
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
        // インスタンスは破棄せず、オブジェクトだけ削除
        try {
            k.destroyAll();
        } catch (e) {
            // エラーを無視
        }
    }
    document.getElementById('game-canvas').classList.remove('active');
    document.getElementById('menu-screen').classList.remove('hidden');
};

// =====================================================
// 🛑 ぴったり停車ゲーム
// =====================================================
function startStoppingGame() {
    // KaPlay初期化（再利用）
    initKaplay(COLORS.SKY_BLUE);

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
            // ゲームが終了している場合は何もしない
            if (!k) return;

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

// =====================================================
// ❓ 路線カラークイズ
// =====================================================
function startQuizGame() {
    // KaPlay初期化（再利用）
    initKaplay(COLORS.STEEL_BLUE);

    const WIDTH = k.width();
    const HEIGHT = k.height();

    let score = 0;
    let round = 1;
    const MAX_ROUNDS = GAME_CONFIG.QUIZ.MAX_ROUNDS;

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
        let answered = false;

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
                // 既に回答済みなら何もしない
                if (answered) return;
                answered = true;

                const isCorrect = choiceKey === correctKey;

                if (isCorrect) {
                    btn.color = k.rgb(100, 200, 100);
                    score += GAME_CONFIG.QUIZ.POINTS_PER_CORRECT;
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
                k.wait(GAME_CONFIG.QUIZ.NEXT_DELAY, () => {
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
    // KaPlay初期化（再利用）
    initKaplay(COLORS.CORNFLOWER_BLUE);

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
            if (gameOver || !k) return;

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
            if (gameOver || !k) return;
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
    // KaPlay初期化（再利用）
    initKaplay(COLORS.DARK_GRAY);

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

                    // 線路を描画（トラックパーツを受け取る）
                    let trackParts = drawTrack(tile, tileType, cellSize, currentLine.color);

                    // タップで回転（スタート・ゴール以外）
                    if (tileType !== TILE_TYPES.START && tileType !== TILE_TYPES.GOAL) {
                        tile.onClick(() => {
                            tile.rotation = (tile.rotation + 90) % 360;

                            // 回転に応じて新しいタイルタイプを計算（カーブの場合）
                            if (tileType >= TILE_TYPES.CURVE_BOTTOM_RIGHT && tileType <= TILE_TYPES.CURVE_TOP_RIGHT) {
                                // カーブは回転で別のカーブタイプに変わる
                                const rotationSteps = tile.rotation / 90;
                                tile.tileType = TILE_TYPES.CURVE_BOTTOM_RIGHT + ((tileType - TILE_TYPES.CURVE_BOTTOM_RIGHT + rotationSteps) % 4);
                            }

                            // 古い線路パーツを削除
                            trackParts.forEach(part => part.destroy());

                            // 新しい線路パーツを描画
                            trackParts = drawTrack(tile, tile.tileType, cellSize, currentLine.color);

                            // タイルの色を少し変えて回転したことを視覚的に示す
                            const brightness = 80 + (tile.rotation / 90) * 10;
                            tile.color = k.rgb(brightness, brightness, 100 + (tile.rotation / 90) * 10);
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
            // 線路の接続をチェック
            if (checkConnection(tiles, level, gridRows, gridCols)) {
                k.go("clear");
            } else {
                // 失敗メッセージを表示
                showFailMessage();
            }
        });

        // 失敗メッセージを表示する関数
        let failMessage = null;
        function showFailMessage() {
            // 既存のメッセージがあれば削除
            if (failMessage) {
                failMessage.forEach(obj => obj.destroy());
            }
            failMessage = [];

            const bg = k.add([
                k.rect(280, 80, { radius: 12 }),
                k.pos(WIDTH / 2, HEIGHT / 2),
                k.anchor("center"),
                k.color(200, 80, 80),
                k.opacity(0.9),
            ]);
            failMessage.push(bg);

            const text = k.add([
                k.text("❌ つながってないよ！", { size: 24 }),
                k.pos(WIDTH / 2, HEIGHT / 2),
                k.anchor("center"),
                k.color(255, 255, 255),
            ]);
            failMessage.push(text);

            // 2秒後にメッセージを消す
            k.wait(2, () => {
                if (failMessage) {
                    failMessage.forEach(obj => obj.destroy());
                    failMessage = null;
                }
            });
        }

        // 線路接続チェック関数
        function checkConnection(tiles, level, rows, cols) {
            // 各タイプの接続方向を定義（回転0度時）
            const trackConnections = {
                [TILE_TYPES.STRAIGHT_VERTICAL]: [DIRECTIONS.UP, DIRECTIONS.DOWN],
                [TILE_TYPES.STRAIGHT_HORIZONTAL]: [DIRECTIONS.RIGHT, DIRECTIONS.LEFT],
                [TILE_TYPES.CURVE_BOTTOM_RIGHT]: [DIRECTIONS.RIGHT, DIRECTIONS.DOWN],
                [TILE_TYPES.CURVE_BOTTOM_LEFT]: [DIRECTIONS.DOWN, DIRECTIONS.LEFT],
                [TILE_TYPES.CURVE_TOP_LEFT]: [DIRECTIONS.UP, DIRECTIONS.LEFT],
                [TILE_TYPES.CURVE_TOP_RIGHT]: [DIRECTIONS.UP, DIRECTIONS.RIGHT],
                [TILE_TYPES.START]: [DIRECTIONS.RIGHT],
                [TILE_TYPES.GOAL]: [DIRECTIONS.LEFT],
            };

            // 回転を考慮した接続方向を取得
            function getConnections(tile) {
                if (!tile) return [];
                const baseConnections = trackConnections[tile.tileType] || [];
                // カーブは tileType 自体が回転で変わるので rotation は考慮しない
                // 直線は rotation で向きが変わる
                if (tile.tileType >= TILE_TYPES.CURVE_BOTTOM_RIGHT && tile.tileType <= TILE_TYPES.CURVE_TOP_RIGHT) {
                    return baseConnections;
                }
                const rotationSteps = (tile.rotation / 90) % 4;
                return baseConnections.map(dir => (dir + rotationSteps) % 4);
            }

            // 方向の反対を取得
            function oppositeDir(dir) {
                return (dir + 2) % 4;
            }

            // 方向に応じた隣接セルを取得
            function getNeighbor(row, col, dir) {
                const deltas = [
                    [-1, 0],  // 上
                    [0, 1],   // 右
                    [1, 0],   // 下
                    [0, -1],  // 左
                ];
                const [dr, dc] = deltas[dir];
                return [row + dr, col + dc];
            }

            // スタート位置を見つける
            let startRow = -1, startCol = -1;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (level.grid[r][c] === TILE_TYPES.START) {
                        startRow = r;
                        startCol = c;
                        break;
                    }
                }
                if (startRow >= 0) break;
            }

            if (startRow < 0) return false;

            // BFSで経路探索
            const visited = new Set();
            const queue = [[startRow, startCol]];
            visited.add(`${startRow},${startCol}`);

            while (queue.length > 0) {
                const [row, col] = queue.shift();
                const tile = tiles[row]?.[col];
                if (!tile) continue;

                // ゴールに到達したらクリア
                if (tile.tileType === TILE_TYPES.GOAL) {
                    return true;
                }

                const connections = getConnections(tile);

                for (const dir of connections) {
                    const [nRow, nCol] = getNeighbor(row, col, dir);

                    // 範囲チェック
                    if (nRow < 0 || nRow >= rows || nCol < 0 || nCol >= cols) continue;

                    const key = `${nRow},${nCol}`;
                    if (visited.has(key)) continue;

                    const neighborTile = tiles[nRow]?.[nCol];
                    if (!neighborTile) continue;

                    // 隣接タイルが反対方向に接続しているかチェック
                    const neighborConnections = getConnections(neighborTile);
                    if (neighborConnections.includes(oppositeDir(dir))) {
                        visited.add(key);
                        queue.push([nRow, nCol]);
                    }
                }
            }

            return false;
        }

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

    // 線路を描画する関数（タイルに紐づくトラックパーツを返す）
    function drawTrack(tile, type, size, color) {
        const x = tile.pos.x;
        const y = tile.pos.y;
        const trackWidth = GAME_CONFIG.PUZZLE.TRACK_WIDTH;
        const halfSize = size / 2 - 8;
        const trackParts = [];

        if (type === TILE_TYPES.START) {
            // スタート駅
            drawStation(x, y, size, color, "しゅっぱつ");
            // 右方向に線路を伸ばす
            const track = k.add([
                k.rect(size / 3, trackWidth),
                k.pos(x + size / 3, y),
                k.anchor("center"),
                k.color(...color),
            ]);
            trackParts.push(track);
        } else if (type === TILE_TYPES.GOAL) {
            // ゴール駅
            drawStation(x, y, size, color, "とうちゃく");
            // 左方向に線路を伸ばす
            const track = k.add([
                k.rect(size / 3, trackWidth),
                k.pos(x - size / 3, y),
                k.anchor("center"),
                k.color(...color),
            ]);
            trackParts.push(track);
        } else if (type === TILE_TYPES.STRAIGHT_VERTICAL) {
            // 直線（縦）
            const track = k.add([
                k.rect(trackWidth, size - 16),
                k.pos(x, y),
                k.anchor("center"),
                k.color(...color),
                k.rotate(0),
            ]);
            trackParts.push(track);
        } else if (type === TILE_TYPES.STRAIGHT_HORIZONTAL) {
            // 直線（横）
            const track = k.add([
                k.rect(size - 16, trackWidth),
                k.pos(x, y),
                k.anchor("center"),
                k.color(...color),
                k.rotate(0),
            ]);
            trackParts.push(track);
        } else if (type >= TILE_TYPES.CURVE_BOTTOM_RIGHT && type <= TILE_TYPES.CURVE_TOP_RIGHT) {
            // カーブ（タイプごとに正しい位置に描画）
            const curveOffset = halfSize / 4;
            let hOffset = 0, vOffset = 0;

            if (type === TILE_TYPES.CURVE_BOTTOM_RIGHT) {
                // 右下カーブ: 右に横線、下に縦線
                hOffset = curveOffset;
                vOffset = curveOffset;
            } else if (type === TILE_TYPES.CURVE_BOTTOM_LEFT) {
                // 左下カーブ: 左に横線、下に縦線
                hOffset = -curveOffset;
                vOffset = curveOffset;
            } else if (type === TILE_TYPES.CURVE_TOP_LEFT) {
                // 左上カーブ: 左に横線、上に縦線
                hOffset = -curveOffset;
                vOffset = -curveOffset;
            } else if (type === TILE_TYPES.CURVE_TOP_RIGHT) {
                // 右上カーブ: 右に横線、上に縦線
                hOffset = curveOffset;
                vOffset = -curveOffset;
            }

            // 横線
            const track1 = k.add([
                k.rect(halfSize, trackWidth),
                k.pos(x + hOffset, y),
                k.anchor("center"),
                k.color(...color),
                k.rotate(0),
            ]);
            // 縦線
            const track2 = k.add([
                k.rect(trackWidth, halfSize),
                k.pos(x, y + vOffset),
                k.anchor("center"),
                k.color(...color),
                k.rotate(0),
            ]);
            trackParts.push(track1, track2);
        }

        return trackParts;
    }

    // 駅を描画する関数
    function drawStation(x, y, size, color, label) {
        const stationSize = size * 0.6;

        // ホーム（灰色の四角）
        k.add([
            k.rect(stationSize, stationSize * 0.7, { radius: 4 }),
            k.pos(x, y),
            k.anchor("center"),
            k.color(180, 180, 180),
            k.outline(2, k.rgb(100, 100, 100)),
        ]);

        // 屋根（路線カラー）
        k.add([
            k.rect(stationSize * 0.8, stationSize * 0.25, { radius: 2 }),
            k.pos(x, y - stationSize * 0.3),
            k.anchor("center"),
            k.color(...color),
        ]);

        // 駅名ラベル
        k.add([
            k.text(label, { size: Math.floor(size * 0.13) }),
            k.pos(x, y + stationSize * 0.1),
            k.anchor("center"),
            k.color(50, 50, 50),
        ]);
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
