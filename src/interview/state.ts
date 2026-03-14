// Interview wizard state management (reducer)

import {
  InterviewFieldId,
  AnswerEntry,
  BriefDraft,
  AdaptiveQuestionPacket,
  INTERVIEW_STEPS,
  SAMPLE_ANSWERS,
} from './schema';
import { assessAnswerQuality, type BriefQualityResult } from './answerQuality';

/** A follow-up answer keyed by the follow-up packet id */
export interface FollowUpAnswerEntry {
  followUpId: string;
  parentFieldId: InterviewFieldId;
  value: string;
  label: string;
  source: 'choice' | 'text' | 'follow-up';
  promptHint?: string;
}

export interface InterviewWizardState {
  activeStepIndex: number;
  answers: Partial<Record<InterviewFieldId, AnswerEntry>>;
  /** Currently active follow-up question (shown instead of next base step) */
  currentFollowUp: AdaptiveQuestionPacket | null;
  /** Base step index that triggered the current follow-up */
  followUpParentStepIndex: number | null;
  /** Step index to resume after the current follow-up is completed */
  followUpResumeStepIndex: number | null;
  /** Phase to return to after the current follow-up is completed */
  followUpReturnPhase: 'collecting' | 'review' | null;
  /** Completed follow-up answers */
  followUpAnswers: FollowUpAnswerEntry[];
  phase: 'idle' | 'collecting' | 'follow-up' | 'review';
}

export type WizardAction =
  | { type: 'answer'; fieldId: InterviewFieldId; entry: AnswerEntry }
  | { type: 'back' }
  | { type: 'goToStep'; index: number }
  | { type: 'loadSample' }
  | { type: 'startInterview' }
  | { type: 'reset' }
  | {
      type: 'showFollowUp';
      packet: AdaptiveQuestionPacket;
      parentStepIndex: number;
      resumeStepIndex: number;
      returnPhase: 'collecting' | 'review';
    }
  | { type: 'answerFollowUp'; answer: FollowUpAnswerEntry }
  | { type: 'skipFollowUp' };

export function createInitialWizardState(): InterviewWizardState {
  return {
    activeStepIndex: 0,
    answers: {},
    currentFollowUp: null,
    followUpParentStepIndex: null,
    followUpResumeStepIndex: null,
    followUpReturnPhase: null,
    followUpAnswers: [],
    phase: 'idle',
  };
}

export function interviewWizardReducer(
  state: InterviewWizardState,
  action: WizardAction
): InterviewWizardState {
  switch (action.type) {
    case 'answer': {
      const newAnswers = { ...state.answers, [action.fieldId]: action.entry };
      const remainingFollowUps = state.followUpAnswers.filter(
        answer => answer.parentFieldId !== action.fieldId
      );
      const nextIndex = state.activeStepIndex + 1;
      const isLastStep = nextIndex >= INTERVIEW_STEPS.length;
      return {
        ...state,
        answers: newAnswers,
        currentFollowUp: null,
        followUpParentStepIndex: null,
        followUpResumeStepIndex: null,
        followUpReturnPhase: null,
        followUpAnswers: remainingFollowUps,
        activeStepIndex: isLastStep ? state.activeStepIndex : nextIndex,
        phase: isLastStep ? 'review' : 'collecting',
      };
    }
    case 'back': {
      // If in follow-up, go back to the base step
      if (state.phase === 'follow-up' && state.currentFollowUp) {
        if (state.followUpReturnPhase === 'review') {
          return {
            ...state,
            currentFollowUp: null,
            followUpParentStepIndex: null,
            followUpResumeStepIndex: null,
            followUpReturnPhase: null,
            phase: 'review',
          };
        }
        return {
          ...state,
          currentFollowUp: null,
          activeStepIndex: state.followUpParentStepIndex ?? state.activeStepIndex,
          followUpParentStepIndex: null,
          followUpResumeStepIndex: null,
          followUpReturnPhase: null,
          phase: 'collecting',
        };
      }
      if (state.phase === 'review') {
        return {
          ...state,
          activeStepIndex: INTERVIEW_STEPS.length - 1,
          phase: 'collecting',
        };
      }
      if (state.activeStepIndex <= 0) return state;
      return {
        ...state,
        activeStepIndex: state.activeStepIndex - 1,
        phase: 'collecting',
      };
    }
    case 'goToStep': {
      const idx = Math.max(0, Math.min(action.index, INTERVIEW_STEPS.length - 1));
      return {
        ...state,
        activeStepIndex: idx,
        currentFollowUp: null,
        followUpParentStepIndex: null,
        followUpResumeStepIndex: null,
        followUpReturnPhase: null,
        phase: 'collecting',
      };
    }
    case 'loadSample': {
      return {
        activeStepIndex: INTERVIEW_STEPS.length - 1,
        answers: { ...SAMPLE_ANSWERS },
        currentFollowUp: null,
        followUpParentStepIndex: null,
        followUpResumeStepIndex: null,
        followUpReturnPhase: null,
        followUpAnswers: [],
        phase: 'review',
      };
    }
    case 'startInterview': {
      return {
        ...state,
        activeStepIndex: 0,
        phase: 'collecting',
      };
    }
    case 'reset': {
      return createInitialWizardState();
    }
    case 'showFollowUp': {
      return {
        ...state,
        currentFollowUp: action.packet,
        followUpParentStepIndex: action.parentStepIndex,
        followUpResumeStepIndex: action.resumeStepIndex,
        followUpReturnPhase: action.returnPhase,
        phase: 'follow-up',
      };
    }
    case 'answerFollowUp': {
      const newFollowUpAnswers = [
        ...state.followUpAnswers.filter(
          a => a.followUpId !== action.answer.followUpId && a.parentFieldId !== action.answer.parentFieldId
        ),
        action.answer,
      ];
      return {
        ...state,
        currentFollowUp: null,
        followUpParentStepIndex: null,
        followUpResumeStepIndex: null,
        followUpReturnPhase: null,
        followUpAnswers: newFollowUpAnswers,
        activeStepIndex: state.followUpResumeStepIndex ?? state.activeStepIndex,
        phase: state.followUpReturnPhase ?? 'collecting',
      };
    }
    case 'skipFollowUp': {
      return {
        ...state,
        currentFollowUp: null,
        followUpParentStepIndex: null,
        followUpResumeStepIndex: null,
        followUpReturnPhase: null,
        activeStepIndex: state.followUpResumeStepIndex ?? state.activeStepIndex,
        phase: state.followUpReturnPhase ?? 'collecting',
      };
    }
    default:
      return state;
  }
}

export function buildBriefDraft(answers: Partial<Record<InterviewFieldId, AnswerEntry>>): BriefDraft {
  return {
    theme: answers.theme?.value ?? '',
    styleId: answers.styleId?.value,
    styleLabel: answers.styleId?.label,
    slideCount: answers.slideCount?.value,
    targetAudience: answers.targetAudience?.label,
    keyMessage: answers.keyMessage?.label,
    tone: answers.tone?.label,
    supplementary: answers.supplementary?.label,
    evidenceMode: 'auto',
  };
}

/**
 * Assess the quality of all collected answers.
 * Returns flags for critical/warning issues that need attention.
 */
export function buildBriefQuality(
  answers: Partial<Record<InterviewFieldId, AnswerEntry>>,
  followUpAnswers: FollowUpAnswerEntry[] = []
): BriefQualityResult {
  return assessAnswerQuality(answers, followUpAnswers);
}
