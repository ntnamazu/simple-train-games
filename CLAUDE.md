# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

子供向けの電車テーマのミニゲーム集。Kaboom.js（ブラウザゲームエンジン）を使用した4つのゲームを収録。

## Common Commands

### Development Server
```bash
# Docker (推奨)
docker compose up

# Python 
python3 -m http.server 8080
```
ブラウザで http://localhost:8080 を開く

### Testing
```bash
# Docker環境でテスト (推奨)
docker compose run test

# テスト実行（ローカルサーバーを自動起動）
npm test

# ブラウザ表示付きでテスト実行
npm run test:headed

# 特定のテストだけ実行
npx playwright test -g "テスト名"
```

## Architecture

### Tech Stack
- **Game Engine**: Kaboom.js (CDN経由でESMインポート)
- **Server**: Python http.server (開発用) / nginx (Docker)
- **Testing**: Playwright

### Key Files
- `index.html` - メニュー画面、ゲーム選択UI
- `js/main.js` - 全ゲームロジック（4ゲーム全て1ファイル）
- `css/style.css` - メニュー画面のスタイル
- `tests/games.spec.js` - E2Eテスト

### Game Structure (js/main.js)
グローバル変数 `k` でKaboomインスタンスを管理。各ゲームは独立した関数:
- `startStoppingGame()` - ぴったりていしゃ
- `startQuizGame()` - ろせんカラークイズ
- `startPassengerGame()` - じょうきゃくをのせろ
- `startPuzzleGame()` - ろせんパズル

`window.startGame(gameType)` と `window.goToMenu()` がHTMLから呼び出されるエントリーポイント。

### Train Line Data
`TRAIN_LINES` 定数に路線情報（名前とRGBカラー）を定義。新路線追加時はここに追記。

### Test Environment
- ローカル: `playwright.config.js` が自動でPython HTTPサーバーを起動
- CI: `docker-compose.yaml` でgameサービスに接続（`CI=true`環境変数で判定）

### デバッグの手順

- まずは不具合を再現するテストコードを作ること
- そしてその次に、そのテストをクリアするように本体のコードを修正すること