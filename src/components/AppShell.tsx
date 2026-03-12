/**
 * AppShell Component
 *
 * メインアプリケーションシェル
 * プロジェクト履歴管理、適応的インタビューフロー、スライド生成機能を統合
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppHeader from './AppHeader';
import ChatInterviewSidebar from './ChatInterviewSidebar';
import StartWorkspace from './StartWorkspace';
import ProjectHistoryPanel from './ProjectHistoryPanel';
import CenterPreviewWorkspace from './CenterPreviewWorkspace';
import InterviewHistoryPanel from './InterviewHistoryPanel';
import RightInspectorPanel from './RightInspectorPanel';
import ApiKeySettingsModal from './ApiKeySettingsModal';
import { SlideData, ElementData, ChatMessage } from '../types/domain';
import { ProjectRecord, EntryMode } from '../types/project';
import { Loader2 } from 'lucide-react';
import { generateSlidesFromBrief, generateBackgroundImage } from '../services/geminiService';
import { getDesignToken } from '../designTokens';
import { useApiKeys } from '../hooks/useApiKeys';
import { useProjectHistory } from '../hooks/useProjectHistory';
import {
  initializeFlow,
  answerQuestion,
  getNextQuestion,
  getProgress,
  type FlowState,
} from '../brief/flowEngine';
import { findQuestionById } from '../brief/questionBank';
import { compileBrief } from '../brief/compileBrief';

// 質問オプションの型
interface QuestionOption {
  id: string;
  label: string;
  desc?: string;
  imageUrl?: string;
}

// スタイルオプション（既存のインターフェース互換用）
interface StyleOption {
  id: string;
  label: string;
  desc?: string;
  imageUrl?: string;
}

export default function AppShell() {
  // API Keys
  const {
    storedKeys,
    setKeys,
    clearKeys,
    resolvedGeminiKey,
    resolvedImageKey,
    hasResolvableKey,
    isRuntimeConfigLoading,
  } = useApiKeys();

  // Project History
  const {
    projects,
    activeProject,
    isLoading: isProjectsLoading,
    createProject,
    openProject,
    saveCurrentProject,
    updateActiveProject,
    deleteProject,
    duplicateProject,
    closeProject,
    triggerAutosave,
  } = useProjectHistory();

  // UI State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showStartWorkspace, setShowStartWorkspace] = useState(false);

  // Interview/Generation State
  const [isGenerated, setIsGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');

  // Flow Engine State
  const [flowState, setFlowState] = useState<FlowState>(initializeFlow());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [entryMode, setEntryMode] = useState<EntryMode>('guided');

  // Slide/Editor State
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Panel Resizing
  const [leftWidth, setLeftWidth] = useState(320);
  const [rightWidth, setRightWidth] = useState(288);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  // Refs for autosave cleanup
  const unlistenProjectOpenRef = useRef<(() => void) | null>(null);

  // Panel resize handlers
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

  // Listen for project open events from StartWorkspace
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      openProject(customEvent.detail).then(() => {
        setShowStartWorkspace(false);
      }).catch(console.error);
    };

    window.addEventListener('open-project', handler);
    unlistenProjectOpenRef.current = () => {
      window.removeEventListener('open-project', handler);
    };

    return () => {
      window.removeEventListener('open-project', handler);
    };
  }, [openProject]);

  // Initialize welcome message when opening start workspace or resetting
  const initializeWelcomeMessage = useCallback(() => {
    setMessages([
      {
        id: 'welcome-msg',
        role: 'assistant',
        text: 'インフォグラフィックの作成を開始します。対話形式で要件を教えてください。',
        timestamp: Date.now(),
      },
    ]);
  }, []);

  // Reset interview state
  const resetInterview = useCallback(() => {
    setFlowState(initializeFlow());
    setMessages([]);
    setIsGenerated(false);
    setSlides([]);
    setActiveSlideId(null);
    setSelectedElementId(null);
  }, []);

  // Start a new project
  const startNewProject = useCallback(async (mode: EntryMode) => {
    try {
      resetInterview();
      setEntryMode(mode);

      const project = await createProject({
        title: '新しいプロジェクト',
        entryMode: mode,
        outputTarget: 'lovart-slides',
      });

      initializeWelcomeMessage();
      setShowStartWorkspace(false);
    } catch (e) {
      console.error('Failed to create project:', e);
    }
  }, [createProject, resetInterview, initializeWelcomeMessage]);

  // Handle answering a question
  const handleSendMessage = useCallback(
    (text: string, optionId?: string) => {
      if (isGenerated) {
        // If already generated, just add a placeholder response
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            role: 'user',
            text,
            timestamp: Date.now(),
          },
          {
            id: `msg-${Date.now() + 1}`,
            role: 'assistant',
            text: '追加の指示を受け付けました。現在、スライドの再生成機能は開発中です。右パネルから手動で編集してください。',
            timestamp: Date.now() + 1,
          },
        ]);
        return;
      }

      // Determine the pending question (next unanswered question)
      const pendingQuestion = getNextQuestion(flowState);
      if (!pendingQuestion) {
        // All questions already answered, nothing to do
        return;
      }

      // Record the answer
      const answerValue = optionId || text;
      const newFlowState = answerQuestion(flowState, pendingQuestion.id, answerValue);
      setFlowState(newFlowState);

      // Add user message with summarized answer
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: 'user',
          text: pendingQuestion.summarize(answerValue),
          timestamp: Date.now(),
        },
      ]);

      // Get next question or show completion
      const nextQ = getNextQuestion(newFlowState);
      if (nextQ) {
        setMessages((prev) => [
          ...prev,
          createQuestionMessage(nextQ),
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now() + 1}`,
            role: 'assistant',
            text: 'ありがとうございます！要件がまとまりました。確認して「生成する」ボタンを押してください。',
            inputMode: 'none',
            timestamp: Date.now() + 1,
          },
        ]);
      }

      // Autosave
      updateActiveProject({
        interviewData: {
          ...newFlowState.answers as any,
        },
      });
      triggerAutosave('interviewData');
    },
    [flowState, isGenerated, updateActiveProject, triggerAutosave]
  );

  // Create a message from a question
  const createQuestionMessage = (question: any): ChatMessage => {
    const options = question.options?.map((opt: any) => ({
      id: opt.id,
      label: opt.label,
      desc: opt.description,
    })) || [];

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      text: question.prompt,
      inputMode: options.length > 0 ? 'options' : 'text',
      optionsType: question.inputMode === 'single-choice' ? 'list' : 'grid',
      options,
      timestamp: Date.now(),
    };
  };

  // Handle style selection
  const handleSelectStyle = useCallback((option: StyleOption) => {
    handleSendMessage(option.label, option.id);
  }, [handleSendMessage]);

  // Handle go back to a previous step
  // step is 0-based index from InterviewProgress (completed step clicked)
  const handleStepClick = useCallback((step: number) => {
    if (isGenerated) return;

    // Rebuild state: keep answers and completedQuestionIds up to (but not including) the clicked step
    const keepCount = step; // step is 0-based; keep answers before this index
    const keptIds = flowState.completedQuestionIds.slice(0, keepCount);
    const keptAnswers: Record<string, unknown> = {};
    for (const id of keptIds) {
      keptAnswers[id] = flowState.answers[id];
    }

    // Rebuild flow state
    const rebuiltState: FlowState = {
      answers: keptAnswers,
      currentQuestionIndex: keepCount,
      completedQuestionIds: keptIds,
      isComplete: false,
    };

    // Rebuild messages: welcome + Q&A pairs for kept answers + next question
    const newMessages: ChatMessage[] = [{
      id: 'welcome-msg',
      role: 'assistant',
      text: 'インフォグラフィックの作成を開始します。対話形式で要件を教えてください。',
      timestamp: Date.now(),
    }];

    for (let i = 0; i < keptIds.length; i++) {
      const questionId = keptIds[i];
      const question = findQuestionById(questionId);
      if (question) {
        // Question message
        newMessages.push(createQuestionMessage(question));
        // Answer message
        newMessages.push({
          id: `msg-${Date.now() + i * 2 + 1}`,
          role: 'user',
          text: question.summarize(keptAnswers[questionId]),
          timestamp: Date.now() + i * 2 + 1,
        });
      }
    }

    // Add the next pending question
    const nextQ = getNextQuestion(rebuiltState);
    if (nextQ) {
      newMessages.push(createQuestionMessage(nextQ));
    }

    setMessages(newMessages);
    setFlowState(rebuiltState);
  }, [flowState, isGenerated]);

  // Handle generate slides
  const handleGenerate = useCallback(async () => {
    if (isRuntimeConfigLoading) return;
    if (!hasResolvableKey) {
      setIsSettingsOpen(true);
      return;
    }

    setIsGenerating(true);
    setGenerationProgress('スライド構成を生成中...');

    try {
      // Compile the brief from flow answers
      const brief = compileBrief(flowState.answers);
      const outputTarget = String(flowState.answers.outputTarget ?? 'lovart-slides');
      const styleId = String(flowState.answers.slideStyle ?? 'professional');

      // 1. Generate structure via compiledBrief
      const newSlides = await generateSlidesFromBrief(brief, resolvedGeminiKey, styleId);

      setSlides(newSlides);
      setActiveSlideId(newSlides[0].id);
      setIsGenerated(true);

      // 2. Generate background images only for lovart-slides
      if (outputTarget === 'lovart-slides') {
        for (let i = 0; i < newSlides.length; i++) {
          setGenerationProgress(`背景画像を生成中... (${i + 1}/${newSlides.length})`);
          const bgPrompt = newSlides[i].bgPrompt || 'abstract professional business background';
          const bgUrl = await generateBackgroundImage(bgPrompt, resolvedImageKey);

          setSlides((prev) =>
            prev.map((s, index) =>
              index === i ? { ...s, imageUrl: bgUrl } : s
            )
          );
        }
      }

      // Update project status
      updateActiveProject({
        status: 'generated',
        slides: newSlides.map((s, idx) => ({
          id: s.id,
          pageNumber: idx + 1,
          title: s.title,
          imageUrl: s.imageUrl,
          bgPrompt: s.bgPrompt,
        })),
        generatedAt: new Date().toISOString(),
      });
      await saveCurrentProject();

      setGenerationProgress('');
    } catch (error: any) {
      console.error(error);
      alert('設定した API キーを確認してください。');
    } finally {
      setIsGenerating(false);
    }
  }, [
    flowState,
    isRuntimeConfigLoading,
    hasResolvableKey,
    resolvedGeminiKey,
    resolvedImageKey,
    updateActiveProject,
    saveCurrentProject,
  ]);

  // Handle new project
  const handleNew = useCallback(() => {
    closeProject();
    resetInterview();
    initializeWelcomeMessage();
    setShowStartWorkspace(true);
  }, [closeProject, resetInterview, initializeWelcomeMessage]);

  // Handle open history
  const handleOpenHistory = useCallback(() => {
    setIsHistoryOpen(true);
  }, []);

  // Handle open project from history
  const handleOpenProject = useCallback(async (id: string) => {
    try {
      await openProject(id);
      setIsHistoryOpen(false);

      // Load interview state from project
      // For now, we'll reset to welcome message
      resetInterview();
      initializeWelcomeMessage();
    } catch (e) {
      console.error('Failed to open project:', e);
    }
  }, [openProject, resetInterview, initializeWelcomeMessage]);

  // Handle save API keys
  const handleSaveApiKeys = useCallback((geminiApiKey: string, imageApiKey: string) => {
    setKeys({ geminiApiKey, imageApiKey });
  }, [setKeys]);

  // Computed values
  const activeSlideIndex = slides.findIndex((s) => s.id === activeSlideId);
  const activeSlide = activeSlideIndex !== -1 ? slides[activeSlideIndex] : null;
  const selectedElement = activeSlide?.elements.find((e) => e.id === selectedElementId) || null;
  const designToken = getDesignToken((flowState.answers as any).slideStyle || 'professional');

  const progress = getProgress(flowState);
  const isComplete = flowState.isComplete;
  const nextQuestion = getNextQuestion(flowState);

  // Show start workspace if no active project or explicitly requested
  const shouldShowStartWorkspace = (!activeProject && !isProjectsLoading) || showStartWorkspace;

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30 relative">
      {/* App Header */}
      <AppHeader
        onNew={handleNew}
        onOpenHistory={handleOpenHistory}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isGenerated={isGenerated}
      />

      <div className="flex-1 flex min-h-0 relative">
        {shouldShowStartWorkspace ? (
          <StartWorkspace
            onCreateProject={startNewProject}
            recentProjects={projects}
            isLoading={isProjectsLoading}
          />
        ) : (
          <>
            {!isGenerated ? (
              // Interview Mode
              <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-6">
                <div className="w-full max-w-5xl mx-auto h-[85vh] flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
                  <ChatInterviewSidebar
                    messages={messages}
                    interviewData={flowState.answers as any}
                    isGenerated={isGenerated}
                    onSendMessage={handleSendMessage}
                    onSelectStyle={handleSelectStyle}
                    onGenerate={handleGenerate}
                    onStepClick={handleStepClick}
                    className="w-full h-full"
                    isGenerateDisabled={isRuntimeConfigLoading}
                    isGenerateLoading={isGenerating}
                    flowState={flowState}
                    nextQuestion={nextQuestion}
                    isComplete={isComplete}
                    progress={progress}
                  />
                </div>
                {/* Loading Overlay */}
                {isGenerating && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-lg font-medium text-slate-200">{generationProgress}</p>
                    <p className="text-sm text-slate-400 mt-2">これには数十秒かかる場合があります...</p>
                  </div>
                )}
              </div>
            ) : (
              // Editor Mode — 3 column layout
              <>
                {/* Left Column: Interview History (read-only) */}
                <InterviewHistoryPanel
                  flowState={flowState}
                  className="border-r border-slate-800 bg-slate-900"
                  style={{ width: leftWidth }}
                />

                {/* Drag Handle Left */}
                <div
                  className="w-1 cursor-col-resize bg-slate-800 hover:bg-blue-500 z-30 transition-colors"
                  onMouseDown={() => setIsDraggingLeft(true)}
                />

                {/* Center Column: All slides vertically scrollable */}
                <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800 relative">
                  <CenterPreviewWorkspace
                    slides={slides}
                    activeSlideId={activeSlideId}
                    selectedElementId={selectedElementId}
                    onSelectSlide={(id) => {
                      setActiveSlideId(id);
                    }}
                    onSelectElement={setSelectedElementId}
                    onUpdateElement={(elementId, updates) => {
                      setSlides((prev) =>
                        prev.map((slide) => {
                          if (slide.id !== activeSlideId) return slide;
                          return {
                            ...slide,
                            elements: slide.elements.map((el) =>
                              el.id === elementId ? { ...el, ...updates } : el
                            ),
                          };
                        })
                      );
                      triggerAutosave('slides');
                    }}
                    designToken={designToken}
                  />
                </div>

                {/* Drag Handle Right */}
                <div
                  className="w-1 cursor-col-resize bg-slate-800 hover:bg-blue-500 z-30 transition-colors"
                  onMouseDown={() => setIsDraggingRight(true)}
                />

                {/* Right Column: Inspector Panel */}
                <div style={{ width: rightWidth }} className="shrink-0 bg-slate-900 overflow-y-auto">
                  <RightInspectorPanel
                    activeSlide={activeSlide}
                    selectedElement={selectedElement}
                    onUpdateElement={(id, updates) => {
                      setSlides((prev) =>
                        prev.map((slide) => {
                          if (slide.id !== activeSlideId) return slide;
                          return {
                            ...slide,
                            elements: slide.elements.map((el) =>
                              el.id === id ? { ...el, ...updates } : el
                            ),
                          };
                        })
                      );
                      triggerAutosave('slides');
                    }}
                    onSelectElement={setSelectedElementId}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Project History Panel */}
      {isHistoryOpen && (
        <ProjectHistoryPanel
          projects={projects}
          isLoading={isProjectsLoading}
          onOpen={handleOpenProject}
          onDuplicate={(id) => {
            duplicateProject(id).then((duplicated) => {
              openProject(duplicated.id);
              setIsHistoryOpen(false);
            });
          }}
          onDelete={async (id) => {
            await deleteProject(id);
            if (activeProject?.id === id) {
              handleNew();
            }
          }}
          onClose={() => setIsHistoryOpen(false)}
        />
      )}

      {/* API Key Settings Modal */}
      <ApiKeySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialGeminiApiKey={storedKeys.geminiApiKey}
        initialImageApiKey={storedKeys.imageApiKey}
        onSave={handleSaveApiKeys}
        onClear={clearKeys}
      />
    </div>
  );
}
