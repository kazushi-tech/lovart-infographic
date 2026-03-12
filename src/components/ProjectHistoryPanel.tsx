/**
 * Project History Panel Component
 *
 * プロジェクト履歴を表示・管理するパネル
 * プロジェクト一覧、開く、複製、削除機能を提供
 */

import React from 'react';
import { Clock, FileText, Trash2, Copy, Eye, X, FolderOpen } from 'lucide-react';
import type { ProjectRecord } from '../types/project';

interface ProjectHistoryPanelProps {
  projects: ProjectRecord[];
  isLoading: boolean;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function ProjectHistoryPanel({
  projects,
  isLoading,
  onOpen,
  onDuplicate,
  onDelete,
  onClose,
}: ProjectHistoryPanelProps) {
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
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-amber-500/20 text-amber-400',
    generated: 'bg-emerald-500/20 text-emerald-400',
  };

  const statusLabels: Record<string, string> = {
    draft: '下書き',
    generated: '完了',
  };

  const outputTargetLabels: Record<string, string> = {
    'lovart-slides': 'スライド',
    'external-infographic-image': 'インフォグラフィック',
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('このプロジェクトを削除しますか？この操作は取り消せません。')) {
      onDelete(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-100">プロジェクト履歴</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Clock className="w-8 h-8 mb-3 animate-pulse" />
              <p className="text-sm">プロジェクトを読み込み中...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <FileText className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm font-medium text-slate-400 mb-1">プロジェクトがありません</p>
              <p className="text-xs">新しいプロジェクトを作成して始めましょう</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  formatDate={formatDate}
                  statusColors={statusColors}
                  statusLabels={statusLabels}
                  outputTargetLabels={outputTargetLabels}
                  onOpen={() => onOpen(project.id)}
                  onDuplicate={(e) => {
                    e.stopPropagation();
                    onDuplicate(project.id);
                  }}
                  onDelete={(e) => handleDeleteClick(e, project.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {projects.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/50 text-xs text-slate-500 flex justify-between items-center">
            <span>{projects.length} 件のプロジェクト</span>
            <span>スライドをドラッグして並べ替えはできません</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface ProjectCardProps {
  project: ProjectRecord;
  formatDate: (date: string) => string;
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
  outputTargetLabels: Record<string, string>;
  onOpen: () => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  key?: string;
}

function ProjectCard({
  project,
  formatDate,
  statusColors,
  statusLabels,
  outputTargetLabels,
  onOpen,
  onDuplicate,
  onDelete,
}: ProjectCardProps) {
  return (
    <button
      onClick={onOpen}
      className="group w-full p-4 rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-700 transition-all text-left"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-slate-200 truncate">
              {project.title}
            </h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${statusColors[project.status] || statusColors.draft}`}>
              {statusLabels[project.status] || statusLabels.draft}
            </span>
          </div>

          {project.description && (
            <p className="text-xs text-slate-500 line-clamp-1 mb-2">{project.description}</p>
          )}

          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-400">
              {outputTargetLabels[project.outputTarget] || project.outputTarget}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(project.updatedAt)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onOpen}
            className="p-2 rounded-lg hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors"
            title="開く"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="複製"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
            title="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </button>
  );
}
