# 🚃 でんしゃミニゲーム

子供向けの電車テーマのミニゲーム集です。
山手線・京浜東北線・中央線・総武線が登場！

## 🎮 収録ゲーム

| ゲーム | 内容 | 状態 |
|--------|------|------|
| 🛑 ぴったりていしゃ | 駅の停止線にピッタリ止めよう！ | ✅ |
| ❓ ろせんカラークイズ | 電車の色を見て何線か当てよう！ | ✅ |
| 👥 じょうきゃくをのせろ！ | 乗客をタップして電車に乗せよう！ | ✅ |
| 🔀 ろせんパズル | 線路をタップして回転させてゴールへ導こう！ | ✅ |

## 🚀 起動方法

### Docker（おすすめ）

```bash
docker compose up
```

ブラウザで http://localhost:8080 を開く

### Python

```bash
python3 -m http.server 8080
```

ブラウザで http://localhost:8080 を開く

## 📱 iPadで遊ぶ

1. PCとiPadを同じWi-Fiに接続
2. PCのIPアドレスを確認（`ip addr` や `ifconfig`）
3. iPadのSafariで `http://[PCのIP]:8080` にアクセス

## 🛠️ 技術スタック

- **ゲームエンジン**: [Kaboom.js](https://kaboomjs.com/)
- **サーバー**: nginx (Docker)
- **対応デバイス**: PC / タブレット（タッチ対応）

## 📁 ファイル構成

```
train-minigames/
├── index.html          # メインメニュー
├── css/
│   └── style.css       # スタイル
├── js/
│   └── main.js         # ゲームロジック
├── assets/             # 画像・音声（将来用）
├── Dockerfile
├── docker-compose.yaml
└── README.md
```

## 🎨 カスタマイズ

### 路線を追加する

`js/main.js` の `TRAIN_LINES` に追加：

```javascript
const TRAIN_LINES = {
    yamanote: { name: "山手線", color: [128, 194, 65] },
    // 新しい路線を追加！
    tokyu: { name: "東急東横線", color: [255, 0, 0] },
};
```

## 📝 ライセンス

個人利用・教育目的で自由にお使いください。
