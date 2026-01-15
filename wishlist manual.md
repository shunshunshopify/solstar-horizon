# Cream by Solstar お気に入りページマニュアル

お気に入り（Wishlist）ページ専用テンプレート `page.wishlist` を運用するためのガイドです。ローカルストレージに保存されたお気に入りリストを [sections/main-wishlist.liquid](sections/main-wishlist.liquid) が表示し、一覧カードの描画やカート投入は [assets/wishlist.js](assets/wishlist.js) が制御します。

## まずはここから（基本操作）
- テンプレートを付与: Shopify管理画面で固定ページを作成し、テンプレートに **page.wishlist** を指定すると自動で main-wishlist セクションが呼び出されます（[templates/page.wishlist.liquid](templates/page.wishlist.liquid)）。
- テストデータ: PDPやコレクションカードのハートアイコン（[snippets/wishlist-button.liquid](snippets/wishlist-button.liquid)）を押してリストを作成。`localStorage['shopify-wishlist']` を削除すると初期状態を再現できます。
- テーマエディタ: 「その他のページ」→該当ページ→`main-wishlist` セクションのみが表示されるため、ここでグリッドや見出し設定を調整します。
- カウンター確認: ヘッダーとフッターのカウンター（[snippets/header-actions.liquid](snippets/header-actions.liquid), [sections/bottom-nav-bar.liquid](sections/bottom-nav-bar.liquid)）も同じストレージを参照するので、PC/モバイル双方で数値が同期するかをチェックしてください。

## テンプレート構成と仕組み
- セクション条件: main-wishlist はテンプレートサフィックス `wishlist` のときのみ描画され、他ページで誤って追加されることはありません。
- レイアウト: 見出しエリア → 商品グリッド（JSで挿入）→ 空状態メッセージの縦並び。グリッド部分は CSS Custom Properties でカラム・ギャップを制御します。
- データ取得: `wishlist.js` が localStorage に保存された `id/title/image/url/price/variant_id` を読み込み、必要に応じて `/products/<handle>.js` をフェッチしてバリエーションやギャラリーを埋めます。
- フォーム連携: 各カードには `<product-form-component>` が差し込まれ、`/cart/add` へ直接POSTしてカートに投げ入れます。アニメーションやバリアント同期も JavaScript 側で完結します。

## セクション設定（main-wishlist）
| 設定 | 種別 | 説明 / 使いどころ |
| --- | --- | --- |
| 見出しプリセット / サイズ | Select + Range | ページタイトルのタグとサイズを制御。ブランドガイドに合わせて `h1`＋48-64px が推奨。 |
| 説明文を表示 | Checkbox | 管理画面のページ本文を見出し下に差し込みます。ガイド文が不要ならOFF。 |
| 見出し余白（上/下） | Range(px) | タイトルとグリッドの距離を微調整。ヒーロー直下で使う場合は上余白0〜16px。 |
| 商品カードサイズ（PC） | Select | `small/medium/large` に応じて列数（4/3/2列）とカード比率を変更。商品数が多ければsmallで密度を上げる。 |
| 商品カードサイズ（モバイル） | Select | `small`は2列、`large`は1列。画像把握優先ならlarge。 |
| タイトル2行制限 | Checkbox | ONで `-webkit-line-clamp:2` が付与され、長い商品名でも高さが揃います。 |
| バリアントピッカーを表示 | Checkbox | trueでセレクトボックスを差し込み、`wishlist.js` が在庫状況と同期。シンプルなSKUのみならOFFにしてボタンを短縮。 |
| 画像アスペクト比 | Select | `square/portrait/landscape/adapt`。全商品で揃えたい場合は固定比率、撮影比率がまちまちなら`adapt`。 |
| グリッド幅 | Select | `centered` はページ幅、`full-width` は左右余白を削除。ヒーロー背景と合わせたい場合に使います。 |
| カラム間隔 | Range(px) | カード間ギャップを0〜50pxで調整。PC/モバイル共通で適用。 |
| 配色 | Color scheme | 背景とテキストカラー。ダーク背景でカードを浮かせたいときは専用配色を作成。 |

### グリッド/レスポンシブの挙動
- モバイル列数は `mobile_product_card_size` に応じて1〜2列に固定。600px未満では `padding-inline` が自動追加されます。
- タブレット (≥750px) とデスクトップ (≥990px/1200px) でブレークポイントが変わり、列数は `product_card_size` によって2〜4列へ切り替わります。
- `product_grid_width = full-width` の場合、コンテナーのCSS Gridを上書きして広いカラム幅にし、`collection-wrapper--full-width` クラスが追加されます。

### Empty State / CTA
- リストが空の場合は `#wishlist-empty` が表示され、「お気に入りリストは空です」＋ボタンが登場。遷移先は `settings.empty_cart_button_link` が優先され、未設定なら全商品一覧へリンクします。
- JSがアイテムを挿入すると空状態は自動で隠れます。QA時はローカルストレージをリセットし、空表示→追加→再表示を確認してください。

## JavaScript連携（assets/wishlist.js）
- ストレージキー: `shopify-wishlist`。ブラウザ単位で保存されるため、端末を跨いだ同期は行いません。
- カウンター: `[data-wishlist-counter]`（ヘッダー）、`[data-wishlist-counter-bottom]`（ボトムナビ）、`[data-wishlist-bubble]` が同時更新されます。
- ボタン属性: `data-product-*` 情報は `wishlist-button` スニペットが付与。コレクション/商品ページで違いはありませんが、aria-labelがロケーション別に変わります。
- 商品データ: `/products/<handle>.js` をフェッチし、バリアントや追加画像を補完。`enable_variant_picker` がtrueのときだけ `<select>` 群を描画します。
- Add to Cart: `<product-form-component>` 内の `<add-to-cart-component>` はテーマ標準のアニメーション設定 `settings.add_to_cart_animation` を読み込み、PDPと同じUXを維持します。
- 通知表示: 追加/削除/エラー時に `wishlist-notification` を生成して表示します。
- タブ同期: `storage` イベントで他タブの変更を検知し、一覧とカウンターを再描画します。
- ホバー2枚目: `settings.show_second_image_on_hover` がtrueの場合、ギャラリーで2枚目をホバー表示します。
- 更新イベント: `wishlist:updated` を `document` に発火し、`window.wishlist` でも参照できます。

## 運用Tips
- **初回導線**: ヘッダーやフッターのハートにテキストラベルをつけると、ユーザーが Wishlist ページの存在に気づきやすくなります。
- **カード密度**: `product_card_size = medium` と `columns_gap_horizontal = 24px` がもっともバランス良い組み合わせ。商品数が多い場合はギャップ12px＋smallで在庫一覧的に見せるのも有効。
- **バリアント名**: セレクトの選択肢はそのままオプション名が出るため、長文化しやすいサイズ表記（例: "Size - Unisex Large"）は事前に整理しておくとUIが崩れません。
- **翻訳**: 空状態メッセージ文はLiquid内で直書きされているため、別言語対応が必要なら多言語ラベルに置き換えるか、翻訳ファイルにキーを追加してください。
- **パフォーマンス**: Wishlist内の画像は `wishlist.js` 側で `width=600/832` を付与して取得します。さらに軽量化したい場合は `wishlist.js` の `normalizeImageUrl` 幅を調整してください。

## ボタン配置（wishlist-button）
- 商品ページ: 価格ブロック内（[blocks/price.liquid](blocks/price.liquid)）。`location: 'product'` のボタンを表示します。
- コレクションカード: 商品カード上（[snippets/product-card.liquid](snippets/product-card.liquid)）。`location: 'collection'` のアイコンのみ表示です。
- 特集商品/リソースカード: [blocks/_featured-product.liquid](blocks/_featured-product.liquid) と [snippets/resource-card.liquid](snippets/resource-card.liquid) で `location: 'collection'` を利用します。
- Buy buttons横: `location: 'buy_buttons'` でアイコンのみを追加できます（スタイルは [assets/wishlist-styles.css](assets/wishlist-styles.css)）。

## テーマ設定（Wishlist）
- Wishlistアイコン表示: `enable_wishlist_icon` がONのとき、ヘッダーやカードのハートが表示されます（[config/settings_schema.json](config/settings_schema.json)）。
- アイコンカラー: `wishlist_heart_outline_color / wishlist_heart_fill_color / wishlist_heart_background_color` がハートの線/塗り/背景色に反映されます（[snippets/theme-styles-variables.liquid](snippets/theme-styles-variables.liquid)）。

## 通知（Wishlist Notification）
- 追加/削除/エラー時に `wishlist-notification` が中央表示されます。自動で3秒後に非表示になり、×ボタンで閉じられます（[assets/wishlist.js](assets/wishlist.js), [assets/wishlist-styles.css](assets/wishlist-styles.css)）。

## 公開前チェックリスト
- ページ設定: 対象ページに `page.wishlist` テンプレートが割り当てられているか。
- 動作テスト: 商品追加→Wishlistページ表示→削除→空状態復帰の一連フローがPC/モバイル両方で成立するか。
- カウンター: ヘッダーとボトムナビの数値・バッジ表示がアイテム数に追従するか、0件時に非表示になるか。
- バリアント切替: `enable_variant_picker` ONの場合、選択変更で `Add to Cart` ボタンの variant_id が更新されるかをDevToolsで確認。
- CTAリンク: 空状態ボタンのリンク先が存在するか（404にならないか）。
- アクセシビリティ: キーボード操作で削除ボタン・Add to Cart ボタン・ドロップダウンがフォーカスでき、視覚的なフォーカスリングが表示されるか。
