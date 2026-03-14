import React, { useState, useEffect, useReducer, useMemo, useCallback, useRef } from 'react';
import AppHeader from './AppHeader';
import AssistantShell from './assistant/AssistantShell';
import ChatInterviewSidebar from './ChatInterviewSidebar';
import CenterPreviewWorkspace from './CenterPreviewWorkspace';
import SlideThumbnailRail from './SlideThumbnailRail';
import RightInspectorPanel from './RightInspectorPanel';
import ApiKeySettingsModal from './ApiKeySettingsModal';
import { SlideData, ElementData, ChatMessage, ResearchPacket } from '../demoData';
import { Loader2 } from 'lucide-react';
import { fetchResearch } from '../services/researchClient';
import { requestSlideStructure } from '../services/generationClient';
import { getDesignToken } from '../designTokens';
import { enqueue, onProgress as onBgQueueProgress } from '../services/backgroundQueue';
import { useApiKeys } from '../hooks/useApiKeys';
import { useDeckHistory } from '../hooks/useDeckHistory';
import { useAdaptiveOptions } from '../hooks/useAdaptiveOptions';
import { AppScreen, AnswerEntry, InterviewFieldId, INTERVIEW_STEPS } from '../interview/schema';
import type { AdaptiveBriefContext, AdaptiveFieldId } from '../interview/schema';
import type { FollowUpAnswerEntry } from '../interview/state';
import { assessAnswerQuality } from '../interview/answerQuality';
import { generateFollowUpQuestions } from '../services/adaptiveInterviewService';
import { validateAllSlides, groupWarningsBySlide, type ValidationResult } from '../services/contentValidator';
import type { DeckRecord, GenerationTiming } from '../history/schema';
import {
  interviewWizardReducer,
  createInitialWizardState,
  buildBriefDraft,
} from '../interview/state';

export default function AppShell() {
  const {
    storedKeys,
    setKeys,
    clearKeys,
    resolvedGeminiKey,
    resolvedImageKey,
    hasResolvableKey,
    hasResolvableImageKey,
    hasServerGeminiKey,
    hasServerImageKey,
    isRuntimeConfigLoading,
  } = useApiKeys();

  const { decks, saveDeck, loadDeck, removeDeck, refresh: refreshHistory } = useDeckHistory();
  const {
    getOptions: getAdaptiveOptions,
    isLoading: isAdaptiveLoading,
    prefetchAll: prefetchAdaptiveOptions,
    clearCache: clearAdaptiveOptions,
  } = useAdaptiveOptions();

  // --- State model ---
  const [screen, setScreen] = useState<AppScreen>('wizard');
  const [wizardState, dispatch] = useReducer(interviewWizardReducer, undefined, createInitialWizardState);
  const [currentDeckId, setCurrentDeckId] = useState<string | null>(null);
  const [researchPacket, setResearchPacket] = useState<ResearchPacket | undefined>();

  const briefDraft = useMemo(() => buildBriefDraft(wizardState.answers), [wizardState.answers]);
  const adaptiveContext = useMemo<AdaptiveBriefContext | null>(() => {
    if (!briefDraft.theme || !briefDraft.slideCount) {
      return null;
    }
    return {
      theme: briefDraft.theme,
      styleId: briefDraft.styleId,
      slideCount: briefDraft.slideCount,
    };
  }, [briefDraft.slideCount, briefDraft.styleId, briefDraft.theme]);

  // Bridge: legacy interviewData for geminiService / BriefSummaryCard
  const interviewData = useMemo(() => ({
    theme: briefDraft.theme,
    styleId: briefDraft.styleId ?? '',
    slideCount: briefDraft.slideCount,
    targetAudience: briefDraft.targetAudience ?? '',
    keyMessage: briefDraft.keyMessage ?? '',
    tone: briefDraft.tone,
    supplementary: briefDraft.supplementary ?? '',
  }), [briefDraft]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Editor-only: messages for the post-generation left sidebar
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [slides, setSlides] = useState<SlideData[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [zoom, setZoom] = useState(100);

  const [leftWidth, setLeftWidth] = useState(320);
  const [rightWidth, setRightWidth] = useState(288);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  // Debounced auto-save for element edits
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft) {
        setLeftWidth(Math.min(Math.max(e.clientX, 200), 400));
      } else if (isDraggingRight) {
        setRightWidth(Math.min(Math.max(window.innerWidth - e.clientX, 250), 450));
      }
    };
    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };
    if (isDraggingLeft || isDraggingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingLeft, isDraggingRight]);

  // --- Auto-save on slide edits (debounced 500ms) ---
  const debouncedSave = useCallback((slidesData: SlideData[], messagesData: ChatMessage[]) => {
    if (!currentDeckId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const existing = await loadDeck(currentDeckId);
        if (existing) {
          const updated: DeckRecord = {
            ...existing,
            slides: slidesData,
            messages: messagesData,
            updatedAt: new Date().toISOString(),
          };
          await saveDeck(updated);
        }
      } catch (e) {
        console.warn('Auto-save failed:', e);
      }
    }, 500);
  }, [currentDeckId, loadDeck, saveDeck]);

  // Trigger auto-save when slides change (only in editor mode)
  useEffect(() => {
    if (screen === 'editor' && currentDeckId && slides.length > 0) {
      debouncedSave(slides, messages);
    }
  }, [slides, messages, screen, currentDeckId, debouncedSave]);

  const openFollowUpForField = useCallback((
    fieldId: InterviewFieldId,
    nextAnswers: Partial<Record<InterviewFieldId, AnswerEntry>> = wizardState.answers,
    nextFollowUpAnswers: FollowUpAnswerEntry[] = wizardState.followUpAnswers,
    options?: {
      parentStepIndex?: number;
      resumeStepIndex?: number;
      returnPhase?: 'collecting' | 'review';
      currentFollowUpId?: string;
    }
  ) => {
    const quality = assessAnswerQuality(nextAnswers, nextFollowUpAnswers);
    const severity = quality.flags.find(flag => flag.fieldId === fieldId)?.severity ?? null;
    const effectiveSeverity = fieldId === 'theme' ? (severity ?? 'warning') : severity;
    if (!effectiveSeverity) {
      return false;
    }

    const theme = nextAnswers.theme?.value || nextAnswers.theme?.label || '';
    const packets = generateFollowUpQuestions(theme, { [fieldId]: effectiveSeverity }, nextFollowUpAnswers);
    const packet = packets.find(item =>
      item.parentFieldId === fieldId && item.id !== options?.currentFollowUpId
    );
    if (!packet) {
      return false;
    }

    const fieldStepIndex = INTERVIEW_STEPS.findIndex(step => step.fieldId === fieldId);
    const parentStepIndex = options?.parentStepIndex ?? fieldStepIndex;
    const resumeStepIndex = options?.resumeStepIndex ?? fieldStepIndex;
    const returnPhase = options?.returnPhase ?? 'collecting';

    dispatch({
      type: 'showFollowUp',
      packet,
      parentStepIndex: Math.max(0, parentStepIndex),
      resumeStepIndex: Math.max(0, resumeStepIndex),
      returnPhase,
    });
    setScreen('wizard');
    return true;
  }, [wizardState.answers, wizardState.followUpAnswers]);

  // --- Wizard handlers ---
  const handleAnswerCommit = (entry: AnswerEntry) => {
    dispatch({ type: 'answer', fieldId: entry.fieldId, entry });

    // After answering targetAudience or keyMessage, check if follow-up is needed
    const followUpFields: InterviewFieldId[] = ['theme', 'targetAudience', 'keyMessage'];
    if (followUpFields.includes(entry.fieldId)) {
      const updatedAnswers = { ...wizardState.answers, [entry.fieldId]: entry };
      const updatedFollowUpAnswers = wizardState.followUpAnswers.filter(
        answer => answer.parentFieldId !== entry.fieldId
      );
      openFollowUpForField(entry.fieldId, updatedAnswers, updatedFollowUpAnswers, {
        parentStepIndex: wizardState.activeStepIndex,
        resumeStepIndex: Math.min(wizardState.activeStepIndex + 1, INTERVIEW_STEPS.length - 1),
        returnPhase: 'collecting',
      });
    }
  };

  const handleFollowUpCommit = (answer: FollowUpAnswerEntry) => {
    const updatedFollowUpAnswers = [
      ...wizardState.followUpAnswers.filter(existing => existing.followUpId !== answer.followUpId),
      answer,
    ];

    dispatch({ type: 'answerFollowUp', answer });

    openFollowUpForField(answer.parentFieldId, wizardState.answers, updatedFollowUpAnswers, {
      parentStepIndex: wizardState.followUpParentStepIndex ?? wizardState.activeStepIndex,
      resumeStepIndex: wizardState.followUpResumeStepIndex ?? wizardState.activeStepIndex,
      returnPhase: wizardState.followUpReturnPhase ?? 'collecting',
      currentFollowUpId: answer.followUpId,
    });
  };

  const handleFollowUpSkip = () => {
    dispatch({ type: 'skipFollowUp' });
  };

  const handleWizardBack = () => {
    if (wizardState.phase === 'review') {
      setScreen('wizard');
    }
    dispatch({ type: 'back' });
  };

  const handleWizardGoToStep = useCallback((index: number) => {
    dispatch({ type: 'goToStep', index });
    setScreen('wizard');
  }, []);

  const handleResolveIssue = useCallback((fieldId: InterviewFieldId) => {
    const fieldStepIndex = INTERVIEW_STEPS.findIndex(step => step.fieldId === fieldId);
    const opened = openFollowUpForField(fieldId, wizardState.answers, wizardState.followUpAnswers, {
      parentStepIndex: fieldStepIndex,
      resumeStepIndex: fieldStepIndex,
      returnPhase: 'review',
    });
    if (!opened) {
      const stepIndex = fieldStepIndex;
      if (stepIndex >= 0) {
        handleWizardGoToStep(stepIndex);
      }
    }
  }, [handleWizardGoToStep, openFollowUpForField, wizardState.answers, wizardState.followUpAnswers]);

  const handleStartInterview = () => {
    dispatch({ type: 'startInterview' });
    setScreen('wizard');
  };
  const handleSample = () => {
    dispatch({ type: 'loadSample' });
    setScreen('review');
  };

  // Transition wizard to review when phase changes
  useEffect(() => {
    if (wizardState.phase === 'review' && screen === 'wizard') {
      setScreen('review');
    }
  }, [wizardState.phase, screen]);

  useEffect(() => {
    if (!adaptiveContext) {
      return;
    }

    void prefetchAdaptiveOptions(adaptiveContext);
  }, [adaptiveContext, prefetchAdaptiveOptions]);

  const isAdaptiveLoadingForCurrentContext = useCallback((fieldId: AdaptiveFieldId) => {
    return adaptiveContext ? isAdaptiveLoading(fieldId, adaptiveContext) : false;
  }, [adaptiveContext, isAdaptiveLoading]);

  // Editor-only: handle post-generation messages
  const handleSendMessage = (text: string) => {
    setMessages(prev => [
      ...prev,
      { id: `msg-${Date.now()}`, role: 'user' as const, text, timestamp: Date.now() },
      {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant' as const,
        text: '追加の指示を受け付けました。現在、スライドの再生成機能は開発中です。右パネルから手動で編集してください。',
        timestamp: Date.now() + 1,
      },
    ]);
  };

  const handleGenerate = async () => {
    if (isRuntimeConfigLoading) return;
    if (!hasResolvableKey) {
      setIsSettingsOpen(true);
      return;
    }

    setScreen('generating');
    setIsGenerating(true);

    const timings: GenerationTiming = { structureMs: 0, totalMs: 0 };
    const totalStart = Date.now();
    const deckId = `deck-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setCurrentDeckId(deckId);

    // Create draft record
    const draftRecord: DeckRecord = {
      id: deckId,
      briefDraft,
      slides: [],
      messages: [],
      timings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
    };
    await saveDeck(draftRecord);

    try {
      // Phase 1: Research (optional)
      let packet: ResearchPacket | undefined;
      if (briefDraft.evidenceMode !== 'none') {
        setGenerationProgress('テーマをリサーチ中...');
        const researchStart = Date.now();
        try {
          packet = await fetchResearch(interviewData.theme, resolvedGeminiKey, {
            sourcePreference: briefDraft.sourcePreference,
          });
          setResearchPacket(packet);
        } catch {
          console.warn('Research fetch failed, proceeding without evidence');
        }
        timings.researchMs = Date.now() - researchStart;
      }

      // Phase 2: Structure generation
      setGenerationProgress('スライド構成を生成中...');
      const structureStart = Date.now();
      const newSlides = await requestSlideStructure(
        interviewData,
        resolvedGeminiKey,
        packet,
        wizardState.answers,
        wizardState.followUpAnswers,
      );
      timings.structureMs = Date.now() - structureStart;

      setSlides(newSlides);
      setActiveSlideId(newSlides[0].id);
      setValidationResult(validateAllSlides(newSlides));
      setScreen('editor');

      // Initialize editor messages
      const initMessages: ChatMessage[] = [{
        id: `msg-${Date.now()}`,
        role: 'assistant',
        text: 'スライドの生成が完了しました。中央のプレビューエリアで確認・編集が可能です。',
        timestamp: Date.now(),
      }];
      setMessages(initMessages);

      // Save generated deck record
      const generatedRecord: DeckRecord = {
        ...draftRecord,
        slides: newSlides,
        messages: initMessages,
        researchPacket: packet,
        timings: { ...timings, totalMs: Date.now() - totalStart },
        updatedAt: new Date().toISOString(),
        status: 'generated',
      };
      await saveDeck(generatedRecord);

      // Phase 3: Background images (async, non-blocking for editor)
      const designToken = getDesignToken(interviewData.styleId);
      const backgroundMode = designToken.backgroundMode ?? 'none';

      if (designToken.useAiBackground && hasResolvableImageKey && backgroundMode !== 'none') {
        const bgStart = Date.now();

        // Subscribe to background queue progress
        const unsubscribeProgress = onBgQueueProgress((progress) => {
          if (progress.latestResult?.imageUrl) {
            setSlides(prevSlides => prevSlides.map(slide =>
              slide.id === progress.latestResult?.slideId
                ? { ...slide, imageUrl: progress.latestResult.imageUrl }
                : slide
            ));
          }
          if (progress.total > 0) {
            setGenerationProgress(`背景画像を生成中... (${progress.completed}/${progress.total})`);
          }
        });

        // Determine which slides need backgrounds based on backgroundMode
        const slidesNeedingBg: SlideData[] = [];
        for (const slide of newSlides) {
          if (backgroundMode === 'all') {
            slidesNeedingBg.push(slide);
          } else if (backgroundMode === 'cover-only' && slide.pageKind === 'cover') {
            slidesNeedingBg.push(slide);
          } else if (backgroundMode === 'cover-only' && !slide.imageUrl && slidesNeedingBg.length === 0) {
            // Add cover if it's the only one missing
            slidesNeedingBg.push(slide);
          }
        }

        // Enqueue background generation jobs
        const bgJobs = slidesNeedingBg.map(slide => ({
          slideId: slide.id,
          prompt: slide.bgPrompt || 'abstract professional business background',
          apiKey: resolvedImageKey,
        }));

        if (bgJobs.length === 0) {
          const existing = await loadDeck(deckId);
          if (existing) {
            await saveDeck({
              ...existing,
              timings: { ...existing.timings, backgroundMs: 0 },
              updatedAt: new Date().toISOString(),
            });
          }
          unsubscribeProgress();
          setGenerationProgress('');
          return;
        }

        enqueue(bgJobs);

        // Update slides as backgrounds complete and save final timing
        const unsubscribeBgComplete = onBgQueueProgress(async (progress) => {
          if (progress.total > 0 && progress.completed + progress.failed === progress.total) {
            const existing = await loadDeck(deckId);
            if (existing) {
              const finalRecord: DeckRecord = {
                ...existing,
                timings: { ...existing.timings, backgroundMs: Date.now() - bgStart },
                updatedAt: new Date().toISOString(),
              };
              await saveDeck(finalRecord);
              unsubscribeProgress();
              unsubscribeBgComplete();
            }
          }
        });
      } else {
        // No background generation needed - finalize timing
        timings.totalMs = Date.now() - totalStart;
        const finalRecord: DeckRecord = {
          ...generatedRecord,
          timings: { ...timings },
          updatedAt: new Date().toISOString(),
        };
        await saveDeck(finalRecord);
      }

      setGenerationProgress('');
    } catch (error: any) {
      console.error(error);
      // Save failed record
      const failedRecord: DeckRecord = {
        ...draftRecord,
        timings: { ...timings, totalMs: Date.now() - totalStart },
        updatedAt: new Date().toISOString(),
        status: 'failed',
      };
      await saveDeck(failedRecord);
      const message = error instanceof Error ? error.message : '不明なエラーが発生しました';
      alert(`生成に失敗しました: ${message}`);
      setScreen('review');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- History: Load a deck from history ---
  const handleLoadDeck = useCallback(async (id: string) => {
    const record = await loadDeck(id);
    if (!record) return;

    setCurrentDeckId(record.id);
    setSlides(record.slides);
    setMessages(record.messages);
    setResearchPacket(record.researchPacket);
    setActiveSlideId(record.slides[0]?.id ?? null);
    setSelectedElementId(null);
    setScreen('editor');
  }, [loadDeck]);

  const handleDeleteDeck = useCallback(async (id: string) => {
    await removeDeck(id);
  }, [removeDeck]);

  const activeSlideIndex = slides.findIndex((s) => s.id === activeSlideId);
  const activeSlide = activeSlideIndex !== -1 ? slides[activeSlideIndex] : null;
  const selectedElement = activeSlide?.elements.find(e => e.id === selectedElementId) || null;
  const designToken = getDesignToken(interviewData.styleId);

  const handleNextSlide = () => {
    if (activeSlideIndex < slides.length - 1) {
      setActiveSlideId(slides[activeSlideIndex + 1].id);
      setSelectedElementId(null);
    }
  };

  const handlePrevSlide = () => {
    if (activeSlideIndex > 0) {
      setActiveSlideId(slides[activeSlideIndex - 1].id);
      setSelectedElementId(null);
    }
  };

  const handleUpdateElement = (id: string, updates: Partial<ElementData>) => {
    setSlides(prev => prev.map(slide => {
      if (slide.id !== activeSlideId) return slide;
      return {
        ...slide,
        elements: slide.elements.map(el => el.id === id ? { ...el, ...updates } : el)
      };
    }));
  };

  const handleSaveApiKeys = (geminiApiKey: string, imageApiKey: string) => {
    setKeys({ geminiApiKey, imageApiKey });
  };

  const handleNew = () => {
    setCurrentDeckId(null);
    setResearchPacket(undefined);
    dispatch({ type: 'reset' });
    clearAdaptiveOptions();
    setScreen('wizard');
    setSlides([]);
    setActiveSlideId(null);
    setSelectedElementId(null);
    setMessages([]);
    setValidationResult(null);
    setZoom(100);
  };

  const isGenerated = screen === 'editor';

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30 relative">

      {/* App Header */}
      <AppHeader
        onNew={handleNew}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isGenerated={isGenerated}
        deckHistory={decks}
        onLoadDeck={handleLoadDeck}
        onDeleteDeck={handleDeleteDeck}
      />

      <div className="flex-1 flex min-h-0 relative">
        {!isGenerated ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-6 min-h-0">
            <AssistantShell
              wizardState={wizardState}
              theme={briefDraft.theme}
              onAnswerCommit={handleAnswerCommit}
              onFollowUpCommit={handleFollowUpCommit}
              onFollowUpSkip={handleFollowUpSkip}
              onBack={handleWizardBack}
              onGoToStep={handleWizardGoToStep}
              onResolveIssue={handleResolveIssue}
              onStartInterview={handleStartInterview}
              onSample={handleSample}
              onGenerate={handleGenerate}
              onCancel={handleNew}
              isGenerateDisabled={isRuntimeConfigLoading}
              isGenerateLoading={isGenerating}
              adaptiveOptions={{
                targetAudience: adaptiveContext ? getAdaptiveOptions('targetAudience', adaptiveContext) : [],
                keyMessage: adaptiveContext ? getAdaptiveOptions('keyMessage', adaptiveContext) : [],
                tone: adaptiveContext ? getAdaptiveOptions('tone', adaptiveContext) : [],
                supplementary: adaptiveContext ? getAdaptiveOptions('supplementary', adaptiveContext) : [],
              }}
              isAdaptiveLoading={isAdaptiveLoadingForCurrentContext}
            />
            {/* Loading Overlay */}
            {(screen === 'generating' || isGenerating) && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-lg font-medium text-slate-200">{generationProgress}</p>
                <p className="text-sm text-slate-400 mt-2">これには数十秒かかる場合があります...</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Left Column: Brief summary + chat */}
            <ChatInterviewSidebar
              messages={messages}
              briefDraft={briefDraft}
              isGenerated={isGenerated}
              onSendMessage={handleSendMessage}
              onGenerate={handleGenerate}
              className="border-r border-slate-800 bg-slate-900"
              style={{ width: leftWidth }}
              isGenerateDisabled={isRuntimeConfigLoading}
              isGenerateLoading={isGenerating}
            />

            {/* Drag Handle Left */}
            <div
              className="w-1.5 cursor-col-resize bg-slate-800 hover:bg-blue-500 hover:w-2 z-30 transition-all"
              onMouseDown={() => setIsDraggingLeft(true)}
            />

            {/* Center Column: Preview Workspace */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800 relative">
              <CenterPreviewWorkspace
                activeSlide={activeSlide}
                totalSlides={slides.length}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onUpdateElement={handleUpdateElement}
                onNext={handleNextSlide}
                onPrev={handlePrevSlide}
                designToken={designToken}
                zoom={zoom}
                onZoomIn={() => setZoom(z => Math.min(z + 25, 200))}
                onZoomOut={() => setZoom(z => Math.max(z - 25, 50))}
              />

              {/* Bottom Rail: Thumbnails */}
              {slides.length > 0 && (
                <SlideThumbnailRail
                  slides={slides}
                  activeSlideId={activeSlideId}
                  onSelectSlide={(id) => {
                    setActiveSlideId(id);
                    setSelectedElementId(null);
                  }}
                />
              )}
            </div>

            {/* Drag Handle Right */}
            <div
              className="w-1.5 cursor-col-resize bg-slate-800 hover:bg-blue-500 hover:w-2 z-30 transition-all"
              onMouseDown={() => setIsDraggingRight(true)}
            />

            {/* Right Column: Inspector Panel */}
            <div style={{ width: rightWidth }} className="shrink-0 bg-slate-900 overflow-y-auto">
              <RightInspectorPanel
                activeSlide={activeSlide}
                selectedElement={selectedElement}
                onUpdateElement={handleUpdateElement}
                onSelectElement={setSelectedElementId}
                slideWarnings={
                  activeSlide && validationResult
                    ? (groupWarningsBySlide(validationResult.warnings).get(activeSlide.id) || [])
                    : []
                }
              />
            </div>
          </>
        )}
      </div>

      {/* API Key Settings Modal */}
      <ApiKeySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialGeminiApiKey={storedKeys.geminiApiKey}
        initialImageApiKey={storedKeys.imageApiKey}
        hasServerGeminiKey={hasServerGeminiKey}
        hasServerImageKey={hasServerImageKey}
        onSave={handleSaveApiKeys}
        onClear={clearKeys}
      />
    </div>
  );
}
