# Dev Fallback と API Key UI Gating Hardening

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document must be maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

After this change, a developer can clone `lovart-infographic`, put fallback keys in `.env`, run `npm run dev`, and reach a state where the app actually sees those keys through `/api/runtime-config` without exposing them in the production bundle. A user who does not rely on `.env` can still open the settings modal, save keys in the browser, and generate slides. The app must stop opening a false "API key missing" modal during initial page load while runtime config is still being fetched.

The working proof is simple. Start the dev server with `.env` present and localStorage empty, finish the interview, and click `スライドを生成する`. The generation should start without requiring manual key input. Build the app with sentinel env values and verify that `dist/` does not contain those strings.

## Progress

- [ ] (2026-03-12 00:00Z) Capture the current broken behavior and record evidence.
- [ ] (2026-03-12 00:00Z) Make `server.ts` load `.env` in local development and return dev fallback keys whenever the server is running in non-production mode.
- [ ] (2026-03-12 00:00Z) Prevent `AppShell` from opening the settings modal while runtime config is still loading.
- [ ] (2026-03-12 00:00Z) Propagate generate-button disabled/loading state through `ChatInterviewSidebar.tsx` and `BriefSummaryCard.tsx`.
- [ ] (2026-03-12 00:00Z) Update docs so `.env.example` and `README.md` describe the real runtime behavior.
- [ ] (2026-03-12 00:00Z) Run lint/build/manual checks and a secrets scan, then record the evidence.

## Surprises & Discoveries

- Observation: `server.ts` only exposes `/api/runtime-config` when `process.env.NODE_ENV === 'development'`, but `package.json` runs `tsx server.ts` without setting `NODE_ENV`.
  Evidence: `package.json` currently defines `"dev": "tsx server.ts"`, and `server.ts` branches on a strict string equality check.

- Observation: `server.ts` depends on `process.env.API_KEY` and `process.env.GEMINI_API_KEY`, but there is no `dotenv` load in the file.
  Evidence: `dotenv` exists in `package.json`, but `server.ts` does not import it.

- Observation: `useApiKeys.ts` already exposes `isRuntimeConfigLoading`, but `AppShell.tsx` does not use it before deciding to open the settings modal.
  Evidence: `useApiKeys.ts` returns `isRuntimeConfigLoading`; `AppShell.tsx` destructures it but `handleGenerate()` checks only `hasResolvableKey`.

## Decision Log

- Decision: Use server-side runtime config for development fallbacks instead of build-time Vite injection.
  Rationale: The repository already removed `vite.config.ts` key injection, and this preserves the security goal that `dist/` must not contain keys.
  Date/Author: 2026-03-12 / Codex

- Decision: Treat `NODE_ENV !== 'production'` as the development-like mode for `/api/runtime-config`.
  Rationale: `npm run dev` does not currently set `NODE_ENV=development`, so a strict equality check prevents local fallback from working.
  Date/Author: 2026-03-12 / Codex

- Decision: Gate generation on both `isRuntimeConfigLoading` and `hasResolvableKey`.
  Rationale: Without this, the app can open a false missing-key modal before runtime config has finished loading.
  Date/Author: 2026-03-12 / Codex

## Outcomes & Retrospective

At the time of writing, this follow-up plan exists because the first API key UI implementation passed lint/build but still left two behavior gaps: the `.env` fallback path was not actually wired up for `npm run dev`, and the UI could misfire during the initial config fetch. Update this section after implementation with the final outcome, remaining gaps, and whether the secrets scan stayed green.

## Context and Orientation

This repository is a Vite + React SPA hosted by an Express server in `server.ts`. The browser directly calls Gemini through `src/services/geminiService.ts`. The repository recently introduced browser-stored API keys via `src/hooks/useApiKeys.ts` and `src/components/ApiKeySettingsModal.tsx`, while removing the old Vite `define` injection from `vite.config.ts`.

The relevant files are:

- `package.json`: starts the server with `npm run dev` and `npm run start`.
- `server.ts`: hosts the SPA and serves `/api/runtime-config`.
- `src/hooks/useApiKeys.ts`: reads localStorage, fetches runtime config, and resolves keys.
- `src/components/AppShell.tsx`: decides whether generation starts or the settings modal opens.
- `src/components/ChatInterviewSidebar.tsx`: passes the `onGenerate` action to the summary UI.
- `src/components/BriefSummaryCard.tsx`: renders the `スライドを生成する` button.
- `.env.example` and `README.md`: tell developers how the fallback path is supposed to work.

This plan does not redesign the API key UX from scratch. It hardens the existing implementation so the documented local development flow actually works and the UI no longer races the runtime-config fetch.

## Team Topology

Use the existing skills-and-teams discipline rather than a single undifferentiated implementation pass.

Team A: Runtime / Env

Owns `server.ts`, `package.json`, `.env.example`, and `README.md`. This team proves that local `.env` values are visible in development but never shipped in `dist/`.

Team B: Key Resolution / UI State

Owns `src/hooks/useApiKeys.ts` and the key-resolution contract. This team makes sure the hook reflects the real loading state and that fallback keys resolve deterministically.

Team C: Generation UX

Owns `src/components/AppShell.tsx`, `src/components/ChatInterviewSidebar.tsx`, and `src/components/BriefSummaryCard.tsx`. This team makes the generate flow wait for runtime config and renders a trustworthy button state.

Team D: Verification / Review Gate

Owns the proof. This team reruns lint/build, runs the secrets scan, exercises the UI in a browser, and then runs `codex-review` or `universal-review` if `codex-review` is unavailable.

## Plan of Work

Begin by fixing the server-side assumptions. `server.ts` must load `.env` explicitly using `import 'dotenv/config';` or an equivalent top-level `dotenv` initialization before it reads `process.env`. The runtime-config route must consider any non-production server run to be development-like, because `npm run dev` currently uses `tsx server.ts` without setting `NODE_ENV`. Keep the security boundary intact: production responses from `/api/runtime-config` must remain empty strings, and the route must never make it possible for `dist/` to contain keys.

Then harden the browser-side resolution path. `src/hooks/useApiKeys.ts` already fetches `/api/runtime-config`, so it should continue to do that, but the implementation must leave a clean signal that the config is still loading and must not falsely imply that no key exists while the request is still in flight. Keep the hook the single source of truth for `storedKeys`, `resolvedGeminiKey`, `resolvedImageKey`, `hasResolvableKey`, and `isRuntimeConfigLoading`.

Next, update the generation UX. `src/components/AppShell.tsx` must stop opening `ApiKeySettingsModal` while runtime config is still loading. Instead, if loading is in progress, the generate action should be ignored or deferred and the UI should reflect that the app is checking key configuration. The most defensible approach in this repository is to thread a disabled/loading prop from `AppShell.tsx` through `ChatInterviewSidebar.tsx` into `BriefSummaryCard.tsx`, so the `スライドを生成する` button is visibly disabled until runtime config is known. Once loading finishes, the same button should either start generation immediately (fallback/user key found) or open the settings modal (no usable key found).

Finally, bring the docs back into alignment with reality. `.env.example` and `README.md` must describe the exact conditions under which local `.env` values work, the fact that the development server loads them, and the fact that production users are expected to supply their own keys through the UI. Document that localStorage is a convenience store, not a secure vault.

## Concrete Steps

Use the following sequence from the repository root `C:\Users\PEM N-266\work\lovart-infographic`.

1. Capture the baseline behavior before editing.

    npm run dev

    In a second terminal:

    curl http://localhost:3000/api/runtime-config

    Expected before the fix: empty fallback keys even when `.env` exists, or at least behavior that proves the current assumptions are wrong.

2. Edit `server.ts`.

    - Add `import 'dotenv/config';` at the top.
    - Replace the strict `process.env.NODE_ENV === 'development'` check with a non-production development-mode check.
    - Keep the production response empty.

3. Edit `src/components/AppShell.tsx`.

    - Use `isRuntimeConfigLoading` in `handleGenerate()`.
    - Add a derived `isGenerateDisabled` or equivalent.
    - Pass that state downward.

4. Edit `src/components/ChatInterviewSidebar.tsx` and `src/components/BriefSummaryCard.tsx`.

    - Add props for generate-button disabled/loading behavior.
    - Render a disabled button state and explanatory text while runtime config is loading.

5. Update docs in `.env.example` and `README.md`.

    - State that `.env` is loaded by the Express server during local development.
    - State that production users must input their own keys.
    - State that localStorage is convenience storage only.

6. Re-run verification.

    npm run lint
    npm run build

7. Run the secrets scan with sentinel values.

    In PowerShell:

    $env:API_KEY='__LOVART_SENTINEL_IMAGE__'
    $env:GEMINI_API_KEY='__LOVART_SENTINEL_GEMINI__'
    npm run build
    rg -n "__LOVART_SENTINEL_(IMAGE|GEMINI)__" dist

    Expected result: no matches.

8. Run the manual browser proof.

    - Clear localStorage for the app origin.
    - Keep `.env` populated.
    - Start `npm run dev`.
    - Finish the interview with sample data.
    - Observe that the generate button is disabled only while runtime config is loading.
    - Observe that, once loading completes, generation starts without forcing the settings modal.
    - Open the settings modal manually and confirm save/clear still work.

9. Run the review gate.

    Use `codex-review` on the changed files. If unavailable in the current environment, run `universal-review` with the standard review template from `CLAUDE.md`.

## Validation and Acceptance

The change is acceptable only if all of the following are true.

- `npm run lint` passes.
- `npm run build` passes.
- A build with sentinel env values still leaves `dist/` free of those values.
- `curl http://localhost:3000/api/runtime-config` returns fallback keys in local development when `.env` is populated.
- The same route returns empty strings when the server is running in production mode.
- With localStorage cleared but `.env` present, the user can still complete the interview and start generation without being blocked by a false settings modal.
- With no localStorage keys and no fallback keys, the settings modal opens and the user can save keys manually.
- `codex-review` or `universal-review` returns no Critical or Major findings.

## Idempotence and Recovery

This work is safe to repeat. Re-running `npm run build` or the sentinel scan should not mutate source files. If the runtime-config route behaves unexpectedly after the server change, temporarily log the computed `isDevLike` decision and remove that log before completion. If a doc statement and runtime behavior disagree, treat the runtime as the source of truth and update the docs again before closing the task.

If the `.env` loading change causes unwanted behavior in production, the safe rollback is to revert only the `dotenv` and mode-detection edits in `server.ts` while keeping the client-side key UI intact.

## Artifacts and Notes

Record the following evidence in the implementation summary.

- The `curl /api/runtime-config` output in local development.
- The `curl /api/runtime-config` output in production-like mode.
- The `rg` secrets scan output showing zero hits.
- A screenshot or short note showing the disabled generate button during runtime-config loading.
- A screenshot or short note showing generation starting without a settings modal once fallback keys resolve.

## Interfaces and Dependencies

`server.ts` must continue to expose `/api/health` and serve Vite middleware in non-production mode. Add or preserve a `GET /api/runtime-config` handler with a stable JSON shape:

    {
      devFallbackGeminiKey: string;
      devFallbackImageKey: string;
      devMode: boolean;
    }

`src/hooks/useApiKeys.ts` must continue to return:

    storedKeys: { geminiApiKey: string; imageApiKey: string }
    setKeys(next)
    clearKeys()
    resolvedGeminiKey: string
    resolvedImageKey: string
    hasResolvableKey: boolean
    isRuntimeConfigLoading: boolean

`src/components/BriefSummaryCard.tsx` should end this task with a generate button API that can express disabled/loading state, not just a blind click callback.