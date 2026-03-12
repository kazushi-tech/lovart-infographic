# Plan: APIキー ユーザー入力UI（本番 bundle 非露出版）

## Context

`lovart-infographic` を外部公開可能な standalone アプリとして運用するため、ユーザーが自分の Gemini API キーを UI から入力し、そのキーで生成を実行できるようにする。

現状は `vite.config.ts` の `define` により `API_KEY` / `GEMINI_API_KEY` がクライアント bundle に埋め込まれる構造であり、共有キーや開発用キーを本番 build に混入させる危険がある。

今回のタスクの主目的は 2 つである。

1. ユーザー入力キーで生成できる UX を追加すること
2. 開発者側の env キーが本番 build の `dist/` に一切含まれない状態へ変えること

このアプリは client から Google API を直接呼ぶ standalone runtime である。したがって「ユーザー自身が入力したキー」はブラウザ runtime には存在する。今回防ぎたいのは、運営側・開発側の共有キーが build artifact に焼き込まれることじゃ。

## Security Goal

### 必ず満たすこと

- 本番 build の `dist/` に `API_KEY` / `GEMINI_API_KEY` / テスト用 sentinel key が含まれない
- 本番 runtime では env フォールバックをクライアントへ渡さない
- キー未入力時は UI から入力を促し、`window.aistudio` には依存しない

### 誤解しないこと

- `localStorage` は安全な秘密保管庫ではない
- `localStorage` は「毎回再入力しなくて済む永続化」であり、XSS があれば読み取られる
- ただし、Vite define で共有キーを bundle するよりははるかにましである

README と UI 文言もこの前提に揃えること。

## Architecture

### キー解決の優先順位

production:
1. localStorage のユーザー入力キー
2. fallback なし

development:
1. localStorage のユーザー入力キー
2. 開発用 runtime config endpoint から取得した env fallback

### 保存先

- `localStorage['lovart_gemini_api_key']`
- `localStorage['lovart_image_api_key']`

### 開発用 fallback の扱い

- Vite `define` では注入しない
- `server.ts` に dev-only の `/api/runtime-config` を追加し、`NODE_ENV !== 'production'` のときだけ env fallback を返す
- production では空文字または未設定を返し、絶対にキーを返さない

### API 呼び出し

- 構造生成: `generateSlideStructure(interviewData, apiKey)`
- 背景生成: `generateBackgroundImage(prompt, apiKey)`
- どちらも必ず呼び出し元から resolved key を受け取る
- service 内の `process.env` 直接参照と `window.aistudio` 依存は撤去する

## Team Assignments

### Team A: Runtime / Env / Build

対象:
- `server.ts`
- `vite.config.ts`
- `.env.example`
- `README.md`

役割:
- build artifact へのキー混入経路を断つ
- dev-only runtime config を追加する
- docs を standalone 向けに更新する

### Team B: Key Resolution / Generation Flow

対象:
- `src/hooks/useApiKeys.ts`（新規）
- `src/services/geminiService.ts`

役割:
- localStorage + dev runtime config を束ねた key resolution hook を実装する
- service を pure function 化し、呼び出し側から key を渡す

### Team C: Editor UX / Settings

対象:
- `src/components/ApiKeySettingsModal.tsx`（新規）
- `src/components/AppHeader.tsx`
- `src/components/AppShell.tsx`

役割:
- ヘッダーからキー設定を開けるようにする
- キー未入力時に生成前で止めてモーダルを開く
- `window.aistudio` 前提の UX を削除する

### Team D: Verification / Review Gate

役割:
- lint / build / dev の確認
- 実画面確認
- `dist/` secrets scan
- `codex-review` 実施

## Implementation Steps

### Step 1: Team A — build-time key injection を撤去する

#### `vite.config.ts`

- `define` から `process.env.GEMINI_API_KEY` と `process.env.API_KEY` を削除する
- Vite config は React / Tailwind / alias / HMR 設定だけに戻す
- 「空文字 fallback に置き換える」では不十分。そもそも bundle へ入れないこと

#### `server.ts`

- `GET /api/runtime-config` を追加する
- response 例:

    {
      "devFallbackGeminiKey": "...",
      "devFallbackImageKey": "...",
      "devMode": true
    }

- ただし `NODE_ENV === 'production'` の場合は必ず空文字を返す

    {
      "devFallbackGeminiKey": "",
      "devFallbackImageKey": "",
      "devMode": false
    }

- ここで読む env は既存の `API_KEY` / `GEMINI_API_KEY` を使ってよい
- ただし dev-only endpoint なので、本番では露出しないこと

#### `.env.example`

- `API_KEY`: 開発用 fallback またはローカル検証用。production では UI 入力を優先
- `GEMINI_API_KEY`: 開発用 fallback（構造生成向け）
- `PORT`: 任意
- `APP_URL`: 任意
- 「本番では env がクライアントへ配布されない」ことを明記する

#### `README.md`

- localStorage 保存は convenience であり secure vault ではないと明記する
- 本番ではユーザー自身のキー入力が主経路であると書く

### Step 2: Team B — key resolution hook を追加する

#### 新規 `src/hooks/useApiKeys.ts`

責務:
- localStorage からキーを読み込む
- `/api/runtime-config` を一度だけ取得する
- resolved key を計算する
- 保存 / クリア API を提供する

必要 interface:

```typescript
interface ResolvedApiKeys {
  geminiApiKey: string;
  imageApiKey: string;
}

interface UseApiKeysReturn {
  storedKeys: ResolvedApiKeys;
  setKeys: (next: ResolvedApiKeys) => void;
  clearKeys: () => void;
  resolvedGeminiKey: string;
  resolvedImageKey: string;
  hasResolvableKey: boolean;
  isRuntimeConfigLoading: boolean;
}
```

解決ルール:
- `resolvedGeminiKey = stored.geminiApiKey || devFallbackGeminiKey || devFallbackImageKey || ''`
- `resolvedImageKey = stored.imageApiKey || devFallbackImageKey || resolvedGeminiKey || ''`
- production では dev fallback が空なので、実質 localStorage only になる

### Step 3: Team B — `geminiService.ts` を純化する

#### `src/services/geminiService.ts`

- `window.aistudio` の global 宣言を削除する
- `generateSlideStructure(interviewData, apiKey: string)` に変更する
- `generateBackgroundImage(prompt, apiKey: string)` に変更する
- service 内で `process.env` を読まない
- key が空なら即 `throw new Error('API key is required')`

これで「service がどこからキーを解決するか」を UI 層へ集約できる。

### Step 4: Team C — Settings UI を入れる

#### 新規 `src/components/ApiKeySettingsModal.tsx`

要件:
- `isOpen`, `onClose`, `initialGeminiApiKey`, `initialImageApiKey`, `onSave`, `onClear` を受ける
- password input 2 つ
- show/hide toggle
- 「ブラウザ内に保存されます。共有端末では注意してください。」文言
- Escape / backdrop click で閉じる
- mobile でも崩れない

#### `src/components/AppHeader.tsx`

- `onOpenSettings` prop を追加する
- 歯車ボタンを右側に追加する
- `isGenerated` に依存せず常時開けるようにする

#### `src/components/AppShell.tsx`

- `useApiKeys` を導入する
- `isSettingsOpen` state を追加する
- `handleGenerate()` 冒頭の `window.aistudio` ブロックを削除する
- 生成前に `hasResolvableKey` を確認し、無ければモーダルを開いて return
- `generateSlideStructure(interviewData, resolvedGeminiKey)` を使う
- `generateBackgroundImage(bgPrompt, resolvedImageKey)` を使う
- エラー表示は「設定した API キーを確認してください」に統一する

### Step 5: Team D — Verification と secrets scan

#### Runtime checks

1. `npm run lint`
2. `npm run build`
3. `npm run dev`
4. ブラウザ確認
   - 歯車ボタンが見える
   - キー保存できる
   - reload 後も維持される
   - キー未入力で生成するとモーダルが開く
   - キー入力後は生成成功する
   - クリアで localStorage から消える

#### Secrets exposure check

build 前にテスト用 env を設定して sentinel 文字列を混ぜる。

例:
- `API_KEY=__LOVART_SENTINEL_IMAGE__`
- `GEMINI_API_KEY=__LOVART_SENTINEL_GEMINI__`

その状態で `npm run build` 後、`dist/` を検索し、上記文字列が 1 件も見つからないことを確認する。

期待結果:
- `rg -n "__LOVART_SENTINEL_(IMAGE|GEMINI)__" dist` が 0 hit

#### Production behavior check

- `NODE_ENV=production` 相当で `GET /api/runtime-config` が空文字を返すことを確認する
- production モードでは env fallback が使えず、ユーザー入力キーのみで動く設計であることを確認する

#### Review gate

- `codex-review` を実行する
- Critical / Major が 0 になるまで修正する

## Deliverables

- 新規: `src/hooks/useApiKeys.ts`
- 新規: `src/components/ApiKeySettingsModal.tsx`
- 変更: `server.ts`
- 変更: `vite.config.ts`
- 変更: `.env.example`
- 変更: `README.md`
- 変更: `src/services/geminiService.ts`
- 変更: `src/components/AppHeader.tsx`
- 変更: `src/components/AppShell.tsx`

## Acceptance Criteria

- ユーザーが UI から API キーを保存できる
- 保存したキーで構造生成と画像生成が通る
- `window.aistudio` 依存が完全に消える
- service 層が `process.env` を直接読まない
- 本番 build の `dist/` に env キー文字列が含まれない
- production runtime config がキーを返さない
- build / lint / 実画面確認 / review gate が通る