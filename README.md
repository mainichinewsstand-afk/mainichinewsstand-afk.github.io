# まいにちニューススタンド

ニュースを読むと相棒「ヨミ」が育つニュースアプリです。
国内・国際・経済・AIのニュース見出しを1時間ごとに自動で集めます。
GitHub Pages(無料)でWebサイトとして公開し、そのサイトをGoogle Playのアプリにします。

---

## ステップ1:Webサイトとして公開する(15分ほど)

1. **GitHubアカウントを作る**
   https://github.com で無料登録します(作成済みなら不要)。

2. **リポジトリを作る**
   右上の「+」→「New repository」。
   **名前は必ず `mainichinewsstand-afk.github.io` にしてください**(1文字でも違うと動きません)。
   Play Storeのアプリにするには、サイトがドメインの一番上(`https://mainichinewsstand-afk.github.io/`)にある必要があるためです。
   **Public** を選んで「Create repository」。

3. **ファイルをアップロードする**
   リポジトリの画面で「uploading an existing file」を押し、zipを展開した中身を全部ドラッグして「Commit changes」。
   ※ `.github` フォルダ(先頭がドット)も必ず含めてください。見えない場合はパソコンの「隠しファイルを表示」をオンにします。
   ※ `store-assets` フォルダはストア掲載用の素材なので、アップしなくてもかまいません。

4. **GitHub Pagesをオンにする**
   「Settings」→ 左の「Pages」→「Source」で **GitHub Actions** を選びます。

5. **初回の更新を動かす**
   「Actions」タブ →「ニュース更新と公開」→「Run workflow」。緑のチェックが付けば完了です。

6. **サイトを開いて確かめる**
   `https://mainichinewsstand-afk.github.io/` を開き、ニュースが出ることを確認します。

7. **お問い合わせ先**
   `public/about.html` に `mainichi.newsstand@gmail.com` を載せてあります。変えるときはここを書き換えます。

---

## ステップ2:Google Play のアプリにする

### 2-1. デベロッパーアカウントを作る

1. https://play.google.com/console で登録します。登録料は **25ドル(1回だけ)** です。
2. アカウントの種類は「個人」を選び、本人確認(氏名・住所)をします。審査に数日かかることがあります。
3. Androidスマホで「Play Console」アプリを入れ、端末の確認をします。

### 2-2. アプリのファイル(.aab)を作る

1. https://www.pwabuilder.com を開き、`https://mainichinewsstand-afk.github.io/` を入力して「Start」。
2. 「Package For Stores」→「Android」→「Generate Package」。
   - Package ID は例:`io.github.mainichinewsstand_afk.newsstand`(ハイフンは使えないので _ にしています)
   - App name:まいにちニューススタンド / Launcher name:ニューススタンド
3. zipがダウンロードされます。中に次のものが入っています。
   - **`.aab` ファイル** … Play Consoleにアップするアプリ本体
   - **`signing.keystore` と `signing-key-info.txt`** … アプリの「鍵」。**なくすと二度とアップデートできません。** 必ず安全な場所に保管してください。
   - **`assetlinks.json`** … 次の手順で使います

### 2-3. サイトとアプリを結びつける

1. リポジトリの `public` フォルダの中に `.well-known` フォルダを作り、PWABuilderが出した `assetlinks.json` を入れます。
   (GitHubの画面なら「Add file」→「Create new file」で、名前に `public/.well-known/assetlinks.json` と入力し、中身を貼り付けます)
2. 数分後、`https://mainichinewsstand-afk.github.io/.well-known/assetlinks.json` が開ければOKです。
   これがないと、アプリの上部にブラウザのアドレスバーが出てしまいます。

### 2-4. Play Consoleで登録する

1. 「アプリを作成」。アプリ名・言語(日本語)・「アプリ」「無料」を選びます。
2. **ストアの掲載情報**:`store-assets/掲載文.md` の文章と、同じフォルダの画像を使います。
3. **アプリのコンテンツ**の申告(主なもの):
   - プライバシーポリシー:`https://mainichinewsstand-afk.github.io/about.html#privacy`
   - 広告:含まない
   - データセーフティ:データの収集・共有なし
   - 対象年齢:13歳以上(または全年齢)
   - **ニュースアプリの申告**:「ニュースアプリである」を選び、連絡先URLに `https://mainichinewsstand-afk.github.io/about.html#contact` を入力
   - コンテンツのレーティング:アンケートに答える
4. **クローズドテスト**:新しい個人アカウントは、**12人以上のテスターが14日間続けて参加**しないと一般公開を申請できません。
   テスターのGmailアドレスをリストに入れ、届いたテスト用リンクから入ってもらいます。
5. 14日たったら「製品版へのアクセスを申請」。審査(数日〜1週間ほど)に通ると公開されます。

---

## 中身

| ファイル | 役割 |
|---|---|
| `public/index.html` | アプリの画面(ニュース一覧とヨミ) |
| `public/about.html` | 運営者・お問い合わせ・情報源・プライバシーポリシー |
| `public/manifest.webmanifest` | アプリとしての名前・アイコン・色の設定 |
| `public/sw.js` | 通信できないときに前回のニュースを出す仕組み |
| `public/icons/` | アプリのアイコン |
| `public/news.json` | 集めたニュース(自動で上書きされます) |
| `scripts/fetch.mjs` | 各配信元のRSSからニュースを集めるプログラム |
| `.github/workflows/update.yml` | 1時間ごとの自動実行と公開の設定 |
| `store-assets/` | ストア掲載用の画像と説明文 |

## アプリの更新について

画面やニュースはWebサイト側で動いているので、`public` の中を書き換えれば、アプリにも自動で反映されます。
ストアに新しい .aab を出し直す必要があるのは、アイコンやアプリ名を変えるときだけです。

## 配信元を変えたいとき

`scripts/fetch.mjs` の先頭にある `FEEDS` に1行足すか消すだけです。カテゴリは `dom`(国内)・`world`(国際)・`eco`(経済)・`tech`(AI・テック)・`ent`(エンタメ)・`sports`(スポーツ)・`sci`(科学)の7つです。

## 注意

- 表示するのは見出し・配信元・日時と元記事へのリンクだけで、記事本文は載せていません。ただし各配信元のRSSには利用条件があります。ストアで公開する前に、Yahoo!ニュースとITmediaのRSS利用条件を確認してください。広告を付けるなど収益化する場合は特に注意が必要です。
- 自動更新の頻度を変えるときは `update.yml` の `cron` を編集します(例: 3時間ごとなら `17 */3 * * *`)。
