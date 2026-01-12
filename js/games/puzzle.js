// 🔀 路線パズル

import { COLORS, GAME_CONFIG, TILE_TYPES, DIRECTIONS } from '../constants.js';
import { initKaplay, getGame, getRandomLine } from '../utils.js';
import { createBackButton, createResultOverlay } from '../components.js';

/**
 * 路線パズルゲームを開始
 */
export function startPuzzleGame() {
    // KaPlay初期化（再利用）
    initKaplay(COLORS.DARK_GRAY);
    const game = getGame();

    const WIDTH = game.width();
    const HEIGHT = game.height();

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

    game.scene("puzzle", () => {
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
        game.add([
            game.text(`レベル ${currentLevel}`, { size: 32 }),
            game.pos(WIDTH / 2, 40),
            game.anchor("center"),
            game.color(255, 255, 255),
        ]);

        // 移動回数
        const movesText = game.add([
            game.text(`タップ: ${moves}`, { size: 24 }),
            game.pos(20, 30),
            game.color(255, 255, 255),
        ]);

        // 説明
        game.add([
            game.text("せんろをタップしてまわそう！", { size: 20 }),
            game.pos(WIDTH / 2, 80),
            game.anchor("center"),
            game.color(200, 200, 200),
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
                game.add([
                    game.rect(cellSize - 4, cellSize - 4, { radius: 4 }),
                    game.pos(x, y),
                    game.anchor("center"),
                    game.color(40, 40, 50),
                ]);

                if (tileType > 0) {
                    const tile = game.add([
                        game.rect(cellSize - 8, cellSize - 8, { radius: 4 }),
                        game.pos(x, y),
                        game.anchor("center"),
                        game.color(80, 80, 100),
                        game.area(),
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
                            tile.color = game.rgb(brightness, brightness, 100 + (tile.rotation / 90) * 10);
                            moves++;
                            movesText.text = `タップ: ${moves}`;
                        });
                    }
                }
            }
        }

        // クリアチェックボタン
        const checkBtn = game.add([
            game.rect(160, 50, { radius: 10 }),
            game.pos(WIDTH / 2, HEIGHT - 100),
            game.anchor("center"),
            game.color(80, 180, 80),
            game.area(),
        ]);
        game.add([
            game.text("チェック！", { size: 24 }),
            game.pos(WIDTH / 2, HEIGHT - 100),
            game.anchor("center"),
            game.color(255, 255, 255),
        ]);

        checkBtn.onClick(() => {
            // 線路の接続をチェック
            if (isPathConnected(tiles, level, gridRows, gridCols)) {
                game.go("clear");
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

            const bg = game.add([
                game.rect(280, 80, { radius: 12 }),
                game.pos(WIDTH / 2, HEIGHT / 2),
                game.anchor("center"),
                game.color(200, 80, 80),
                game.opacity(0.9),
            ]);
            failMessage.push(bg);

            const text = game.add([
                game.text("❌ つながってないよ！", { size: 24 }),
                game.pos(WIDTH / 2, HEIGHT / 2),
                game.anchor("center"),
                game.color(255, 255, 255),
            ]);
            failMessage.push(text);

            // 2秒後にメッセージを消す
            game.wait(2, () => {
                if (failMessage) {
                    failMessage.forEach(obj => obj.destroy());
                    failMessage = null;
                }
            });
        }

        /**
         * 線路の接続状態をチェックする（BFSで経路探索）
         * @param {Array} tiles - タイルの2次元配列
         * @param {Object} level - レベルデータ
         * @param {number} rows - 行数
         * @param {number} cols - 列数
         * @returns {boolean} スタートからゴールまで繋がっていればtrue
         */
        function isPathConnected(tiles, level, rows, cols) {
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
            function getOppositeDirection(dir) {
                return (dir + 2) % 4;
            }

            // 方向に応じた隣接セルを取得
            function getAdjacentCell(row, col, dir) {
                const deltas = [
                    [-1, 0],  // 上
                    [0, 1],   // 右
                    [1, 0],   // 下
                    [0, -1],  // 左
                ];
                const [deltaRow, deltaCol] = deltas[dir];
                return [row + deltaRow, col + deltaCol];
            }

            // スタート位置を見つける
            let startRow = -1, startCol = -1;
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    if (level.grid[row][col] === TILE_TYPES.START) {
                        startRow = row;
                        startCol = col;
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
                    const [neighborRow, neighborCol] = getAdjacentCell(row, col, dir);

                    // 範囲チェック
                    if (neighborRow < 0 || neighborRow >= rows || neighborCol < 0 || neighborCol >= cols) continue;

                    const key = `${neighborRow},${neighborCol}`;
                    if (visited.has(key)) continue;

                    const neighborTile = tiles[neighborRow]?.[neighborCol];
                    if (!neighborTile) continue;

                    // 隣接タイルが反対方向に接続しているかチェック
                    const neighborConnections = getConnections(neighborTile);
                    if (neighborConnections.includes(getOppositeDirection(dir))) {
                        visited.add(key);
                        queue.push([neighborRow, neighborCol]);
                    }
                }
            }

            return false;
        }

        // 戻るボタン
        createBackButton(WIDTH - 100, HEIGHT - 40);
    });

    /**
     * 線路を描画する
     * @param {Object} tile - タイルオブジェクト
     * @param {number} type - タイルタイプ（TILE_TYPES定数）
     * @param {number} size - セルサイズ
     * @param {number[]} color - 路線カラー [R, G, B]
     * @returns {Array} 描画された線路パーツの配列
     */
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
            const track = game.add([
                game.rect(size / 3, trackWidth),
                game.pos(x + size / 3, y),
                game.anchor("center"),
                game.color(...color),
            ]);
            trackParts.push(track);
        } else if (type === TILE_TYPES.GOAL) {
            // ゴール駅
            drawStation(x, y, size, color, "とうちゃく");
            // 左方向に線路を伸ばす
            const track = game.add([
                game.rect(size / 3, trackWidth),
                game.pos(x - size / 3, y),
                game.anchor("center"),
                game.color(...color),
            ]);
            trackParts.push(track);
        } else if (type === TILE_TYPES.STRAIGHT_VERTICAL) {
            // 直線（縦）
            const track = game.add([
                game.rect(trackWidth, size - 16),
                game.pos(x, y),
                game.anchor("center"),
                game.color(...color),
                game.rotate(0),
            ]);
            trackParts.push(track);
        } else if (type === TILE_TYPES.STRAIGHT_HORIZONTAL) {
            // 直線（横）
            const track = game.add([
                game.rect(size - 16, trackWidth),
                game.pos(x, y),
                game.anchor("center"),
                game.color(...color),
                game.rotate(0),
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
            const track1 = game.add([
                game.rect(halfSize, trackWidth),
                game.pos(x + hOffset, y),
                game.anchor("center"),
                game.color(...color),
                game.rotate(0),
            ]);
            // 縦線
            const track2 = game.add([
                game.rect(trackWidth, halfSize),
                game.pos(x, y + vOffset),
                game.anchor("center"),
                game.color(...color),
                game.rotate(0),
            ]);
            trackParts.push(track1, track2);
        }

        return trackParts;
    }

    /**
     * 駅を描画する
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} size - セルサイズ
     * @param {number[]} color - 路線カラー [R, G, B]
     * @param {string} label - 駅名ラベル（"しゅっぱつ" / "とうちゃく"）
     */
    function drawStation(x, y, size, color, label) {
        const stationSize = size * 0.6;

        // ホーム（灰色の四角）
        game.add([
            game.rect(stationSize, stationSize * 0.7, { radius: 4 }),
            game.pos(x, y),
            game.anchor("center"),
            game.color(180, 180, 180),
            game.outline(2, game.rgb(100, 100, 100)),
        ]);

        // 屋根（路線カラー）
        game.add([
            game.rect(stationSize * 0.8, stationSize * 0.25, { radius: 2 }),
            game.pos(x, y - stationSize * 0.3),
            game.anchor("center"),
            game.color(...color),
        ]);

        // 駅名ラベル
        game.add([
            game.text(label, { size: Math.floor(size * 0.13) }),
            game.pos(x, y + stationSize * 0.1),
            game.anchor("center"),
            game.color(50, 50, 50),
        ]);
    }

    // クリアシーン
    game.scene("clear", () => {
        createResultOverlay();

        game.add([
            game.text("🎉 クリア！", { size: 40 }),
            game.pos(WIDTH / 2, HEIGHT / 2 - 60),
            game.anchor("center"),
            game.color(255, 215, 0),
        ]);

        game.add([
            game.text(`${moves}タップでクリア！`, { size: 28 }),
            game.pos(WIDTH / 2, HEIGHT / 2),
            game.anchor("center"),
            game.color(255, 255, 255),
        ]);

        // 次のレベルボタン
        const nextBtn = game.add([
            game.rect(150, 50, { radius: 10 }),
            game.pos(WIDTH / 2, HEIGHT / 2 + 70),
            game.anchor("center"),
            game.color(80, 200, 120),
            game.area(),
        ]);
        game.add([
            game.text("つぎへ", { size: 24 }),
            game.pos(WIDTH / 2, HEIGHT / 2 + 70),
            game.anchor("center"),
            game.color(255, 255, 255),
        ]);
        nextBtn.onClick(() => {
            currentLevel++;
            if (currentLevel > levels.length) currentLevel = 1;
            game.go("puzzle");
        });

        // 戻るボタン
        createBackButton(WIDTH - 100, HEIGHT - 60);
    });

    game.go("puzzle");
}
