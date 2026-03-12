# Adaptive Brief Builder, Project History, and Resume-Friendly Creation Flow

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document must be maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

After this change, a user can start from a rough theme, answer a short sequence of relevant choices, and still end up with a rich long-form prompt without typing a long prompt up front. The product will stop asking the same fixed questions for every topic. Instead, it will adapt its follow-up questions to the user’s goal, source material, and output target. A user who created work earlier will be able to reopen it, review what was generated, duplicate it, and continue editing after a page reload.

This plan also addresses the specific “whitepaper to infographic image” use case. In this repository, that means collecting the right assumptions and packaging the brief for an external infographic-image workflow without assuming direct Nano Banana integration. The app should understand that “generate Lovart slides” and “prepare a prompt package for an external infographic image” are different jobs, even when both begin from the same theme.

This plan intentionally does not add cloud sync, user accounts, or direct Nano Banana API integration. It is a local-first product experience improvement for the current standalone repository.

## Progress

- [x] (2026-03-12 06:15Z) Audited the current onboarding, interview flow, generation prompt path, and persistence gaps in `src/components/AppShell.tsx`, `src/components/ChatInterviewSidebar.tsx`, `src/services/geminiService.ts`, `src/hooks/useApiKeys.ts`, and `server.ts`.
- [x] (2026-03-12 06:39Z) Revised the plan after Plan Gate findings so shared-type ownership, IndexedDB schema upgrade behavior, and timestamp formatting are explicitly specified before implementation.
- [ ] (2026-03-12 06:15Z) Create a local-first project record and storage layer that can reopen past work without storing API keys.
- [ ] (2026-03-12 06:15Z) Replace the fixed interview with an adaptive question engine driven by intent, source material, and output target.
- [ ] (2026-03-12 06:15Z) Add a start experience that prioritizes guided creation, detailed brief paste-in, and recent project resume, while removing sample-first UX from the default path.
- [ ] (2026-03-12 06:15Z) Compile guided answers into a structured brief plus inspectable long-form prompt text for both slide generation and external infographic-image packaging.
- [ ] (2026-03-12 06:15Z) Validate the implementation with lint/build/manual scenarios and run the required review gates.

## Surprises & Discoveries

- Observation: The current product has no resumable project history at all. Only API keys are persisted.
  Evidence: `src/hooks/useApiKeys.ts` reads and writes localStorage keys for API credentials, while `src/components/AppShell.tsx` keeps interview answers, chat messages, slides, and edit state entirely in React memory.

- Observation: The interview is fully hard-coded and does not branch by topic or use case.
  Evidence: `src/components/AppShell.tsx` defines a single `QUESTIONS` array and advances through it linearly regardless of the theme, audience, source material, or delivery goal.

- Observation: The welcome state still promotes “サンプルで試す”, which conflicts with the requested product direction.
  Evidence: `src/components/ChatInterviewSidebar.tsx` renders a prominent sample-start button when the only message is `welcome-msg`, and `src/components/AppShell.tsx` contains `handleFillSampleBrief()`.

- Observation: The generation prompt only understands a fixed slide deck brief and cannot represent an external infographic-image target.
  Evidence: `src/services/geminiService.ts` builds its prompt from `theme`, `targetAudience`, `keyMessage`, `styleId`, `slideCount`, `tone`, and `supplementary`, then forces page-kind sequences tied only to 3/5/8/10 slides.

- Observation: Generated background images are large `data:` URLs, which makes `localStorage` the wrong persistence layer for project history.
  Evidence: `src/services/geminiService.ts` returns base64 `data:<mime>;base64,...` strings from `generateBackgroundImage()`, and browser `localStorage` is only suitable for small key/value payloads.

- Observation: Core app types that the plan wants to persist are still defined inside `src/demoData.ts`, which is a poor long-term ownership boundary for production state.
  Evidence: `src/demoData.ts` currently exports `ChatMessage`, `InterviewData`, `SlideData`, and related shape definitions, while the plan also needs those same shapes for saved project records.

## Decision Log

- Decision: Use a local-first project history backed by IndexedDB, not `localStorage` and not a new server database.
  Rationale: This repository is a standalone SPA with a very small Express server. Project snapshots may include many slides and base64 images, so `localStorage` is too small, while a database-backed server feature would greatly expand scope.
  Date/Author: 2026-03-12 / Codex

- Decision: Make `theme + source material + output target` the first adaptive pivot, with `intent` derived or selected immediately after.
  Rationale: The user wants to begin from a rough theme or a high-level direction, not from a long free-form prompt. Those first answers are enough to determine which later questions are relevant.
  Date/Author: 2026-03-12 / Codex

- Decision: Keep a “paste a detailed brief” path, but make guided choice-based entry the default and recommended path.
  Rationale: Some users still prefer a long prompt, but the product should help the common case instead of assuming the user must know how to write one.
  Date/Author: 2026-03-12 / Codex

- Decision: Treat “whitepaper to external infographic image” as a prompt-packaging target, not as a direct integration with Nano Banana.
  Rationale: Repository rules explicitly forbid assuming Nano Banana integration, but the product can still collect the right brief fields and assemble an output package tailored for that downstream use.
  Date/Author: 2026-03-12 / Codex

- Decision: Remove sample-first onboarding from the default user path and keep any sample seed only behind a development-only escape hatch if the team still needs it for QA.
  Rationale: The requested experience is about real work resumption and guided brief construction, not demo-driving from a sample.
  Date/Author: 2026-03-12 / Codex

- Decision: Reuse the intent taxonomy ideas from `.agent/skills/guided-intent-wiring` but adapt them to this repository instead of copying old-repo file paths or workflow assumptions.
  Rationale: The concept is useful, but the repository instructions explicitly warn that old-repo wiring references must not be assumed here.
  Date/Author: 2026-03-12 / Codex

- Decision: Move durable shared domain types out of `src/demoData.ts` into a production-owned module before defining persisted project records.
  Rationale: `ProjectRecord` depends on `ChatMessage`, `InterviewData`, and `SlideData`. Leaving those in a demo-only file would create unclear ownership and encourage circular imports between mock data and production state.
  Date/Author: 2026-03-12 / Codex

- Decision: Fix persisted timestamps to UTC ISO 8601 strings created by `new Date().toISOString()`, and localize only at render time.
  Rationale: The history list and autosave logic need deterministic, sortable timestamps. ISO 8601 UTC strings are stable across machines, easy to compare, and remove ambiguity from the plan.
  Date/Author: 2026-03-12 / Codex

- Decision: Define the initial IndexedDB schema and `onupgradeneeded` behavior in the plan instead of deferring it to implementation time.
  Rationale: Versioned client storage is part of the feature contract, not an incidental detail. The migration entry point must be explicit before code is written.
  Date/Author: 2026-03-12 / Codex

## Outcomes & Retrospective

At the time of writing, this plan exists because the recent completed work fixed runtime config and key gating but did not address the user-facing creation journey. The user’s core complaint is not about API keys; it is about product continuity and relevance. The current app forgets created work, asks nearly the same questions every time, and forces the user either into a fixed questionnaire or a manual prompt-writing burden. This plan reframes the next milestone around product usability rather than infrastructure hardening.

## Context and Orientation

The current application is a Vite + React SPA hosted by `server.ts`. Nearly all product state lives inside `src/components/AppShell.tsx`. That file currently owns the welcome state, the fixed interview question order, the sample-fill shortcut, the generation trigger, the generated slides, and the manual slide editing state. `src/components/ChatInterviewSidebar.tsx` renders the welcome choices, message list, composer, step progress, and summary card. `src/components/BriefSummaryCard.tsx` shows the final brief summary and the generate button. `src/services/geminiService.ts` converts a narrow `InterviewData` object into a Gemini prompt and slide JSON. `src/hooks/useApiKeys.ts` is currently the only persistence mechanism in the app, and it stores only API keys. The main domain shapes that matter to this feature, including `ChatMessage`, `InterviewData`, and `SlideData`, currently live in `src/demoData.ts`, which is acceptable for mock rendering but should not remain the ownership source once project history becomes a production feature.

For this plan, “project history” means a durable local record that contains the user’s chosen mode, structured answers, compiled brief, chat transcript, generated slides, edit state, and timestamps so the user can return later. “Adaptive brief” means the ordered set of follow-up questions changes based on earlier answers instead of always using the same fixed seven-step script. “Output target” means the user is not only describing content but also where that content is going. In this repository the two supported targets after implementation should be `lovart-slides` and `external-infographic-image`. The latter does not call an external system directly; it changes the question flow and the prompt packaging.

Because `generateBackgroundImage()` produces large base64 strings, project persistence must handle bigger blobs than typical UI preferences. That is why this plan uses IndexedDB rather than extending the current `localStorage` pattern. API keys must remain outside project history records so that duplicating, exporting, or reopening a project never leaks credentials. Persisted timestamps in that history must be written as UTC ISO 8601 strings using `toISOString()`. UI labels such as “2 minutes ago” can be derived later, but the stored source of truth must remain a stable machine-readable string.

## Skills and Team Topology

Use the repository’s skills-and-teams discipline rather than treating this as one undifferentiated refactor.

Team A is the History and Persistence team. It owns the project record shape, the IndexedDB layer, autosave timing, and the history/resume UI. This team should keep credentials out of saved project data and should prove that a refresh no longer destroys user work.

Team B is the Adaptive Interview team. It owns the new brief schema, the question bank, the intent and source-material branching rules, and the dynamic progress model. This team should adapt the concepts from `.agent/skills/guided-intent-wiring` without copying any invalid old-repo file assumptions.

Team C is the Prompt Assembly and Generation Wiring team. It owns the conversion from structured answers into a compiled brief, an inspectable long-form prompt, and the current Gemini slide-generation prompt. This team also owns the external infographic-image prompt package, but not any external service integration.

Team D is the Review and UX Quality Gate team. It owns `codex-review` for plan and implementation gates, and after visual-output changes it should run the relevant valid local review skills such as `business-slide-review-gate` and `infographic-benchmark-review` if the implementation materially changes slide quality.

## Plan of Work

The first milestone is to introduce a real project shell instead of treating the current session as disposable. Start by extracting durable shared types from `src/demoData.ts` into a production-owned module such as `src/types/domain.ts`, then make both demo fixtures and persisted project records import from that module. After that, add a dedicated project record model and a storage helper that writes to IndexedDB. The project record must include identifiers, timestamps, status, interview mode, output target, chat messages, structured answers, compiled brief text, slides, and enough metadata to render a “recent projects” list quickly. It must explicitly exclude API keys. The product should autosave on meaningful state transitions: after each answer, after generation completes, after slide edits, and when the user renames or duplicates a project. Store the last-opened project identifier separately as a small preference so a page refresh can reopen the most recent project even before the full history list is rendered.

The initial IndexedDB contract should be concrete. Use a database name of `lovart-project-history` and start with version `1`. In `onupgradeneeded`, if `oldVersion < 1`, create an object store named `projects` with `keyPath: 'id'` and indexes named `byUpdatedAt`, `byCreatedAt`, `byStatus`, and `byOutputTarget`. Future schema changes must follow the pattern `if (oldVersion < N) { ... }` so upgrades remain additive and predictable. The last-active project identifier does not need its own object store; it can live in a tiny session preference helper because it is a single small value rather than part of the project-history dataset.

The second milestone is to replace the hard-coded `QUESTIONS` array in `src/components/AppShell.tsx` with an adaptive brief engine. The first screen should present three production-facing entry paths: start from a rough theme, paste a detailed brief, or reopen recent work. If the user chooses the guided path, the first questions should establish the theme, the source material type, the output target, and the broad intent. The broad intent can reuse the ideas from the repository’s partial `guided-intent-wiring` skill, but it must be expressed in files that belong to this repo, such as a local question bank and intent-profile module. After that, the flow should ask only relevant follow-ups.

For example, a slide-deck request should still ask about style, slide count, audience, tone, and message hierarchy, because those inputs affect the current renderer. A whitepaper-to-external-infographic-image request should instead ask about the source document status, the must-keep claims, how many visual zones or sections the final image should contain, whether citations or source notes must be visible, whether the language should stay close to the whitepaper or become more concise, and what aspect ratio or canvas size is expected. The point is not to add more questions everywhere; it is to ask fewer but more relevant questions.

The third milestone is to compile the adaptive answers into a structured brief contract. The current app jumps directly from `InterviewData` to a prompt string. That is too narrow for resume, inspection, and branching. Introduce a richer intermediate object that can be stored, displayed, and rendered in more than one way. It should describe the business objective, audience, source material, intent, output target, tone, evidence expectations, visual priorities, required inclusions, forbidden omissions, and delivery constraints. The UI should expose this compiled brief in a human-readable summary and an optional “compiled prompt” panel. This is the point where the choice-based flow becomes the long prompt the user was asking for.

The fourth milestone is to wire the compiled brief back into generation without breaking the current product. For `lovart-slides`, `src/services/geminiService.ts` should stop reading only the old fixed brief fields and should instead render a prompt from the compiled brief. The slide page-kind sequence should be intent-aware rather than governed only by slide count. For `external-infographic-image`, the UI should produce a prompt package and save it into project history even if the repository does not yet render that target directly. That package should be easy to inspect, copy, and revise from the history screen.

The fifth milestone is to update the product surface so the new model is visible and usable. `src/components/AppHeader.tsx` should gain a stable way to open recent projects. The welcome experience should no longer show `サンプルで試す` in normal operation. `src/components/InterviewProgress.tsx` should derive its total step count from the active question sequence, not from a fixed number seven. `src/components/BriefSummaryCard.tsx` should show the chosen output target and source material summary, plus affordances to continue editing, save as draft, or inspect the compiled prompt. `src/components/ChatInterviewSidebar.tsx` and `src/components/ChatComposer.tsx` should remain the primary interaction surface, but they must now support a mixture of text questions and choice-first questions that are driven by the adaptive flow model rather than hard-coded conditionals.

## Concrete Steps

Work from the repository root `C:\Users\PEM N-266\work\lovart-infographic`.

1. Create the project-history model and storage primitives.

    - Add `src/types/domain.ts` and move durable app types such as `ChatMessage`, `InterviewData`, `SlideData`, `ElementData`, `StyleOption`, and supporting unions there.
    - Update `src/demoData.ts` to import those shared types from `src/types/domain.ts` and remain responsible only for mock values and demo presets.
    - Add `src/types/project.ts` for persisted project types.
    - Add `src/lib/projectStore.ts` for IndexedDB open/list/get/save/delete/duplicate helpers.
    - Add a tiny session-preference helper such as `src/lib/projectSessionPrefs.ts` for the last-active project id.
    - Add `src/hooks/useProjectHistory.ts` for React-facing project-history state and autosave orchestration.
    - In `src/lib/projectStore.ts`, implement `onupgradeneeded` with explicit version guards. Version 1 creates the `projects` store and the indexes `byUpdatedAt`, `byCreatedAt`, `byStatus`, and `byOutputTarget`.
    - Normalize all stored timestamps through a small helper that returns `new Date().toISOString()` so `createdAt` and `updatedAt` are always UTC ISO 8601 strings.

2. Add the adaptive brief model.

    - Add `src/brief/briefTypes.ts` for question, answer, and compiled-brief contracts.
    - Add `src/brief/intentProfiles.ts` for intent definitions adapted from the valid ideas in `guided-intent-wiring`.
    - Add `src/brief/questionBank.ts` for core questions and branch-specific question groups.
    - Add `src/brief/flowEngine.ts` for “given current answers, what question comes next and how many steps remain?”
    - Add `src/brief/compileBrief.ts` for converting answers into human-readable summary text and long-form prompt text.

3. Refactor the UI to consume those models.

    - Update `src/components/AppShell.tsx` to own a project session instead of raw ad hoc state only.
    - Add a new start surface such as `src/components/StartWorkspace.tsx`.
    - Add a recent-project UI such as `src/components/ProjectHistoryPanel.tsx` or `src/components/ProjectHistoryDrawer.tsx`.
    - Add a compiled-prompt inspector such as `src/components/CompiledPromptPanel.tsx`.
    - Update `src/components/ChatInterviewSidebar.tsx`, `src/components/InterviewProgress.tsx`, `src/components/ChatComposer.tsx`, and `src/components/BriefSummaryCard.tsx` to use adaptive questions and project metadata.

4. Rewire generation.

    - Update `src/services/geminiService.ts` to accept a compiled brief instead of only the legacy `InterviewData` shape.
    - Preserve existing slide generation for `lovart-slides`.
    - Add a non-generating prompt-package output for `external-infographic-image` if the repository still lacks a renderer for that target.

5. Add validation coverage.

    - Add lightweight tests under `tests/` or `__tests__/` using the existing toolchain pattern with `tsx --test`.
    - Use `fake-indexeddb` or an equivalent browser-safe test shim so the project-store tests can execute in Node without a real browser.
    - Cover the flow engine, compiled brief generation, and project-store serialization.

6. Run the review gate and runtime checks.

    - Run the plan review immediately after the plan file changes.
    - After implementation, run lint, build, tests, and the required review gate loop until Critical and Major findings are zero.

The implementation commands should look like the following once the files exist:

    npm run lint
    npm run build
    npx tsx --test tests/brief-flow.test.ts
    npx tsx --test tests/project-store.test.ts
    npm run dev

After `npm run dev`, open `http://localhost:3000`, create a new guided project, answer several questions, reload the page, and verify the project reopens from history instead of resetting.

## Validation and Acceptance

The change is acceptable only if all of the following user-visible behaviors are true.

- A first-time user sees a start experience centered on guided creation, detailed brief paste-in, and recent work. The default path does not advertise `サンプルで試す`.
- A user can choose “rough theme” mode, provide only a theme plus a few choices, and still reach a compiled long-form prompt without hand-writing one.
- The question flow adapts. A slide-deck request and a whitepaper-to-external-infographic-image request do not ask the same follow-up questions in the same order.
- A user can paste a detailed brief and is then asked only for missing decisions, not the full generic questionnaire again.
- A generated or draft project appears in history with a meaningful title and last-updated time, survives a reload, and can be reopened.
- Every saved project record uses `createdAt` and `updatedAt` in UTC ISO 8601 string format, and the history list sorts correctly by `updatedAt`.
- Duplicating a project creates a new history entry without overwriting the original.
- Deleting a project removes it from history without affecting stored API keys.
- The compiled brief or prompt package is inspectable from the UI and reflects the answers collected through the guided flow.
- For `lovart-slides`, generation still succeeds through the current Gemini path and the resulting project snapshot is saved back into history.
- No project record stores `GEMINI_API_KEY`, `API_KEY`, or any other credential value.
- `npm run lint` passes.
- `npm run build` passes.
- The new targeted tests pass.
- `codex-review` returns no Critical or Major findings for the final implementation.

## Idempotence and Recovery

This work should be repeatable without damaging existing local projects. The IndexedDB store must use a versioned schema so that adding fields later does not silently corrupt prior records. The schema entry point is `onupgradeneeded`, and each future migration must be guarded by `if (oldVersion < N)` rather than replacing the whole setup block. Autosave should be debounced or otherwise stabilized so that frequent keystrokes do not create racing writes. The safe fallback for a malformed project record is to ignore that record, log a warning in development, and keep the rest of the history usable.

Because this is a local-first feature, rollback must also be local-safe. If a bad migration ships during development, the recovery path should be an explicit “reset local project history” action or a documented IndexedDB deletion step, not an implicit destructive wipe during app startup. The implementation must never clear API keys when a user deletes project history, because credential storage and project history serve different purposes and different lifetimes.

## Artifacts and Notes

The implementation summary should capture a small set of concrete evidence:

    Start screen options:
    - Start from theme
    - Paste detailed brief
    - Resume recent project

    Example history card metadata:
    - Title: 2026 AI Strategy Whitepaper
    - Target: external-infographic-image
    - Status: draft
    - Updated: 2 minutes ago

    Example compiled-brief headings:
    - Objective
    - Source material
    - Audience
    - Output target
    - Must-keep claims
    - Visual priorities
    - Delivery constraints

If the team keeps a development-only sample path, document the exact flag or condition that reveals it and confirm that it is hidden in normal user operation.

## Interfaces and Dependencies

At the end of this work, the codebase should expose stable project-history and adaptive-brief interfaces with names close to the following.

In `src/types/domain.ts`, define or move:

    export interface ElementData {
      id: string;
      type: 'text' | 'kpi' | 'card';
      content: string;
      x: number;
      y: number;
      width?: number;
      fontSize?: number;
      color?: string;
      fontWeight?: string;
      textAlign?: 'left' | 'center' | 'right';
    }

    export type PageKind =
      | 'cover'
      | 'executive-summary'
      | 'problem-analysis'
      | 'comparison'
      | 'roadmap'
      | 'deep-dive'
      | 'decision-cta';

    export interface SlideData {
      id: string;
      pageNumber: number;
      title: string;
      imageUrl: string;
      bgPrompt?: string;
      elements: ElementData[];
      pageKind?: PageKind;
      eyebrow?: string;
      headline?: string;
      subheadline?: string;
      facts?: string[];
      kpis?: { label: string; value: string; unit: string }[];
      sections?: { title: string; bullets: string[] }[];
      comparisonRows?: { topic: string; current: string; future: string }[];
      roadmapPhases?: { phase: number; title: string; bullets: string[] }[];
      actionItems?: string[];
      takeaways?: string[];
      sourceNote?: string;
    }

    export interface StyleOption {
      id: string;
      label: string;
      desc?: string;
      imageUrl?: string;
    }

    export interface InterviewData {
      theme: string;
      targetAudience: string;
      keyMessage: string;
      styleId: string;
      slideCount?: string;
      tone?: string;
      supplementary: string;
    }

    export type InputMode = 'text' | 'options' | 'none';
    export type MessageStatus = 'sending' | 'sent' | 'error';

    export interface ChatMessage {
      id: string;
      role: 'ai' | 'user' | 'system' | 'assistant';
      text: string;
      options?: StyleOption[];
      optionsType?: 'grid' | 'list';
      inputMode?: InputMode;
      status?: MessageStatus;
      timestamp: number;
    }

In `src/types/project.ts`, define:

    export type ProjectStatus = 'draft' | 'generated';
    export type EntryMode = 'guided' | 'detailed-brief';
    export type SourceMaterialType =
      | 'theme-only'
      | 'notes'
      | 'whitepaper'
      | 'report'
      | 'proposal';
    export type OutputTarget = 'lovart-slides' | 'external-infographic-image';

    export interface ProjectRecord {
      id: string;
      title: string;
      createdAt: string;
      updatedAt: string;
      status: ProjectStatus;
      entryMode: EntryMode;
      sourceMaterialType: SourceMaterialType;
      outputTarget: OutputTarget;
      briefAnswers: Record<string, unknown>;
      compiledBriefText: string;
      compiledPromptText: string;
      chatMessages: ChatMessage[];
      interviewData: Partial<InterviewData>;
      slides: SlideData[];
      activeSlideId: string | null;
      selectedElementId: string | null;
      thumbnailDataUrl?: string;
      schemaVersion: number;
    }

`createdAt` and `updatedAt` must be UTC ISO 8601 strings produced by `new Date().toISOString()`. Display formatting is a UI concern and must not change the persisted format.

In `src/lib/projectStore.ts`, define functions close to:

    openProjectStore(): Promise<IDBDatabase>
    listProjects(): Promise<ProjectRecord[]>
    getProject(id: string): Promise<ProjectRecord | null>
    saveProject(project: ProjectRecord): Promise<void>
    deleteProject(id: string): Promise<void>
    duplicateProject(id: string): Promise<ProjectRecord>

The database contract for version 1 should be:

    DB name: 'lovart-project-history'
    Version: 1
    Object store: 'projects' (keyPath: 'id')
    Indexes:
      - 'byUpdatedAt' on 'updatedAt'
      - 'byCreatedAt' on 'createdAt'
      - 'byStatus' on 'status'
      - 'byOutputTarget' on 'outputTarget'

`onupgradeneeded` should follow this shape:

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      if (oldVersion < 1) {
        const store = db.createObjectStore('projects', { keyPath: 'id' });
        store.createIndex('byUpdatedAt', 'updatedAt');
        store.createIndex('byCreatedAt', 'createdAt');
        store.createIndex('byStatus', 'status');
        store.createIndex('byOutputTarget', 'outputTarget');
      }
    };

Future migrations must append guarded branches rather than rewriting earlier ones.

In `src/lib/projectSessionPrefs.ts`, define helpers close to:

    getLastActiveProjectId(): string | null
    setLastActiveProjectId(id: string): void
    clearLastActiveProjectId(): void

In `src/brief/briefTypes.ts`, define:

    export type BriefIntent =
      | 'executive'
      | 'proposal'
      | 'comparison'
      | 'plan'
      | 'report'
      | 'whitepaper-infographic';

    export interface BriefQuestionOption {
      id: string;
      label: string;
      description?: string;
    }

    export interface BriefQuestion {
      id: string;
      prompt: string;
      inputMode: 'text' | 'single-choice' | 'multi-choice' | 'textarea';
      required: boolean;
      category: 'core' | 'intent' | 'source' | 'structure' | 'style' | 'delivery';
      options?: BriefQuestionOption[];
      shouldAsk: (answers: Record<string, unknown>) => boolean;
      summarize: (answer: unknown) => string;
    }

    export interface CompiledBrief {
      title: string;
      objective: string;
      sourceMaterialSummary: string;
      targetAudienceSummary: string;
      intentSummary: string;
      outputTargetSummary: string;
      evidenceExpectations: string;
      visualPriorities: string;
      requiredInclusions: string[];
      deliveryConstraints: string[];
      slideGuidance?: string;
      externalImageGuidance?: string;
      promptText: string;
    }

`src/services/geminiService.ts` should end this task with a slide-generation entry point that accepts a compiled brief or a narrow adapter built from it. Do not let the adaptive-flow work create two separate prompt dialects that drift apart. There must be one canonical compiled-brief representation, with a clear adapter for the current Gemini slide path.

For tests, use the current TypeScript + `tsx --test` toolchain and add `fake-indexeddb` as a dev dependency if the implementation keeps real IndexedDB coverage in Node. If the team later chooses a different test shim, update this section and the concrete commands together so the plan stays executable.

Change Note (2026-03-12 / Codex): Initial plan created in response to user feedback that the product needs resumable creation history, theme-aware adaptive questioning, and a choice-driven path that compiles into a long prompt without requiring the user to author that prompt manually.
Change Note (2026-03-12 / Codex): Revised after Plan Gate feedback to explicitly move shared domain types out of `src/demoData.ts`, define the initial IndexedDB schema and `onupgradeneeded` behavior, and fix persisted timestamps to UTC ISO 8601 format.
