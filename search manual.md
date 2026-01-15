# Cream by Solstar 検索ページマニュアル

`/search` テンプレート向けの実務ガイドです。ヘッダーエリア（search-headerセクション）と結果リスト（search-resultsセクション）の2部構成で、ファセットや無限スクロールは [templates/search.json](templates/search.json) の設定に従います。

## 基本操作
- **テンプレート選択:** テーマエディタ上部で「検索」を選ぶと search-header と search-results のみが表示されます。
- **テスト手順:** 検索語を入力→結果確認→フォーム右のCLEARボタンで空検索に戻る。意図した商品が無い場合は空状態としてコレクションを指定できます。
- **データソース:** `search.results` から商品／記事／ページを取得。search-results は商品に限定して描画し、ヒットが無い場合は `settings.empty_state_collection` の商品を表示します（[sections/search-results.liquid](sections/search-results.liquid)）。

## セクション構成
| 項目 | 役割 | 主な設定 |
| --- | --- | --- |
| search-header | 検索タイトルと入力フィールドを1行にまとめる。検索済みかどうかで見出し文言を切替。 | アライメント、配色、上下余白（[sections/search-header.liquid](sections/search-header.liquid)） |
| search-results | ファセット、結果グリッド、空状態を管理。`results-list.js` と `facets.js` を読み込み、無限スクロールやフィルタドロワーを制御。 | レイアウト種別、カードサイズ、無限スクロール、列幅、ギャップ、カラー（[sections/search-results.liquid](sections/search-results.liquid)） |
| filtersブロック | Search & Discovery のファセットを再利用。縦置き／横置き／ドロワー表示、ソート、グリッド密度、スウォッチラベルなどを制御（[blocks/filters.liquid](blocks/filters.liquid)）。 | enable_filtering、filter_style、filter_width、enable_sorting、facets margin など |
| _product-cardブロック | 検索結果カードのギャラリー、タイトル、価格を定義。商品カードのデザインはコレクションページと共通。 | 画像比率、タイポプリセット、セール表示 等 |
| _search-inputブロック | 入力ボックス自体を描画し、`search-page-input.js` を読み込む（[blocks/_search-input.liquid](blocks/_search-input.liquid)）。 | 幅指定、配色継承 | 

## search-header 詳細
- 見出し: 検索前は `content.search`、検索後は `content.search_results` を表示。必要に応じて `_heading` ブロックのタイポプリセットを調整できます。
- 入力欄: `_search-input` は `routes.search_url` にGET送信し、hiddenフィールドで `type=product` を固定。配色を引き継がない場合はフォーム単体で配色を切り替え可能。
- レイアウト: `alignment` で左揃え／中央揃え／右寄せを指定。検索ボックスの横幅はブロック設定の `custom_width`（%）で制御します。

### search-page-input.js の挙動（[assets/search-page-input.js](assets/search-page-input.js)）
- `search-page-input-component` カスタム要素を定義し、ESCキーで空欄の場合は自動送信して検索結果を初期化。
- CLEARボタン（`on:click="/handleClearClick"`）で入力値をクリアし、空状態でなければフォームを再送信。
- 入力欄に文字がある時のみリセットボタンを表示（`:has(.search-page-input:not(:placeholder-shown))`）。

## search-results 設定
| 設定 | 説明 / ヒント |
| --- | --- |
| layout_type | `grid` と `organic` を切替。organicはエディトリアル用（スタイルはproduct-gridスニペット依存）。 |
| product_card_size / mobile_product_card_size | グリッド列数とカード余白を変更。検索結果は初期で medium（PC3列）/small（SP2列）。 |
| enable_infinite_scroll | trueで `results-list.js` がIntersection Observerで次ページを自動読み込み。falseなら下部ページネーションを使用し `products_per_page` が有効。 |
| product_grid_width / full_width_on_mobile | 中央寄せ or 全幅を選択。全幅時は縦方向余白を別セクションで調整。 |
| columns_gap_horizontal / vertical | ピクセル単位でグリッド間隔を設定。フィルタとのバランスを見て16-24pxが目安。 |
| color_scheme / padding | 背景を変えて、フォームと結果の区切りを強調可能。 |

### Filtersブロック主要項目
| 設定 | 内容 |
| --- | --- |
| enable_filtering | falseにすると商品件数＋並び替えバーのみ表示。 |
| filter_style | `vertical`=左カラム固定、`horizontal`=上部バー＋モーダル。SPでは常にドロワーを使用。 |
| filter_width | `centered` or `full-width`。vertical時は2カラム幅を確保。 |
| enable_sorting / enable_grid_density | 並び替えプルダウンとグリッド密度トグルを表示。モバイルではまとめてセレクトUIに切替。 |
| text_label_case / show_filter_label / show_swatch_label | フィルタラベルの大文字化やスウォッチ名表示を制御。 |
| facets_margin_bottom / right | フィルタブロック周囲の余白。ヘッダーと詰まる場合はここで調整。 |

## 空状態と代替表示
- 検索ヒット0件時: `settings.empty_state_collection`（テーマ設定）から商品を取得し、タイトルは `content.search_results_resource_products` を既定値に使用。
- No results メッセージ: `_search-input` 内の `search-results__no-results` ブロックがプレーンテキストで表示。翻訳キー `content.search_results_no_results_check_spelling` を更新すれば文言を差し替え可能。

## JavaScript 連携
- `results-list.js` は `results-list` カスタム要素を提供し、`infinite-scroll="true"` の場合に `data-page` 属性で次ページをフェッチ。
- `facets.js` は `facets-form-component` や `filters-toggle` を制御し、URLクエリを更新。Search & Discovery アプリの設定と連動してフィルタを表示します。
- `search-page-input.js` はヘッダー検索、`predictive-search.js` はヘッダー／モーダルのサジェスト機能を担当（直接的には検索ページでは使用しませんがフィールドデザインは共通です）。

## 運用Tips
- **検索対象:** デフォルトで商品に限定（`type=product`）。記事やページも対象にしたい場合は `_search-input` の hidden入力を編集し `type=article,page,product` へ変更。
- **ファセット連携:** Search & Discovery で新しいメタフィールドフィルタを追加したら検索テンプレートでも即反映されるため、プレビューでフィルタ順序を確認。
- **無限スクロール検証:** 長い検索語で結果が多い商品を探し、Lazy load時にボトムメニューやフッターと干渉しないかチェックしてください。
- **アクセシビリティ:** `skip-to-content-link` で結果リストへ飛べるため、セクション順を変える際はアンカーID `#ResultsList` が壊れていないか確認。
- **解析:** 空検索（クエリ無し）時は検索結果を表示せずフォームのみ出るため、GAのイベントを採る際はクエリ存在チェックを条件にしてください。

## 公開前チェックリスト
- 検索フォームのplaceholder・ラベル・CLEARボタン文言がブランドトーンに合っているか。
- フィルタON/OFF時やソート変更時にURLパラメータが期待通り更新され、ブラウザバックで状態が保持されるか。
- モバイルでフィルタドロワーが開閉し、選択内容がバッジ表示されるか。
- 無限スクロール無効時、ページネーションが24件単位で正しく動作するか。
- ヒット0件でも空状態コレクションが表示され、リンク切れが無いか。
- 検索結果カードが他ページと同じ価格表示（税表記やバッジ）になっているかを複数商品で確認。
