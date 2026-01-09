# Cream by Solstar チェックアウトマニュアル

Shopify Checkoutはテーマエディタから直接編集できませんが、ブランド設定・ダイナミックチェックアウトボタン・カート周りの挙動によって体験が決まります。本ドキュメントでは、Creamテーマで触れられるチェックアウト関連ポイントをまとめます。

## 基本方針
- **管理画面でのブランド編集が最優先**: 「設定 > チェックアウト > カスタマイズ」からロゴ/背景/ボタン色/入力フィールドをCheckout Extensibilityで調整します。テーマ側でCSSを当てることはできません。
- **テーマは入口の最適化を担当**: PDPやカートにある「Shop Pay などの加速チェックアウト」ボタン、送料・税表示、案内文を整え、ユーザーをスムーズにcheckoutドメインへ誘導します。
- **翻訳と法務表記を揃える**: 税や送料に関するラベルはローカライズファイルで集中管理されます。変更時は該当ロケールをセットで更新してください。

## チェックアウトブランド設定（Shopify管理画面）
1. **Shopify管理画面 → 設定 → チェックアウト** を開き、Checkout Extensibilityエディタを起動。
2. 「ブランド」タブでロゴ、背景、ボタン、入力フィールドを設定。テーマのカラートークンに近い配色を選び、段差を避けます。
3. 「コンテンツ」タブでアップセル、情報バナー、追加のアプリブロックを挿入（Shopify Plusの場合）。テーマ側ではこれらを制御できない点に注意。
4. 保存後、`https://yourstore.myshopify.com/checkout` を別タブで開き、実際の見た目と動線を確認します。

## テーマ内のチェックアウト関連要素

### 1. PDPの加速チェックアウトブロック
- **ブロック構造**: `buy-buttons` セクションの一部として `accelerated-checkout` ブロックが追加可能（[templates/product.json#L249-L272](templates/product.json#L249-L272)）。初期状態では無効化されているため、テーマエディタでブロックを有効化してください。
- **描画ロジック**: ブロック自体は単純で、`{{ form | payment_button }}` を出力します（[blocks/accelerated-checkout.liquid](blocks/accelerated-checkout.liquid)）。プレビューで商品が空の場合は `collections.all.products.first` を仮表示します。
- **バリアントとの連携**: `product-form.js` が在庫変化に応じて `ref="acceleratedCheckoutButtonContainer"` を表示/非表示にします（[assets/product-form.js#L302-L341](assets/product-form.js#L302-L341)）。在庫切れバリアントでは自動でボタンが隠れるため、追加の条件分岐は不要です。
- **スタイリング**: `shopify-accelerated-checkout` 要素は `assets/base.css` で高さ・角丸をテーマのボタンと揃えています（[assets/base.css#L1498-L1512](assets/base.css#L1498-L1512)）。セカンダリボタン構成時も擬似セレクタで半径を変更します。

### 2. カート / ドロワーのチェックアウト設定
- **テーマ設定で制御**: 管理画面 > テーマ設定 > カート から `show_accelerated_checkout_buttons` をON/OFFできます（[config/settings_schema.json#L1868-L1895](config/settings_schema.json#L1868-L1895)）。ここをOFFにするとカート画面のShop Pay等が一括で非表示に。
- **配置先**: メインカートセクションとカートドロワーは `shopify-accelerated-checkout-cart` を内部で描画します。`auto_open_cart_drawer` をONにすると、Add to Cart後のドロワー内でも即時にボタンが見えるため、CVRの高い動線を確保できます。
- **送料・税文言**: 「送料はチェックアウト時に計算されます」などの文言はローカライズファイルで管理（例: [locales/nl.json#L189-L213](locales/nl.json#L189-L213)）。税制変更時は対象ロケールをまとめて編集します。

### 3. Checkout Links メタオブジェクト
- テーマには `checkout-links` アプリブロックを読み込むメタオブジェクトテンプレートがあります（[templates/metaobject/app--3135504385--checkout_links.json](templates/metaobject/app--3135504385--checkout_links.json)）。
- 管理画面のメタオブジェクトでリンクを更新すると、テーマ上の該当アプリブロックが即時反映されます。ランディングページから直接チェックアウトへ誘導したい場合に活用できます。

## 運用Tips
- **Shopify Payments必須**: ダイナミックチェックアウトボタンにはShopify Payments対応ブランドのみ表示されます。対象外の国/決済では自動で非表示になる点を理解しておきましょう。
- **A/Bテスト**: PDPで通常ボタンだけにする／加速ボタンを出す、の2パターンをテーマダブリングで計測し、最終的に`accelerated-checkout`ブロックの有無を決めるのがおすすめです。
- **翻訳整合**: サイトの主要言語を変更した際は `content.search_results_no_results_check_spelling` 等と同様に `shipping_policy_html` や `taxes_included_shipping_at_checkout_*` キーを見直して、Checkout内と同じ文言を使います。
- **視覚テスト**: 商品詳細・カート・ドロワーいずれかで `Shop Pay` バッジの余白が崩れる場合は `base.css` のカスタムプロパティを調整し、他ページにも副作用がないかチェック。
- **Shop Pay ボトルネック**: Shop Pay分割払いの案内テキストは `settings.show_installments` で制御されます。ローンや後払いを扱わない場合はOFFにして、Checkoutでの不一致を防ぎます。

## 公開前チェックリスト
- PDP・カート・ドロワーで加速チェックアウトボタンの表示/非表示が要件どおりか。
- `show_accelerated_checkout_buttons` を変更した際、すべてのカートUXで即時反映されるか確認。
- Checkout Extensibilityで設定したロゴ/色/ボタンスタイルがテーマと乖離していないか。
- 送料・税の案内テキストが全ロケールで最新か（`locales/*`）。
- Shop PayやApple Payを有効化したテストブラウザで、ボタン押下→checkoutドメイン遷移が正常か。
- アプリ由来の Checkout Links が不要なページに表示されていないか、メタオブジェクトの公開範囲を再確認。
