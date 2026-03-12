# Export-Related File Map

## UI

- `components/DownloadPanel.tsx` -- export UI panel with download buttons

## API Routes

- `app/api/runs/[runId]/export/html/route.ts` -- HTML whitepaper export endpoint
- `app/api/runs/[runId]/export/pdf/route.ts` -- PDF export endpoint
- `app/api/runs/[runId]/export/zip/route.ts` -- ZIP (JPEG) export endpoint

## Builders

- `lib/presentation-html-builder.ts` -- HTML whitepaper builder
- `lib/pdf-builder.ts` -- PDF builder

## Dependencies

- `package.json` -- no pptx dependency present (no pptxgenjs, no officegen, no docx/pptx libraries)
