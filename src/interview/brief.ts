// Brief compilation utilities

import type { BriefDraft } from './schema';

export interface BriefSummaryItem {
  label: string;
  value: string;
}

export function getBriefSummaryItems(brief: BriefDraft): BriefSummaryItem[] {
  const items: BriefSummaryItem[] = [];
  if (brief.theme) items.push({ label: 'テーマ', value: brief.theme });
  if (brief.styleLabel) items.push({ label: 'スタイル', value: brief.styleLabel });
  if (brief.slideCount) items.push({ label: 'スライド枚数', value: `${brief.slideCount}枚` });
  if (brief.targetAudience) items.push({ label: 'ターゲット', value: brief.targetAudience });
  if (brief.keyMessage) items.push({ label: 'キーメッセージ', value: brief.keyMessage });
  if (brief.tone) items.push({ label: 'トーン＆マナー', value: brief.tone });
  if (brief.supplementary) items.push({ label: '補足事項', value: brief.supplementary });
  return items;
}
