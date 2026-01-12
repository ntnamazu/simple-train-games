// 🔀 路線パズル

import { COLORS, GAME_CONFIG, TILE_TYPES, DIRECTIONS } from '../constants.js';
import { initKaplay, getK, getRandomLine } from '../utils.js';
import { createBackButton, createResultOverlay } from '../components.js';

/**
 * 路線パズルゲームを開始
 */
export function startPuzzleGame() {
    // KaPlay初期化（再利用）
    initKaplay(COLORS.DARK_GRAY);
    const k = getK();

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
        createBackButton(WIDTH - 100, HEIGHT - 40);
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
        createResultOverlay();

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
        createBackButton(WIDTH - 100, HEIGHT - 60);
    });

    k.go("puzzle");
}
