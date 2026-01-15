# Cream by Solstar ブログ記事テンプレートマニュアル

この記事は、ブログ記事テンプレート（`main-blog-post`セクション）で利用できる設定をまとめた運用マニュアルです。タイトルやメタ情報の表示、アイキャッチ画像の扱い、本文幅、コメント欄までを1セクションで管理する構成になっています。

## 基本情報
- 対象テンプレート: テーマエディタで「ブログ記事」を選択し、任意の記事をプレビュー。
- セクション構造: タイトル（textブロック）、メタ情報（`_blog-post-info-text`）、アイキャッチ（`_blog-post-featured-image`）、本文（`_blog-post-content`）、@appブロック、コメントで構成（[sections/main-blog-post.liquid](sections/main-blog-post.liquid)）。
- データ依存: `article.title` / `article.image` / `article.content` / `article.comments` を自動参照。管理画面の該当フィールドを更新することで即反映されます。

## 編集フロー（推奨）
1. テーマエディタでブログ記事テンプレートを開き、確認したい記事をプレビューに指定。
2. セクション設定で余白・背景・ギャップを調整し、ページ全体の幅感を先に決める。
3. ブロック一覧から「メタ情報」「アイキャッチ」「本文」それぞれのオプションを設定し、各コンテンツの幅や表示項目を確定。
4. アプリブロックや追加テキストを必要に応じて末尾へ追加（レビュー、CTAなど）。
5. コメント機能を有効にしている場合はテスト投稿を送信し、モデレーションと表示を確認。

## セクション設定（main-blog-post）
| 設定 | 種別 | 説明 | 推奨値/ヒント |
| --- | --- | --- | --- |
| ギャップ | Range 0-100px | タイトル〜本文〜コメント間の縦方向スペース。([sections/main-blog-post.liquid](sections/main-blog-post.liquid#L7-L33)) | 長文記事は32-48px、短文は12-24pxでタイトに。 |
| 配色 | Color scheme | 背景とテキストカラーセット。([sections/main-blog-post.liquid](sections/main-blog-post.liquid#L1-L33)) | 記事用の専用配色を用意すると一覧との区切りが明確。 |
| 上下余白 | Range 0-100px | ページ上端/下端の余白。([sections/main-blog-post.liquid](sections/main-blog-post.liquid#L34-L74)) | Hero直下に置く場合は上余白0-16px。 |

## ブロック詳細
### 1. タイトル（textブロック）
- 自動で`article.title`を出力。標準のtextブロック設定（タイポグラフィ、位置揃え、マージン）で見た目を調整。
- ヒーロー風レイアウトにする場合は`type_preset = display`や大きめのletter spacingを指定。

### 2. メタ情報 `_blog-post-info-text`
[blocks/_blog-post-info-text.liquid](blocks/_blog-post-info-text.liquid)

| 設定 | 種別 | 内容/使いどころ |
| --- | --- | --- |
| 日付を表示 | Checkbox | 公開日を`time_tag`で表示。ローンチ直後の記事のみ出したい場合はオフ。 |
| 著者名を表示 | Checkbox | `article.author`を表示。ブランド名に固定したい場合はカスタムメタフィールドを使用しスニペットを拡張。 |
| タイポプリセット | Select | 段落/見出しサイズのプリセット。本文より一段小さい設定が読みやすい。 |
| 文字揃え | Alignment | 左揃え/中央揃えなど。Hero型で中央寄せを使うとシンメトリーに。 |
| 余白（上下） | Range | タイトルとの距離を調整。タイトルが長い場合は上余白を0にして詰める。 |

### 3. アイキャッチ `_blog-post-featured-image`
[blocks/_blog-post-featured-image.liquid](blocks/_blog-post-featured-image.liquid)

| 設定 | 種別 | 内容/使いどころ |
| --- | --- | --- |
| アスペクト比 | Select | `adapt / portrait / square / landscape`。ブランドで統一感を出すなら固定比率を選択。 |
| 幅（デスクトップ/モバイル） | Select + Range | `fill / fit / custom`。カラム幅に応じて100%か、カスタムで70%などに絞る。 |
| 高さ | Select | `fit`は自然な高さ、`fill`で親コンテナいっぱい。`adapt`以外の比率では自動計算。 |
| ボーダー設定 | Select + Range | スタイル/太さ/不透明度/角丸。角丸16px＋細線でカード風に。 |
| 余白 | Range | 上下左右。本文との距離をここで制御。 |

### 4. 本文 `_blog-post-content`
[blocks/_blog-post-content.liquid](blocks/_blog-post-content.liquid)

| 設定 | 種別 | 説明 |
| --- | --- | --- |
| 幅モード | Select (`page` or `fixed`) | `page`=通常のコンテンツ幅（約60-70文字幅）、`fixed`=最大1200pxでよりワイド。リッチメディアが多い記事は`fixed`推奨。 |

### 5. コメント & アプリ
- コメント: Shopify管理画面でブログコメントを有効化すると自動でリストとフォームが表示（12件/ページネーション）。フォームは[sections/main-blog-post.liquid](sections/main-blog-post.liquid#L62-L121)で`blog-comment-form`スニペットを呼び出し。
- アプリブロック: セクション末尾の`{% content_for 'blocks' %}`スロットに@appブロックのみ追加可能。レビュー、小CTA、レコメンドなどをここに配置。

## 運用Tips
- 画像最適化: 1200px以上の横長画像を`article.image`に登録し、WebPを優先アップロードするとCLSを抑えられます。
- 著者表記: 複数ライターがいる場合はタグを活用し、メタ情報の真下に`text`ブロックで著者紹介リンクを追加すると回遊性向上。
- 目次: 長文記事では本文先頭に`<ul>`で目次を置き、各見出しに`id`を付与してスムーズなジャンプを実現。
- CTA配置: アプリブロックにニュースレターや関連商品を置き、本文読了後の行動を誘導。
- コメント運用: 承認制の場合はオートメーションで通知を飛ばし、返信テンプレートを用意しておくと対応が早い。

## 公開前チェックリスト
- アイキャッチ: 各記事に高解像度画像が設定され、意図した比率でトリミングされているか。
- メタ情報: 日付/著者が期待通りに表示・非表示になっているか、翻訳キー漏れがないか。
- 本文幅: PC/モバイルの両方で可読性の高い文字数かを確認。埋め込みメディアがはみ出していないか。
- コメント: 承認制/公開制の動作、reCAPTCHAの表示、送信メッセージ（`blogs.article.comment_*`）を確認。
- 構造化データ: `article | structured_data`がブラウザ検証で出力されているかを`Rich Results Test`でチェック。
- パフォーマンス: 画像のLCPに影響が出ていないか、`loading="eager"`指定でもCLSがないかをLighthouseで計測。
