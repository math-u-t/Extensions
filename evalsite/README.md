# EvalSite - Privacy Fingerprint Analyzer

**数学的に厳密なブラウザフィンガープリント可視化ツール**

## 📊 概要

EvalSiteは、ブラウザフィンガープリントと通信データを情報理論に基づいて定量評価し、「あなたがどれだけ特定されやすいか」を可視化するChrome拡張機能です。

### 数学的基盤

- **情報エントロピー (Shannon Entropy)**: 各識別要素の情報量をbits単位で評価
- **一意性確率**: `P(unique) = min(1, 2^entropy / 5×10^9)`
- **Panopticlick論文**: EFFの研究データに基づくエントロピー推定値を使用


## 🔧 インストール方法

### 1. ファイル構成

以下のファイルを同じフォルダに配置してください：

```
evalsite/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── icon16.png
├── icon48.png
└── icon128.png
```

### 2. アイコン画像の作成

拡張機能のアイコンが必要です。以下のサイズで作成してください：
- 16x16px (icon16.png)
- 48x48px (icon48.png)
- 128x128px (icon128.png)

簡易的には、単色の画像でも動作します。

### 3. Chromeへの読み込み

1. Chrome を開き、`chrome://extensions/` にアクセス
2. 右上の「デベロッパーモード」を**オン**にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `evalsite/` フォルダを選択


## 📖 使い方

### 基本操作

1. **任意のWebサイトを訪問**すると自動的にフィンガープリント収集が開始されます
2. **ツールバーのアイコン**をクリックしてポップアップを開く
3. **リスクレベル**がバッジに表示されます：
   - 🟢 **L (Low)**: エントロピー < 25 bits
   - 🟠 **M (Medium)**: 25-50 bits
   - 🔴 **H (High)**: > 50 bits

### ポップアップの見方

#### 📊 Total Entropy (bits)
あなたの識別可能性を表す数値。高いほど特定されやすい。

**数学的意味**:
```
識別可能ユーザー数 ≈ 2^entropy
```

例：
- 28 bits → 約2.68億人を識別可能
- 33 bits → 約85億人（全人類）を識別可能

#### 🎯 識別確率
```
P(unique) = min(1, 2^entropy / internet_users)
```

99%以上の場合、あなたのブラウザは**ほぼ一意**に識別されます。

#### 📋 フィンガープリント詳細

各項目の右側の数値 (例: 10.5b) は、その要素が持つ情報エントロピーです。

**主要な識別要素**:
- **User Agent** (10.5b): ブラウザ・OS情報
- **Canvas Hash** (5.7b): 描画エンジンの差異
- **Screen Resolution** (4.8b): 画面サイズ
- **Language** (6.8b): 言語設定

#### 🌐 通信ログ

各ドメインへの通信で送信された識別情報を表示します。

**送信情報の例**:
- `Cookie`: セッションID、トラッキングID
- `Authorization`: 認証トークン
- `Referer`: 遷移元URL（トラッキング用）


## 🧮 技術仕様

### エントロピー計算式

```
H_total = Σ H(Xi)
```

where:
- `H(Xi)` = i番目の特徴量の情報エントロピー (bits)
- 各値はPanopticlick論文の実測値を使用

### 実装上の制約

#### Manifest V3の制限
- **webRequest API**: ヘッダー情報のみ取得可能（ペイロードは不可）
- **Service Worker**: 30秒でタイムアウト
- **Storage**: 5MB上限

#### HTTPS通信の制約
- TLS暗号化により、**リクエストボディは読取不可**
- Cookie値は取得可能だが、その意味の自動判定は不可能


## 📈 数学的根拠

### 情報エントロピー（Shannon Entropy）

```
H(X) = -Σ p(xi) log₂ p(xi)
```

各フィンガープリント要素について、その出現確率分布から情報量を算出。

### 一意性の推定

```
P(user | fingerprint) ≈ 2^(-H_total) × N_internet
```

where:
- `N_internet` ≈ 5×10^9 (インターネット利用者数)
- `H_total`: 総エントロピー

### 参考文献

- Eckersley, P. (2010). "How Unique Is Your Web Browser?" *Privacy Enhancing Technologies Symposium*
- Laperdrix, P. et al. (2016). "Beauty and the Beast: Diverting modern web browsers to build unique browser fingerprints"


## ⚠️ 制限事項

### 技術的制約

1. **ペイロード解析不可**: HTTPS通信の暗号化により、POSTデータの内容は取得できません
2. **動的JS実行**: ページ内のJavaScriptが動的に送信するデータは検出できない場合があります
3. **Third-party Cookie**: サードパーティCookieのブロック状況により結果が変動します

### 数学的限界

1. **確率的推定**: エントロピー値は統計的推定であり、厳密な確率ではありません
2. **独立性の仮定**: 各特徴量が独立と仮定していますが、実際には相関があります
3. **母集団の変動**: インターネット利用者の特性分布は時間とともに変化します


## 🔒 プライバシー

- **ローカル処理**: すべてのデータはブラウザ内で処理され、外部サーバーには送信されません
- **No Tracking**: この拡張機能自体はトラッキングを行いません
- **Open Source**: コードは完全に公開されており、監査可能です


## 🛠️ 開発者向け

### デバッグ方法

1. `chrome://extensions/` で拡張機能の「詳細」を開く
2. 「バックグラウンドページ」をクリックしてDevToolsを開く
3. Console に詳細ログが出力されます

### ログの確認

```javascript
// Content Script のログ
console.log('[EvalSite] Fingerprint collected:', {...});

// Background Script のログ
chrome.storage.local.get(null, (data) => {
  console.log('All stored data:', data);
});
```

### カスタマイズ

**エントロピー値の調整** (`background.js`):
```javascript
const ENTROPY_VALUES = {
  cookie: 15.0,          // 調整可能
  authorization: 20.0,
  userAgent: 10.5,
  // ...
};
```


## 📊 テスト方法

### 1. フィンガープリントテスト

以下のサイトで拡張機能の動作を確認：
- https://browserleaks.com/canvas
- https://amiunique.org/
- https://coveryourtracks.eff.org/

### 2. 通信監視テスト

1. ログイン機能のあるサイトにアクセス
2. ポップアップを開いてログを確認
3. `Authorization` や `Cookie` が検出されるか確認

### 3. リスク評価の検証

高エントロピーサイトの例：
- Google (多数のCookie送信)
- Facebook (詳細なトラッキング)
- Amazon (セッション管理)


## 🎯 今後の改善予定

### 実装可能な機能

1. **履歴グラフ**: 時系列でのエントロピー変化を可視化
2. **ドメインホワイトリスト**: 信頼するサイトを除外
3. **エクスポート機能**: ログをCSVで出力
4. **比較モード**: VPN使用前後での変化を比較

### 数学的改善

1. **条件付きエントロピー**: 特徴量間の相関を考慮
   ```
   H(X,Y) = H(X) + H(Y|X)
   ```

2. **ベイズ推定**: 事前分布を考慮した識別確率
   ```
   P(user|data) = P(data|user) × P(user) / P(data)
   ```

3. **機械学習**: 実データから識別パターンを学習


## 📜 ライセンス

MIT License


## 🤝 貢献

Pull Request歓迎です。以下を守ってください：

1. **数学的根拠を明記**: 新機能のエントロピー計算式を示す
2. **テストコード**: 主要機能にはテストを追加
3. **ドキュメント**: README更新を忘れずに

## 📞 サポート

問題が発生した場合：
1. ブラウザのDevToolsで Console エラーを確認
2. `chrome://extensions/` でエラーログを確認
3. Issue として報告（ログを添付）

**EvalSite** - あなたの「特定されやすさ」を数学的に可視化する