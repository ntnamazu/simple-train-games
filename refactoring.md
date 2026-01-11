# リファクタリング計画書

## 現状分析

### コードの概要
- **ファイル**: `js/main.js` (1361行)
- **構成**: 4つのミニゲームが1ファイルに集約
- **フレームワーク**: Kaboom.js (v3000.1.17) ⚠️ **メンテナンス終了**

### 主な課題

| カテゴリ | 深刻度 | 課題数 |
|---------|--------|--------|
| **ゲームエンジン** | **最高** | Kaboom.js がメンテナンス終了 |
| マジックナンバー | 中 | 多数 |
| コード重複 | 高 | 4箇所以上 |
| ファイル肥大化 | 高 | 1361行 |
| 変数命名 | 低 | 数箇所 |
| 未使用コード | 低 | なし |

---

## Phase 0: KaPlayへの移行（最優先）

### 背景

Kaboom.jsは2024年5月にReplitによるメンテナンスが終了しました。コミュニティフォークである**KaPlay**が後継として開発を継続しています。

> "Replit no longer maintains Kaboom. You may be interested in the community fork KaPlay."

### KaPlayとは

- Kaboom.jsの**完全互換フォーク**
- コミュニティ主導で活発に開発中
- 99.99%の互換性を目標（Kaboom v3000で作られたゲームがKaPlay v3001で動作）
- 新機能: 入力バインディング、レイヤー、ナビゲーションメッシュ、パーティクルシステムなど

### 移行方法

**変更箇所は1行のみ！**

```javascript
// 変更前 (index.html)
<script src="https://unpkg.com/kaboom@3000.1.17/dist/kaboom.mjs" type="module"></script>

// 変更後
<script src="https://unpkg.com/kaplay@3001/dist/kaplay.mjs" type="module"></script>
```

```javascript
// 変更前 (js/main.js)
import kaboom from "https://unpkg.com/kaboom@3000.1.17/dist/kaboom.mjs";

// 変更後
import kaplay from "https://unpkg.com/kaplay@3001/dist/kaplay.mjs";
```

### 互換性について

- `kaboom()` 関数は `kaplay()` のエイリアスとして引き続き動作
- 既存のAPIは全て互換性あり
- 破壊的変更なしを目標に開発

### 移行手順

1. `index.html` のCDN URLを変更
2. `js/main.js` のimport文を変更
3. （オプション）`kaboom()` を `kaplay()` に変更
4. E2Eテストで動作確認

### 参考リンク

- [KaPlay公式サイト](https://kaplayjs.com/)
- [移行ガイド](https://kaplayjs.com/docs/guides/migration-kaplay/)
- [GitHub Wiki - KaboomとKaPlayの関係](https://github.com/kaplayjs/kaplay/wiki/The-relation-of-kaplay-with-Kaboom)

---

## Phase 1: マジックナンバーの定数化

### 1.1 色定数の定義

**現状の問題点**:
```javascript
// 各所にRGB値が散在
k.color(135, 206, 235)  // 空色
k.color(70, 130, 180)   // スチールブルー
k.color(100, 149, 237)  // コーンフラワーブルー
k.color(60, 60, 80)     // ダークグレー
k.color(255, 215, 0)    // ゴールド
k.color(80, 200, 120)   // 成功グリーン
k.color(200, 80, 80)    // 失敗レッド
k.color(100, 100, 100)  // ボタングレー
```

**改善案**:
```javascript
const COLORS = {
    // 背景色
    SKY_BLUE: [135, 206, 235],
    STEEL_BLUE: [70, 130, 180],
    CORNFLOWER_BLUE: [100, 149, 237],
    DARK_GRAY: [60, 60, 80],

    // UI色
    GOLD: [255, 215, 0],
    SUCCESS_GREEN: [80, 200, 120],
    FAIL_RED: [200, 80, 80],
    BUTTON_GRAY: [100, 100, 100],
    WHITE: [255, 255, 255],

    // 電車関連
    WINDOW_BLUE: [200, 230, 255],
    OUTLINE_DARK: [50, 50, 50],
    PLATFORM_GRAY: [180, 180, 180],
};
```

### 1.2 サイズ・レイアウト定数の定義

**現状の問題点**:
```javascript
// フォントサイズがバラバラに散在
{ size: 32 }, { size: 28 }, { size: 24 }, { size: 20 }, { size: 18 }

// ボタンサイズも統一されていない
k.rect(80, 40, { radius: 8 })   // 戻るボタン
k.rect(150, 50, { radius: 10 }) // 次へボタン
k.rect(160, 50, { radius: 10 }) // チェックボタン
k.rect(280, 60, { radius: 12 }) // 選択肢ボタン
```

**改善案**:
```javascript
const SIZES = {
    // フォントサイズ
    FONT: {
        TITLE: 32,
        LARGE: 28,
        MEDIUM: 24,
        SMALL: 20,
        TINY: 18,
    },

    // ボタンサイズ
    BUTTON: {
        BACK: { width: 80, height: 40, radius: 8 },
        NEXT: { width: 150, height: 50, radius: 10 },
        CHECK: { width: 160, height: 50, radius: 10 },
        CHOICE: { width: 280, height: 60, radius: 12 },
    },

    // 電車サイズ
    TRAIN: {
        WIDTH: 180,
        HEIGHT: 70,
        WINDOW_WIDTH: 30,
        WINDOW_HEIGHT: 25,
    },
};
```

### 1.3 ゲーム設定値の定数化

**現状の問題点**:
```javascript
// ゲーム固有の設定値が関数内に埋め込まれている
const MAX_ROUNDS = 10;        // クイズ
let timeLeft = 30;            // 乗客ゲーム
trainSpeed = 5 + (round - 1) * 0.5;  // 停車ゲーム
if (trainSpeed > 12) trainSpeed = 12;
```

**改善案**:
```javascript
const GAME_CONFIG = {
    STOPPING: {
        INITIAL_SPEED: 5,
        SPEED_INCREMENT: 0.5,
        MAX_SPEED: 12,
        BRAKE_DECELERATION: 0.95,
        SCORE_THRESHOLDS: [
            { diff: 10, points: 100 },
            { diff: 30, points: 70 },
            { diff: 60, points: 40 },
            { diff: 100, points: 20 },
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
```

### 1.4 タイルタイプの列挙型化

**現状の問題点**:
```javascript
// マジックナンバーでタイルタイプを判定
if (tileType !== 7 && tileType !== 8)
if (tileType >= 3 && tileType <= 6)
if (level.grid[r][c] === 7)
```

**改善案**:
```javascript
const TILE_TYPES = {
    EMPTY: 0,
    STRAIGHT_VERTICAL: 1,
    STRAIGHT_HORIZONTAL: 2,
    CURVE_BOTTOM_RIGHT: 3,
    CURVE_BOTTOM_LEFT: 4,
    CURVE_TOP_LEFT: 5,
    CURVE_TOP_RIGHT: 6,
    START: 7,
    GOAL: 8,
};

// 使用例
if (tileType !== TILE_TYPES.START && tileType !== TILE_TYPES.GOAL)
```

### 1.5 方向定数の定義

**現状の問題点**:
```javascript
// コメントでしか方向がわからない
// 方向: 0=上, 1=右, 2=下, 3=左
const trackConnections = {
    1: [0, 2],       // 直線縦: 上下
    2: [1, 3],       // 直線横: 左右
};
```

**改善案**:
```javascript
const DIRECTIONS = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3,
};

const TRACK_CONNECTIONS = {
    [TILE_TYPES.STRAIGHT_VERTICAL]: [DIRECTIONS.UP, DIRECTIONS.DOWN],
    [TILE_TYPES.STRAIGHT_HORIZONTAL]: [DIRECTIONS.RIGHT, DIRECTIONS.LEFT],
    [TILE_TYPES.CURVE_BOTTOM_RIGHT]: [DIRECTIONS.RIGHT, DIRECTIONS.DOWN],
    // ...
};
```

---

## Phase 2: コード重複の解消

### 2.1 戻るボタンのコンポーネント化

**現状の問題点**:
同じ戻るボタンのコードが**8箇所**に存在。

```javascript
// 全ゲーム・全シーンで同じコードが繰り返されている
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
```

**改善案**:
```javascript
function createBackButton(x, y) {
    const btn = k.add([
        k.rect(SIZES.BUTTON.BACK.width, SIZES.BUTTON.BACK.height, {
            radius: SIZES.BUTTON.BACK.radius
        }),
        k.pos(x, y),
        k.color(...COLORS.BUTTON_GRAY),
        k.area(),
    ]);
    k.add([
        k.text("もどる", { size: SIZES.FONT.TINY }),
        k.pos(x + 40, y + 12),
        k.anchor("center"),
        k.color(...COLORS.WHITE),
    ]);
    btn.onClick(() => goToMenu());
    return btn;
}
```

### 2.2 結果画面のコンポーネント化

**現状の問題点**:
結果画面（黒い半透明背景 + メッセージ）が**4箇所**に存在。

```javascript
// クイズ、乗客ゲーム、パズルで同じパターン
k.add([
    k.rect(320, 250, { radius: 20 }),
    k.pos(WIDTH / 2, HEIGHT / 2),
    k.anchor("center"),
    k.color(0, 0, 0),
    k.opacity(0.85),
]);
```

**改善案**:
```javascript
function createResultOverlay(width = 320, height = 250) {
    return k.add([
        k.rect(width, height, { radius: 20 }),
        k.pos(k.width() / 2, k.height() / 2),
        k.anchor("center"),
        k.color(0, 0, 0),
        k.opacity(0.85),
    ]);
}
```

### 2.3 電車描画のコンポーネント化

**現状の問題点**:
電車の描画（本体 + 窓）が**3箇所**で類似コード。

```javascript
// 停車ゲーム、クイズ、乗客ゲームで似たコード
const train = k.add([
    k.rect(180, 70, { radius: 10 }),
    k.pos(x, y),
    k.color(...lineColor),
    k.outline(4, k.rgb(50, 50, 50)),
]);
for (let i = 0; i < 3; i++) {
    k.add([
        k.rect(30, 25),
        k.pos(x + 20 + i * 50, y + 10),
        k.color(200, 230, 255),
        k.outline(2, k.rgb(50, 50, 50)),
    ]);
}
```

**改善案**:
```javascript
function createTrain(x, y, color, windowCount = 3) {
    const train = k.add([
        k.rect(SIZES.TRAIN.WIDTH, SIZES.TRAIN.HEIGHT, { radius: 10 }),
        k.pos(x, y),
        k.color(...color),
        k.outline(4, k.rgb(...COLORS.OUTLINE_DARK)),
    ]);

    const windows = [];
    for (let i = 0; i < windowCount; i++) {
        const window = k.add([
            k.rect(SIZES.TRAIN.WINDOW_WIDTH, SIZES.TRAIN.WINDOW_HEIGHT),
            k.pos(x + 20 + i * 50, y + 10),
            k.color(...COLORS.WINDOW_BLUE),
            k.outline(2, k.rgb(...COLORS.OUTLINE_DARK)),
        ]);
        windows.push(window);
    }

    return { train, windows };
}
```

### 2.4 Kaboom初期化の共通化

**現状の問題点**:
各ゲームで同じ初期化コード。

```javascript
// 4つのゲームで同じ初期化
k = kaboom({
    canvas: document.getElementById('game-canvas'),
    width: window.innerWidth,
    height: window.innerHeight,
    background: [色が違うだけ],
    touchToMouse: true,
});
```

**改善案**:
```javascript
function initKaboom(backgroundColor) {
    return kaboom({
        canvas: document.getElementById('game-canvas'),
        width: window.innerWidth,
        height: window.innerHeight,
        background: backgroundColor,
        touchToMouse: true,
    });
}
```

---

## Phase 3: ファイル分割

### 3.1 提案するファイル構成

```
js/
├── main.js              # エントリーポイント（50行程度）
├── constants.js         # 定数定義（100行程度）
├── utils.js             # 共通ユーティリティ（100行程度）
├── components.js        # UIコンポーネント（150行程度）
└── games/
    ├── stopping.js      # ぴったりていしゃ（250行程度）
    ├── quiz.js          # ろせんカラークイズ（200行程度）
    ├── passenger.js     # じょうきゃくをのせろ（200行程度）
    └── puzzle.js        # ろせんパズル（400行程度）
```

### 3.2 各ファイルの責務

#### `main.js` (エントリーポイント)
```javascript
// ゲーム切り替えとメニュー制御のみ
import { startStoppingGame } from './games/stopping.js';
import { startQuizGame } from './games/quiz.js';
import { startPassengerGame } from './games/passenger.js';
import { startPuzzleGame } from './games/puzzle.js';

let k = null;

window.startGame = function(gameType) { ... };
window.goToMenu = function() { ... };
```

#### `constants.js` (定数)
```javascript
// 全定数を集約
export const TRAIN_LINES = { ... };
export const COLORS = { ... };
export const SIZES = { ... };
export const GAME_CONFIG = { ... };
export const TILE_TYPES = { ... };
export const DIRECTIONS = { ... };
```

#### `utils.js` (ユーティリティ)
```javascript
// 汎用関数
export function getRandomLine() { ... }
export function shuffle(array) { ... }
export function initKaboom(backgroundColor) { ... }
```

#### `components.js` (UIコンポーネント)
```javascript
// 再利用可能なUI部品
export function createBackButton(k, x, y) { ... }
export function createResultOverlay(k) { ... }
export function createTrain(k, x, y, color) { ... }
export function createActionButton(k, text, x, y, color) { ... }
```

#### `games/*.js` (各ゲーム)
```javascript
// 各ゲーム固有のロジック
import { COLORS, GAME_CONFIG } from '../constants.js';
import { createBackButton, createTrain } from '../components.js';

export function startStoppingGame(k) { ... }
```

---

## Phase 4: 変数名・関数名の見直し

### 4.1 曖昧な変数名の改善

| 現状 | 改善案 | 理由 |
|------|--------|------|
| `k` | `game` または `kaboom` | Kaboomインスタンスであることを明示 |
| `w` | `windowObj` | 何を指すか不明確 |
| `b` | `button` | 省略しすぎ |
| `r`, `c` | `row`, `col` | ループ変数でも意味を持たせる |
| `dr`, `dc` | `deltaRow`, `deltaCol` | 意味を明確に |

### 4.2 関数名の改善

| 現状 | 改善案 | 理由 |
|------|--------|------|
| `showResult` | `showRoundResult` | 何の結果か明確に |
| `spawnPassenger` | `createPassenger` | Kaboomの命名規則に合わせる |
| `checkConnection` | `isPathConnected` | bool を返すことを明示 |
| `getNeighbor` | `getAdjacentCell` | 何の隣か明確に |
| `oppositeDir` | `getOppositeDirection` | 動詞を含める |

---

## Phase 5: その他の改善

### 5.1 エラーハンドリングの改善

**現状の問題点**:
```javascript
try {
    k.quit();
} catch (e) {
    // エラーを無視
}
```

**改善案**:
```javascript
try {
    k.quit();
} catch (e) {
    console.warn('Kaboom cleanup warning:', e.message);
}
```

### 5.2 コメントの整理

**現状の問題点**:
- 一部のコメントが古い実装と合っていない可能性
- 日本語/英語が混在

**改善案**:
- コメントは日本語で統一（子供向けプロジェクトなので）
- 関数の冒頭にJSDoc形式でドキュメントを追加

```javascript
/**
 * 線路の接続状態をチェックする
 * @param {Array} tiles - タイルの2次元配列
 * @param {Object} level - レベルデータ
 * @param {number} rows - 行数
 * @param {number} cols - 列数
 * @returns {boolean} スタートからゴールまで繋がっていればtrue
 */
function isPathConnected(tiles, level, rows, cols) { ... }
```

### 5.3 パフォーマンス改善の検討

**注意**: 現時点で大きなパフォーマンス問題はないが、将来的に検討すべき点:

1. **オブジェクトプール**: 乗客ゲームで頻繁に生成・破棄される乗客オブジェクト
2. **イベントリスナーの整理**: シーン切り替え時のクリーンアップ

---

## 実装優先順位

| 優先度 | Phase | 作業内容 | 見積もり工数 |
|--------|-------|----------|-------------|
| **最高** | **0** | **KaPlayへの移行** | **極小（2ファイル変更のみ）** |
| 高 | 1.4, 1.5 | タイルタイプ・方向の定数化 | 小 |
| 高 | 2.1 | 戻るボタンのコンポーネント化 | 小 |
| 中 | 1.1, 1.2 | 色・サイズの定数化 | 中 |
| 中 | 2.2, 2.3 | 結果画面・電車のコンポーネント化 | 中 |
| 中 | 3 | ファイル分割 | 大 |
| 低 | 4 | 変数名の見直し | 小 |
| 低 | 5 | その他改善 | 小 |

---

## リスクと注意点

1. **ESModuleの依存関係**: ファイル分割時にimport/exportの順序に注意
2. **Kaboomインスタンスの共有**: 分割後も`k`(Kaboomインスタンス)の参照を正しく渡す必要あり
3. **テストの維持**: リファクタリング後も既存のE2Eテストが通ることを確認
4. **段階的な実施**: 一度に大きく変更せず、Phase ごとにテスト実行

---

## 完了条件

- [ ] **KaPlayへの移行が完了している**
- [ ] 全ての定数がconstants.jsに集約されている
- [ ] 重複コードが共通関数に抽出されている
- [ ] 各ファイルが300行以下になっている
- [ ] 既存の13個のテストが全て通過する
- [ ] コードレビューで可読性の向上が確認できる
