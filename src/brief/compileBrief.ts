/**
 * Brief Compilation Module
 *
 * 回答データから構造化されたブリーフとプロンプトテキストを生成する
 */

import { CompiledBrief } from './briefTypes';
import { findQuestionById } from './questionBank';

/**
 * 個別回答の要約を取得
 */
function summarizeAnswer(questionId: string, answers: Record<string, unknown>): string {
  const question = findQuestionById(questionId);
  const answer = answers[questionId];

  if (!question) {
    return String(answer ?? '');
  }

  if (answer === undefined || answer === null || answer === '') {
    return '';
  }

  return question.summarize(answer);
}

/**
 * インテントに基づく目的文の生成
 */
function generateObjectiveFromIntent(intent: string): string {
  const objectives: Record<string, string> = {
    executive: '経営層へ迅速かつ明確な情報を伝達するための要約資料',
    proposal: '提案内容を説得力のある形式で提示するための資料',
    comparison: '複数の選択肢や状況を比較・分析するための資料',
    plan: '計画・ロードマップを視覚的に示すための資料',
    report: '調査結果や現状を報告するための資料',
    'whitepaper-infographic': 'ホワイトペーパーの内容を視覚的なインフォグラフィックとして要約する資料',
  };
  return objectives[intent] || '情報を伝達するための資料';
}

/**
 * 出力ターゲットに基づく説明文の生成
 */
function generateOutputTargetSummary(outputTarget: string): string {
  const summaries: Record<string, string> = {
    'lovart-slides': '複数スライド構成のプレゼンテーション形式',
    'external-infographic-image': '単一画像としてのインフォグラフィック形式',
  };
  return summaries[outputTarget] || outputTarget;
}

/**
 * ソース素材タイプに基づく要約
 */
function generateSourceMaterialSummary(sourceType: string): string {
  const summaries: Record<string, string> = {
    'text-input': 'ユーザーが直接入力したテキスト',
    url: 'WebページのURLから参照したコンテンツ',
    'file-upload': 'アップロードされたファイルの内容',
    whitepaper: 'ホワイトペーパーの内容',
  };
  return summaries[sourceType] || '不明なソース形式';
}

/**
 * プロンプトテキストの生成
 */
function generatePromptText(
  brief: Pick<CompiledBrief,
    | 'title'
    | 'objective'
    | 'sourceMaterialSummary'
    | 'targetAudienceSummary'
    | 'intentSummary'
    | 'visualPriorities'
    | 'requiredInclusions'
    | 'deliveryConstraints'
    | 'slideGuidance'
    | 'externalImageGuidance'
  >,
  outputTarget: string
): string {
  let sections: string[] = [];

  sections.push(`## Objective`);
  sections.push(brief.objective);
  sections.push('');

  sections.push(`## Title`);
  sections.push(brief.title);
  sections.push('');

  if (brief.targetAudienceSummary) {
    sections.push(`## Target Audience`);
    sections.push(brief.targetAudienceSummary);
    sections.push('');
  }

  sections.push(`## Source Material`);
  sections.push(brief.sourceMaterialSummary);
  sections.push('');

  sections.push(`## Intent`);
  sections.push(brief.intentSummary);
  sections.push('');

  if (brief.visualPriorities) {
    sections.push(`## Visual Style`);
    sections.push(brief.visualPriorities);
    sections.push('');
  }

  if (brief.requiredInclusions.length > 0) {
    sections.push(`## Required Inclusions`);
    brief.requiredInclusions.forEach((inclusion) => {
      sections.push(`- ${inclusion}`);
    });
    sections.push('');
  }

  sections.push(`## Constraints`);
  brief.deliveryConstraints.forEach((constraint) => {
    sections.push(`- ${constraint}`);
  });
  sections.push('');

  // 出力ターゲット別の追加ガイダンス
  if (outputTarget === 'lovart-slides' && brief.slideGuidance) {
    sections.push(`## Slide Generation Guidance`);
    sections.push(brief.slideGuidance);
    sections.push('');
  } else if (outputTarget === 'external-infographic-image' && brief.externalImageGuidance) {
    sections.push(`## Infographic Generation Guidance`);
    sections.push(brief.externalImageGuidance);
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * ブリーフをコンパイルする
 *
 * @param answers - ユーザーの回答オブジェクト
 * @param options - オプション設定
 * @returns コンパイルされたブリーフ
 */
export function compileBrief(
  answers: Record<string, unknown>,
  options?: { includePromptText?: boolean }
): CompiledBrief {
  const { includePromptText = true } = options ?? {};

  const theme = summarizeAnswer('theme', answers);
  const intent = String(answers.intent ?? '');
  const outputTarget = String(answers.outputTarget ?? '');
  const sourceMaterialType = String(answers.sourceMaterialType ?? '');

  // タイトル生成
  const title = theme || '未指定テーマ';

  // 目的生成
  const objective = generateObjectiveFromIntent(intent);

  // ソース素材要約
  const sourceMaterialSummary = generateSourceMaterialSummary(sourceMaterialType);

  // ターゲットオーディエンス要約
  const targetAudienceSummary = summarizeAnswer('targetAudience', answers);

  // インテント要約
  const intentSummary = summarizeAnswer('intent', answers);

  // 出力ターゲット要約
  const outputTargetSummary = generateOutputTargetSummary(outputTarget);

  // 証拠の期待値（スライド用）
  const evidenceExpectations =
    outputTarget === 'lovart-slides'
      ? '出典を明示し、信頼性の高いデータと統計を使用する'
      : 'データと統計を引用し、出典を視覚的に明示する';

  // ビジュアル優先事項
  const visualPriorities = summarizeAnswer('slideStyle', answers) || 'プロフェッショナルで読みやすい';

  // 必須項目
  const requiredInclusions: string[] = [];
  const essentialClaims = summarizeAnswer('essentialClaims', answers);
  if (essentialClaims) {
    requiredInclusions.push(essentialClaims);
  }

  // 制約事項
  const deliveryConstraints: string[] = [
    outputTarget === 'lovart-slides'
      ? `スライド数: ${summarizeAnswer('slideCount', answers) || '標準'}`
      : `ビジュアルゾーン: ${summarizeAnswer('visualZones', answers) || '標準'}`,
    `トーン: ${summarizeAnswer('tone', answers) || 'プロフェッショナル'}`,
  ];

  // 引用表示の制約（インフォグラフィック用）
  if (outputTarget === 'external-infographic-image') {
    const showCitations = String(answers.showCitations);
    if (showCitations === 'false') {
      deliveryConstraints.push('引用を視覚的に表示しない');
    } else {
      deliveryConstraints.push('引用を視覚的に明示する');
    }

    const aspectRatio = summarizeAnswer('aspectRatio', answers);
    if (aspectRatio) {
      deliveryConstraints.push(aspectRatio);
    }
  }

  // スライド生成用ガイダンス
  let slideGuidance: string | undefined;
  if (outputTarget === 'lovart-slides') {
    const guidanceParts: string[] = [];
    if (theme) guidanceParts.push(`テーマ: ${theme}`);
    guidanceParts.push(`インテント: ${intentSummary}`);
    if (targetAudienceSummary) guidanceParts.push(`オーディエンス: ${targetAudienceSummary}`);
    guidanceParts.push(`スタイル: ${summarizeAnswer('slideStyle', answers) || 'プロフェッショナル'}`);
    guidanceParts.push(`スライド数: ${summarizeAnswer('slideCount', answers) || '標準'}`);
    guidanceParts.push(`トーン: ${summarizeAnswer('tone', answers) || 'プロフェッショナル'}`);
    slideGuidance = guidanceParts.join('\n');
  }

  // 外部インフォグラフィック用ガイダンス
  let externalImageGuidance: string | undefined;
  if (outputTarget === 'external-infographic-image') {
    const guidanceParts: string[] = [];
    if (theme) guidanceParts.push(`テーマ: ${theme}`);
    guidanceParts.push(`インテント: ${intentSummary}`);
    guidanceParts.push(`ビジュアルゾーン: ${summarizeAnswer('visualZones', answers) || '標準'}`);
    if (essentialClaims) guidanceParts.push(`必須クレーム: ${essentialClaims}`);
    if (answers.showCitations === 'false') guidanceParts.push('引用を表示しない');
    else guidanceParts.push('引用を視覚的に明示する');
    guidanceParts.push(`アスペクト比: ${summarizeAnswer('aspectRatio', answers) || '16:9'}`);
    externalImageGuidance = guidanceParts.join('\n');
  }

  // プロンプトテキスト生成
  let promptText = '';
  if (includePromptText) {
    promptText = generatePromptText(
      {
        title,
        objective,
        sourceMaterialSummary,
        targetAudienceSummary,
        intentSummary,
        visualPriorities,
        requiredInclusions,
        deliveryConstraints,
        slideGuidance,
        externalImageGuidance,
      },
      outputTarget
    );
  }

  return {
    title,
    objective,
    sourceMaterialSummary,
    targetAudienceSummary,
    intentSummary,
    outputTargetSummary,
    evidenceExpectations,
    visualPriorities,
    requiredInclusions,
    deliveryConstraints,
    slideGuidance,
    externalImageGuidance,
    promptText,
  };
}

/**
 * エクスポート用: 回答のみを受け取りプロンプトテキストを返す簡易関数
 */
export function generatePromptTextFromAnswers(answers: Record<string, unknown>): string {
  return compileBrief(answers).promptText;
}
