import React, { useState, useEffect } from 'react';
import AppHeader from './AppHeader';
import ChatInterviewSidebar from './ChatInterviewSidebar';
import CenterPreviewWorkspace from './CenterPreviewWorkspace';
import SlideThumbnailRail from './SlideThumbnailRail';
import RightInspectorPanel from './RightInspectorPanel';
import ApiKeySettingsModal from './ApiKeySettingsModal';
import { InterviewData, SlideData, ElementData, ChatMessage } from '../demoData';
import { Loader2 } from 'lucide-react';
import { generateSlideStructure, generateBackgroundImage } from '../services/geminiService';
import { getDesignToken } from '../designTokens';
import { useApiKeys, ResolvedApiKeys } from '../hooks/useApiKeys';

const QUESTIONS = [
  {
    id: 'styleId',
    text: 'デザインのテンプレートを選んでください。',
    optionsType: 'grid' as const,
    options: [
      { id: 'corporate', label: 'Corporate（コーポレート）', desc: '白背景、ネイビー×グレー、清潔感', imageUrl: 'https://picsum.photos/seed/corporate/300/200' },
      { id: 'professional', label: 'Professional（プロフェッショナル）', desc: 'ライトグレー背景、ブルー系アクセント', imageUrl: 'https://picsum.photos/seed/professional/300/200' },
      { id: 'executive', label: 'Executive（エグゼクティブ）', desc: 'ダークネイビー背景、ゴールドアクセント、重厚感', imageUrl: 'https://picsum.photos/seed/executive/300/200' },
      { id: 'modern', label: 'Modern（モダン）', desc: 'グラデーション背景、ビビッドカラー', imageUrl: 'https://picsum.photos/seed/modern/300/200' },
      { id: 'minimal', label: 'Minimal（ミニマル）', desc: '真っ白背景、黒テキスト、余白重視', imageUrl: 'https://picsum.photos/seed/minimal/300/200' },
    ]
  },
  {
    id: 'slideCount',
    text: 'スライドの枚数を選んでください。',
    optionsType: 'list' as const,
    options: [
      { id: '3', label: '3枚（簡潔版）' },
      { id: '5', label: '5枚（標準）' },
      { id: '8', label: '8枚（詳細版）' },
      { id: '10', label: '10枚（フル版）' },
    ]
  },
  {
    id: 'targetAudience',
    text: 'この資料のターゲット読者（誰に伝えたいか）を教えてください。',
    optionsType: 'list' as const,
    options: [
      { id: 'executives', label: '経営層・役員' },
      { id: 'managers', label: '部門長・マネージャー' },
      { id: 'staff', label: '一般社員・スタッフ' },
      { id: 'clients', label: '社外クライアント' },
    ]
  },
  {
    id: 'keyMessage',
    text: 'ターゲットに一番伝えたい「キーメッセージ」は何ですか？',
    optionsType: 'list' as const,
    options: [
      { id: 'cost', label: 'コスト削減と効率化' },
      { id: 'growth', label: '売上拡大と事業成長' },
      { id: 'innovation', label: '新規事業とイノベーション' },
      { id: 'risk', label: 'リスク管理とコンプライアンス' },
    ]
  },
  {
    id: 'tone',
    text: '資料全体のトーン＆マナー（雰囲気）を選んでください。',
    optionsType: 'list' as const,
    options: [
      { id: 'professional', label: 'プロフェッショナル・論理的' },
      { id: 'passionate', label: '情熱的・ビジョナリー' },
      { id: 'friendly', label: '親しみやすい・カジュアル' },
      { id: 'urgent', label: '危機感・緊急性' },
    ]
  },
  {
    id: 'supplementary',
    text: '最後に、補足事項や強調したいポイントがあれば教えてください。',
    optionsType: 'list' as const,
    options: [
      { id: 'data', label: '具体的な数値データを強調したい' },
      { id: 'roadmap', label: '今後のロードマップを明確にしたい' },
      { id: 'comparison', label: '他社との比較を分かりやすくしたい' },
      { id: 'none', label: '特になし' },
    ]
  }
];

export default function AppShell() {
  const {
    storedKeys,
    setKeys,
    clearKeys,
    resolvedGeminiKey,
    resolvedImageKey,
    hasResolvableKey,
    isRuntimeConfigLoading,
  } = useApiKeys();

  const [isGenerated, setIsGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [interviewData, setInterviewData] = useState<Partial<InterviewData>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1); // -1: theme, 0-4: QUESTIONS
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome-msg',
    role: 'assistant',
    text: 'インフォグラフィックの作成を開始します。まずテーマを入力するか、サンプルを使って開始してください。',
    timestamp: Date.now(),
    options: [
      { id: 'opt1', label: 'サンプルで試す' },
      { id: 'opt2', label: 'テーマを入力する' }
    ]
  }]);
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const [leftWidth, setLeftWidth] = useState(320);
  const [rightWidth, setRightWidth] = useState(288);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

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

  const handleSendMessage = (text: string, optionId?: string) => {
    if (text === 'サンプルで試す') {
      handleFillSampleBrief();
      return;
    }

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now()
    };
    
    let newInterviewData = { ...interviewData };
    let nextQuestionIndex = currentQuestionIndex;

    if (currentQuestionIndex === -1) {
      newInterviewData.theme = text;
      nextQuestionIndex = 0;
    } else if (currentQuestionIndex >= 0 && currentQuestionIndex < QUESTIONS.length) {
      const q = QUESTIONS[currentQuestionIndex];
      // Store the selected option id, or the text if free input
      (newInterviewData as any)[q.id] = optionId || text;
      nextQuestionIndex++;
    }

    setInterviewData(newInterviewData);
    setCurrentQuestionIndex(nextQuestionIndex);

    const nextMessages = [...messages, newMsg];

    if (isGenerated) {
      // If already generated, we just append the user message and a placeholder AI response
      nextMessages.push({
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        text: '追加の指示を受け付けました。現在、スライドの再生成機能は開発中です。右パネルから手動で編集してください。',
        timestamp: Date.now() + 1
      });
    } else if (nextQuestionIndex < QUESTIONS.length) {
      const nextQ = QUESTIONS[nextQuestionIndex];
      nextMessages.push({
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        text: nextQ.text,
        inputMode: 'options',
        optionsType: nextQ.optionsType,
        options: nextQ.options,
        timestamp: Date.now() + 1
      });
    } else if (currentQuestionIndex < QUESTIONS.length) {
      // Only show the completion message once, when transitioning to the end
      nextMessages.push({
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        text: 'ありがとうございます！以下の内容で要件がまとまりました。確認して「スライドを生成する」ボタンを押してください。',
        inputMode: 'none',
        timestamp: Date.now() + 1
      });
    }

    setMessages(nextMessages);
  };

  const handleFillSampleBrief = () => {
    setInterviewData({
      theme: 'AIが拓く事業成長と競争優位の未来',
      targetAudience: '経営層・事業責任者',
      keyMessage: 'AI導入はコスト削減ではなく、新たな価値創造と競争優位性確立のための必須投資である',
      styleId: 'professional',
      slideCount: '5',
      tone: 'プロフェッショナル・論理的',
      supplementary: '具体的な数値データやロードマップを含める'
    });
    setCurrentQuestionIndex(QUESTIONS.length);
    setMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        role: 'user',
        text: 'サンプルで試す',
        timestamp: Date.now()
      },
      {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        text: 'サンプルの要件を入力しました。内容を確認し、よろしければ「スライドを生成する」ボタンを押してください。',
        timestamp: Date.now() + 1
      }
    ]);
  };

  const handleGenerate = async () => {
    // Wait for runtime config to finish loading before making decisions
    if (isRuntimeConfigLoading) {
      return;
    }

    // Check for resolvable API key before generation
    if (!hasResolvableKey) {
      setIsSettingsOpen(true);
      return;
    }

    setIsGenerating(true);
    setGenerationProgress('スライド構成を生成中...');

    try {
      // 1. Generate structure
      const newSlides = await generateSlideStructure(interviewData, resolvedGeminiKey);
      setSlides(newSlides);
      setActiveSlideId(newSlides[0].id);
      setIsGenerated(true);

      // 2. Generate images sequentially to avoid rate limits
      for (let i = 0; i < newSlides.length; i++) {
        setGenerationProgress(`背景画像を生成中... (${i + 1}/${newSlides.length})`);
        const bgPrompt = newSlides[i].bgPrompt || 'abstract professional business background';
        const bgUrl = await generateBackgroundImage(bgPrompt, resolvedImageKey);

        setSlides(prev => prev.map((s, index) =>
          index === i ? { ...s, imageUrl: bgUrl } : s
        ));
      }

      setGenerationProgress('');
    } catch (error: any) {
      console.error(error);
      alert('設定した API キーを確認してください。');
    } finally {
      setIsGenerating(false);
    }
  };

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

  const handleStepClick = (step: number) => {
    if (isGenerated) return;
    
    const newIndex = step - 1;
    setCurrentQuestionIndex(newIndex);

    // Clear data for this step and subsequent steps
    const newInterviewData = { ...interviewData };
    if (step <= 0) delete newInterviewData.theme;
    if (step <= 1) delete newInterviewData.styleId;
    if (step <= 2) delete newInterviewData.slideCount;
    if (step <= 3) delete newInterviewData.targetAudience;
    if (step <= 4) delete newInterviewData.keyMessage;
    if (step <= 5) delete newInterviewData.tone;
    if (step <= 6) delete newInterviewData.supplementary;
    
    setInterviewData(newInterviewData);

    // Re-add the question message for the new step
    const nextMessages = [...messages];
    // We want to keep messages up to the point where they answered the previous step.
    // Actually, it's easier to just append a new message asking the question again,
    // or we can filter out messages that are newer than the step we are going back to.
    // For simplicity, let's just append the question again.
    
    if (newIndex === -1) {
      nextMessages.push({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        text: 'テーマを再度入力してください。',
        timestamp: Date.now()
      });
    } else if (newIndex >= 0 && newIndex < QUESTIONS.length) {
      const nextQ = QUESTIONS[newIndex];
      nextMessages.push({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        text: nextQ.text,
        inputMode: 'options',
        optionsType: nextQ.optionsType,
        options: nextQ.options,
        timestamp: Date.now()
      });
    }

    setMessages(nextMessages);
  };

  const handleSaveApiKeys = (geminiApiKey: string, imageApiKey: string) => {
    setKeys({ geminiApiKey, imageApiKey });
  };

  const handleNew = () => {
    setIsGenerated(false);
    setInterviewData({});
    setCurrentQuestionIndex(-1);
    setSlides([]);
    setActiveSlideId(null);
    setSelectedElementId(null);
    setMessages([{
      id: 'welcome-msg',
      role: 'assistant',
      text: 'インフォグラフィックの作成を開始します。まずテーマを入力するか、サンプルを使って開始してください。',
      timestamp: Date.now(),
      options: [
        { id: 'opt1', label: 'サンプルで試す' },
        { id: 'opt2', label: 'テーマを入力する' }
      ]
    }]);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30 relative">

      {/* App Header */}
      <AppHeader onNew={handleNew} onOpenSettings={() => setIsSettingsOpen(true)} isGenerated={isGenerated} />

      <div className="flex-1 flex min-h-0 relative">
        {!isGenerated ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-6">
            <div className="w-full max-w-4xl h-[85vh] flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
              <ChatInterviewSidebar
                messages={messages}
                interviewData={interviewData}
                isGenerated={isGenerated}
                onSendMessage={handleSendMessage}
                onSelectStyle={(opt) => handleSendMessage(opt.label, opt.id)}
                onGenerate={handleGenerate}
                onStepClick={handleStepClick}
                className="w-full h-full"
                isGenerateDisabled={isRuntimeConfigLoading}
                isGenerateLoading={isGenerating}
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
          <>
            {/* Left Column: Chat Workflow & Context */}
            <ChatInterviewSidebar
              messages={messages}
              interviewData={interviewData}
              isGenerated={isGenerated}
              onSendMessage={handleSendMessage}
              onSelectStyle={(opt) => handleSendMessage(opt.label, opt.id)}
              onGenerate={handleGenerate}
              onStepClick={handleStepClick}
              className="border-r border-slate-800 bg-slate-900"
              style={{ width: leftWidth }}
              isGenerateDisabled={isRuntimeConfigLoading}
              isGenerateLoading={isGenerating}
            />

            {/* Drag Handle Left */}
            <div 
              className="w-1 cursor-col-resize bg-slate-800 hover:bg-blue-500 z-30 transition-colors"
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
              className="w-1 cursor-col-resize bg-slate-800 hover:bg-blue-500 z-30 transition-colors"
              onMouseDown={() => setIsDraggingRight(true)}
            />

            {/* Right Column: Inspector Panel */}
            <div style={{ width: rightWidth }} className="shrink-0 bg-slate-900 overflow-y-auto">
              <RightInspectorPanel 
                activeSlide={activeSlide}
                selectedElement={selectedElement}
                onUpdateElement={handleUpdateElement}
                onSelectElement={setSelectedElementId}
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
        onSave={handleSaveApiKeys}
        onClear={clearKeys}
      />
    </div>
  );
}
