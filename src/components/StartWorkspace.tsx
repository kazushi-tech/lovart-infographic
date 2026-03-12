/**
 * Start Workspace Component
 *
 * 新規プロジェクト開始時のエントリーポイントUI
 * テーマから始める、詳細ブリーフを貼り付け、最近のプロジェクトを再開
 */

import React, { useState } from 'react';
import { Sparkles, FileText, Clock, ChevronRight, Zap } from 'lucide-react';
import type { ProjectRecord } from '../types/project';

interface StartWorkspaceProps {
  onCreateProject: (mode: 'guided' | 'detailed-brief') => void;
  recentProjects: ProjectRecord[];
  isLoading: boolean;
}

export default function StartWorkspace({
  onCreateProject,
  recentProjects,
  isLoading,
}: StartWorkspaceProps) {
  const [showRecent, setShowRecent] = useState(false);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
            インフォグラフィックを作成する
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            AIアシスタントが、あなたの目的に合わせた最適なスライドやインフォグラフィックを生成します
          </p>
        </div>

        {/* Entry Paths */}
        <div className="grid md:grid-cols-2 gap-4">
          <EntryCard
            icon={Sparkles}
            title="テーマから始める"
            description="対話形式で要件を定義します。初めての方におすすめです"
            onClick={() => onCreateProject('guided')}
            primary
          />
          <EntryCard
            icon={FileText}
            title="詳細ブリーフを貼り付け"
            description="既に要件が決まっている場合はテキストを貼り付けます"
            onClick={() => onCreateProject('detailed-brief')}
          />
        </div>

        {/* Recent Projects */}
        {(recentProjects.length > 0 || isLoading) && (
          <div className="pt-4">
            <button
              onClick={() => setShowRecent(!showRecent)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mx-auto"
            >
              <Clock className="w-4 h-4" />
              {showRecent ? '最近のプロジェクトを隠す' : '最近のプロジェクトを表示'}
              {showRecent && recentProjects.length > 0 && (
                <span className="text-xs bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full">
                  {recentProjects.length}
                </span>
              )}
              <ChevronRight className={`w-4 h-4 transition-transform ${showRecent ? 'rotate-90' : ''}`} />
            </button>

            {showRecent && (
              <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {isLoading ? (
                  <div className="col-span-full text-center py-8 text-slate-500 text-sm">
                    プロジェクトを読み込み中...
                  </div>
                ) : recentProjects.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-slate-500 text-sm">
                    最近のプロジェクトはありません
                  </div>
                ) : (
                  recentProjects.slice(0, 6).map((project) => (
                    <RecentProjectCard
                      key={project.id}
                      project={project}
                      onSelect={() => {
                        // handled by parent
                        window.dispatchEvent(new CustomEvent('open-project', { detail: project.id }));
                      }}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface EntryCardProps {
  icon: any;
  title: string;
  description: string;
  onClick: () => void;
  primary?: boolean;
}

function EntryCard({ icon: Icon, title, description, onClick, primary }: EntryCardProps) {
  return (
    <button
      onClick={onClick}
      className={`group p-6 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
        primary
          ? 'bg-blue-600/10 border-blue-500/30 hover:bg-blue-600/20 hover:border-blue-500/50'
          : 'bg-slate-900 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-xl ${
            primary
              ? 'bg-blue-500/20 group-hover:bg-blue-500/30'
              : 'bg-slate-800 group-hover:bg-slate-700'
          } transition-colors`}
        >
          <Icon className={`w-6 h-6 ${primary ? 'text-blue-400' : 'text-slate-400'}`} />
        </div>
        <div className="flex-1">
          <h3
            className={`text-sm font-semibold mb-1 ${
              primary ? 'text-slate-100' : 'text-slate-200'
            }`}
          >
            {title}
          </h3>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
    </button>
  );
}

interface RecentProjectCardProps {
  project: ProjectRecord;
  onSelect: () => void;
  key?: string;
}

function RecentProjectCard({ project, onSelect }: RecentProjectCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-amber-500/20 text-amber-400',
    generated: 'bg-emerald-500/20 text-emerald-400',
  };

  const outputTargetLabels: Record<string, string> = {
    'lovart-slides': 'スライド',
    'external-infographic-image': 'インフォグラフィック',
  };

  return (
    <button
      onClick={onSelect}
      className="group p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-700 transition-all text-left"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-xs font-medium text-slate-200 line-clamp-2 flex-1">
          {project.title}
        </h4>
        <div className="flex items-center gap-1">
          {project.status && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColors[project.status] || statusColors.draft}`}>
              {project.status === 'generated' ? '完了' : '下書き'}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-slate-500">
        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
          {outputTargetLabels[project.outputTarget] || project.outputTarget}
        </span>
        <span>•</span>
        <span>{formatDate(project.updatedAt)}</span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors">
        <Zap className="w-3 h-3" />
        <span>開く</span>
      </div>
    </button>
  );
}
