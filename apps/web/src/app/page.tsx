// Next.js の画像コンポーネント（HTMLの<img>の高機能版。自動で画像を圧縮・最適化してくれる）
import Image from "next/image";

// このファイルは app/page.tsx なので URL "/" のページになる
// export default = Next.js に「これがページのコンポーネントだよ」と伝える
export default function Home() {
  return (
    // ========== 外枠: 画面全体を使って中央揃え ==========
    // className の中身は全て Tailwind CSS（CSSをクラス名で直接書くやり方）
    // flex = display:flex, min-h-screen = 最低高さ画面いっぱい, items-center/justify-center = 縦横中央揃え
    // dark:bg-black = ダークモードのときだけ背景を黒にする
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">

      {/* ========== メインコンテンツのコンテナ ========== */}
      {/* max-w-3xl = 最大幅を制限, flex-col = 縦方向に並べる, py-32 px-16 = 上下/左右の余白 */}
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">

        {/* ========== 1. Next.js ロゴ画像 ========== */}
        {/* Image = Next.js の画像コンポーネント。src, width, height は必須 */}
        {/* priority = ページ読み込み時に優先的に表示する画像 */}
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />

        {/* ========== 2. テキスト部分（見出し + 説明文） ========== */}
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          {/* 見出し */}
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the page.tsx file.
          </h1>
          {/* 説明文（リンク2つ含む） */}
          {/* {" "} = JSX の中でスペースを入れるための書き方 */}
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>

        {/* ========== 3. ボタン2つ（Deploy Now + Documentation） ========== */}
        {/* sm:flex-row = 画面が広いときは横並び、狭いときは縦並び（レスポンシブ対応） */}
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          {/* 黒いボタン: Vercel にデプロイするリンク */}
          {/* target="_blank" = 新しいタブで開く */}
          {/* rel="noopener noreferrer" = セキュリティ対策（外部リンクの定番） */}
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* ボタンの中にアイコン画像 + テキスト */}
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          {/* 白いボタン（枠線あり）: ドキュメントへのリンク */}
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
