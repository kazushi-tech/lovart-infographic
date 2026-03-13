// Interview wizard state management (reducer)

import {
  InterviewFieldId,
  AnswerEntry,
  BriefDraft,
  INTERVIEW_STEPS,
  SAMPLE_ANSWERS,
} from './schema';

export interface InterviewWizardState {
  activeStepIndex: number;
  answers: Partial<Record<InterviewFieldId, AnswerEntry>>;
  phase: 'idle' | 'collecting' | 'review';
}

export type WizardAction =
  | { type: 'answer'; fieldId: InterviewFieldId; entry: AnswerEntry }
  | { type: 'back' }
  | { type: 'goToStep'; index: number }
  | { type: 'loadSample' }
  | { type: 'reset' };

export function createInitialWizardState(): InterviewWizardState {
  return {
    activeStepIndex: 0,
    answers: {},
    phase: 'collecting',
  };
}

export function interviewWizardReducer(
  state: InterviewWizardState,
  action: WizardAction
): InterviewWizardState {
  switch (action.type) {
    case 'answer': {
      const newAnswers = { ...state.answers, [action.fieldId]: action.entry };
      const nextIndex = state.activeStepIndex + 1;
      const isLastStep = nextIndex >= INTERVIEW_STEPS.length;
      return {
        ...state,
        answers: newAnswers,
        activeStepIndex: isLastStep ? state.activeStepIndex : nextIndex,
        phase: isLastStep ? 'review' : 'collecting',
      };
    }
    case 'back': {
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
        phase: 'collecting',
      };
    }
    case 'loadSample': {
      return {
        activeStepIndex: INTERVIEW_STEPS.length - 1,
        answers: { ...SAMPLE_ANSWERS },
        phase: 'review',
      };
    }
    case 'reset': {
      return createInitialWizardState();
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
  };
}
