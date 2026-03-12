# Export Surface Audit

## Current Export Routes

| Route | Format | Editable | Novice-facing |
|-------|--------|----------|---------------|
| /export/html | Standalone HTML whitepaper | No (view only) | No (advanced) |
| /export/pdf | Image-per-page landscape PDF | No | Yes |
| /export/zip | JPEG slide images in ZIP | No | Yes |

## Missing Routes

- No `/export/pptx` route exists
- No pptxgenjs or similar dependency in package.json

## Format Details

- **PDF**: Each slide rendered as a full-page image in landscape orientation. Not editable.
- **ZIP**: Individual JPEG files for each slide. Not editable.
- **HTML**: Standalone whitepaper with embedded base64 images. View-only. Intended for web distribution.

## Audience Mapping

- **Novice primary**: PDF + ZIP
- **Operator / advanced**: HTML閲覧版
- **Removed from novice**: HTMLプレビュー (別タブ遷移 via window.open)

## Future Consideration

- Image-in-PPTX as an additional download option
- Must be labeled honestly: "PowerPoint形式（画像版）"
- Not a replacement for native editable PPTX
