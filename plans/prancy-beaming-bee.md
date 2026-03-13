# Fix: 「要件を入力する」ボタンが動作しない

## Context

AI Studio風AssistantShell UIへの移行（commit 9bcd311）後、ウェルカム画面の「要件を入力する」ボタンをクリックしても最初の質問ステップに遷移しない。

### Root Cause

`isWelcome`判定（AssistantShell.tsx:40）:
```tsx
const isWelcome = phase === 'collecting' && activeStepIndex === 0 && Object.keys(answers).length === 0;
```

`handleStartInterview`（AppShell.tsx:104-110）は初期状態から呼ばれると何もstateを変更しない：
- `phase`は既に`'collecting'`、`activeStepIndex`は既に`0` → dispatchされない
- `screen`は既に`'wizard'` → setScreenも変化なし
- → `isWelcome`は`true`のまま、ウェルカム画面が再表示される

## Fix

### アプローチ: reducerに`startInterview`アクションを追加

最小限の変更で、ウェルカム→ステップ0質問への遷移を可能にする。

#### 1. `src/interview/state.ts`
- `WizardAction`に`{ type: 'startInterview' }`を追加
- reducerに`case 'startInterview'`を追加: `phase`を`'collecting'`にし、`started: true`フラグをセット（またはシンプルにphaseを使う）

**しかし**、phaseは既に`'collecting'`なのでフラグが必要。

→ より簡単なアプローチ: **`InterviewWizardState`に`started: boolean`を追加**

```ts
export interface InterviewWizardState {
  activeStepIndex: number;
  answers: Partial<Record<InterviewFieldId, AnswerEntry>>;
  phase: 'collecting' | 'review';
  started: boolean;  // ← 追加
}
```

#### 変更ファイル

| File | Change |
|------|--------|
| `src/interview/state.ts` | `started`フィールド追加、`startInterview`アクション追加、`reset`で`started: false`に |
| `src/components/assistant/AssistantShell.tsx` | `isWelcome`判定を`!wizardState.started`に変更（既存の3条件不要、startedだけで十分） |
| `src/components/AppShell.tsx` | `handleStartInterview`で`dispatch({ type: 'startInterview' })`を呼ぶ |

#### 2. 具体的変更

**state.ts:**
- `InterviewWizardState`に`started: boolean`追加
- `createInitialWizardState`で`started: false`
- `WizardAction`に`| { type: 'startInterview' }`追加
- reducer: `case 'startInterview': return { ...state, started: true }`
- `case 'reset'`: `started: false`を含める（既にcreateInitialWizardStateを呼ぶのでOK）

**AssistantShell.tsx:**
- L40: `const isWelcome = !wizardState.started;`（簡潔化）
  - ただし`phase`等との整合性を保つため: `const isWelcome = phase === 'collecting' && !wizardState.started;`

**AppShell.tsx:**
- L104-110: `handleStartInterview`を修正:
  ```tsx
  const handleStartInterview = () => {
    dispatch({ type: 'startInterview' });
    setScreen('wizard');
  };
  ```

## Verification

1. `npm run lint` — 型チェックパス
2. `npm run build` — ビルド成功
3. ブラウザで確認:
   - 初期表示: ウェルカム画面が表示される
   - 「要件を入力する」クリック → 最初の質問ステップに遷移
   - 「サンプルで試す」→ レビュー画面に遷移（既存動作維持）
   - 新規作成（リセット）→ ウェルカム画面に戻る
