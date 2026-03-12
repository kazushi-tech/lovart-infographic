/**
 * Flow Engine for Adaptive Interview
 *
 * 適応的インタビューのフロー制御エンジン
 * ユーザーの回答に基づいて次の質問を決定し、状態を管理する
 */

import { BriefQuestion } from './briefTypes';
import { allQuestions, findQuestionById } from './questionBank';

export type { BriefQuestion };

/**
 * フローの状態管理インターフェース
 */
export interface FlowState {
  /** 質問IDから回答値へのマップ */
  answers: Record<string, unknown>;
  /** 現在の質問インデックス（完了済み質問を基準にした順序） */
  currentQuestionIndex: number;
  /** 完了済み質問IDのリスト */
  completedQuestionIds: string[];
  /** フローが完了しているか */
  isComplete: boolean;
}

/**
 * 初期フロー状態を作成
 */
export function initializeFlow(): FlowState {
  return {
    answers: {},
    currentQuestionIndex: 0,
    completedQuestionIds: [],
    isComplete: false,
  };
}

/**
 * 回答を記録し、次の状態を生成
 *
 * @param state 現在のフロー状態
 * @param questionId 回答した質問のID
 * @param value 回答値
 * @returns 更新されたフロー状態
 */
export function answerQuestion(
  state: FlowState,
  questionId: string,
  value: unknown
): FlowState {
  // 質問が存在しない場合は変更なしで返す
  const question = findQuestionById(questionId);
  if (!question) {
    return state;
  }

  const newAnswers = { ...state.answers };
  const newCompletedIds = [...state.completedQuestionIds];

  // 回答を記録
  newAnswers[questionId] = value;

  // まだ完了済みリストに含まれていない場合は追加
  if (!newCompletedIds.includes(questionId)) {
    newCompletedIds.push(questionId);
  }

  // 次に進む
  const newIndex = newCompletedIds.length;

  // 完了判定
  const nextQuestion = getNextQuestion({
    ...state,
    answers: newAnswers,
    completedQuestionIds: newCompletedIds,
    currentQuestionIndex: newIndex,
  });

  return {
    answers: newAnswers,
    currentQuestionIndex: newIndex,
    completedQuestionIds: newCompletedIds,
    isComplete: nextQuestion === null,
  };
}

/**
 * 次に表示すべき質問を取得
 *
 * @param state 現在のフロー状態
 * @returns 次の質問、または完了時はnull
 */
export function getNextQuestion(state: FlowState): BriefQuestion | null {
  // 未完了かつ条件を満たす質問を取得
  const eligible = allQuestions.filter(
    (q) => !state.completedQuestionIds.includes(q.id) && q.shouldAsk(state.answers)
  );

  return eligible[0] || null;
}

/**
 * 前の質問に戻れるか判定
 *
 * @param state 現在のフロー状態
 * @returns 戻れる場合はtrue
 */
export function canGoBack(state: FlowState): boolean {
  return state.currentQuestionIndex > 0;
}

/**
 * 前の質問に戻る
 *
 * @param state 現在のフロー状態
 * @returns 更新されたフロー状態
 */
export function goBack(state: FlowState): FlowState {
  if (!canGoBack(state)) {
    return state;
  }

  return {
    ...state,
    currentQuestionIndex: state.currentQuestionIndex - 1,
    // 戻るときは完了判定をリセット（必須質問が未回答になる可能性があるため）
    isComplete: false,
  };
}

/**
 * 進捗情報を取得
 *
 * @param state 現在のフロー状態
 * @returns 進捗情報 { current: 現在の質問数, total: 総質問数 }
 */
export function getProgress(state: FlowState): { current: number; total: number } {
  const eligibleQuestions = allQuestions.filter((q) => q.shouldAsk(state.answers));
  return {
    current: state.completedQuestionIds.length,
    total: eligibleQuestions.length,
  };
}

/**
 * 進捗をパーセンテージで取得
 *
 * @param state 現在のフロー状態
 * @returns 0-100のパーセンテージ
 */
export function getProgressPercent(state: FlowState): number {
  const { current, total } = getProgress(state);
  return total === 0 ? 0 : Math.round((current / total) * 100);
}

/**
 * アクティブな質問一覧（条件を満たす質問）を取得
 *
 * @param state 現在のフロー状態
 * @returns 条件を満たす質問リスト
 */
export function getActiveQuestions(state: FlowState): BriefQuestion[] {
  return allQuestions.filter((q) => q.shouldAsk(state.answers));
}

/**
 * 必須質問がすべて回答済みか判定
 *
 * @param state 現在のフロー状態
 * @returns 全必須質問回答済みでtrue
 */
export function areRequiredQuestionsAnswered(state: FlowState): boolean {
  const activeQuestions = getActiveQuestions(state);
  const requiredQuestions = activeQuestions.filter((q) => q.required);
  return requiredQuestions.every((q) => state.answers[q.id] !== undefined);
}

/**
 * スキップ可能か判定
 *
 * @param state 現在のフロー状態
 * @param questionId 質問ID
 * @returns スキップ可能でtrue
 */
export function canSkip(state: FlowState, questionId: string): boolean {
  const question = findQuestionById(questionId);
  return question ? !question.required : false;
}

/**
 * 特定の質問の回答を更新（編集モード用）
 *
 * @param state 現在のフロー状態
 * @param questionId 更新する質問のID
 * @param value 新しい回答値
 * @returns 更新されたフロー状態
 */
export function updateAnswer(
  state: FlowState,
  questionId: string,
  value: unknown
): FlowState {
  const question = findQuestionById(questionId);
  if (!question) {
    return state;
  }

  const newAnswers = { ...state.answers };
  newAnswers[questionId] = value;

  // 完了判定を再計算
  const nextQuestion = getNextQuestion({
    ...state,
    answers: newAnswers,
  });

  return {
    ...state,
    answers: newAnswers,
    isComplete: nextQuestion === null && areRequiredQuestionsAnswered({ ...state, answers: newAnswers }),
  };
}

/**
 * 回答サマリーを取得
 *
 * @param state 現在のフロー状態
 * @returns 質問IDからサマリー文字列へのマップ
 */
export function getAnswerSummaries(state: FlowState): Record<string, string> {
  const summaries: Record<string, string> = {};

  for (const questionId of state.completedQuestionIds) {
    const question = findQuestionById(questionId);
    if (question && state.answers[questionId] !== undefined) {
      summaries[questionId] = question.summarize(state.answers[questionId]);
    }
  }

  return summaries;
}

/**
 * 未完了の質問一覧を取得
 *
 * @param state 現在のフロー状態
 * @returns 未完了の質問リスト
 */
export function getIncompleteQuestions(state: FlowState): BriefQuestion[] {
  const completedIds = new Set(state.completedQuestionIds);
  return allQuestions.filter(
    (q) => !completedIds.has(q.id) && q.shouldAsk(state.answers)
  );
}

/**
 * 回答済みの質問一覧を取得（質問オブジェクト付き）
 *
 * @param state 現在のフロー状態
 * @returns 回答済み質問とその値のリスト
 */
export function getAnsweredQuestions(
  state: FlowState
): Array<{ question: BriefQuestion; value: unknown }> {
  return state.completedQuestionIds
    .map((id) => {
      const question = findQuestionById(id);
      if (!question) return null;
      return { question, value: state.answers[id] };
    })
    .filter((item): item is { question: BriefQuestion; value: unknown } => item !== null);
}
