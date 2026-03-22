'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { ProjectStatus, Card } from '@/lib/types';
import { PROJECT_STATUS_ORDER, PROJECT_STATUS_LABELS } from '@/lib/store';
import { Rocket, CheckSquare, FileText, BookOpen, Calendar, Archive, ChevronRight, ChevronDown, Clock, Plus, X } from 'lucide-react';
import RelationPicker from './RelationPicker';

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}月${day}日`;
}

function getStatusIndex(status?: string): number {
  if (!status) return 0;
  return PROJECT_STATUS_ORDER.indexOf(status as ProjectStatus);
}

export default function ProjectDetail() {
  const { getProjects, cards, updateCard, deleteCard } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const allProjects = getProjects();
  const activeProjects = allProjects.filter(p => p.projectStatus !== 'archived');
  const archivedProjects = allProjects.filter(p => p.projectStatus === 'archived');

  if (allProjects.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-lg">
          <Rocket className="w-8 h-8 text-indigo-500" />
        </div>
        <h3 className="text-lg font-semibold text-stone-700 mb-2">暂无项目</h3>
        <p className="text-sm text-stone-400">点击右下角按钮创建项目 🚀</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active projects */}
      <div className="space-y-3">
        {activeProjects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            isExpanded={expandedId === project.id}
            onToggle={() => setExpandedId(expandedId === project.id ? null : project.id)}
          />
        ))}
      </div>

      {/* Archived projects */}
      {archivedProjects.length > 0 && (
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm text-stone-500 hover:text-stone-700 px-1">
            <Archive className="w-4 h-4" />
            已归档 ({archivedProjects.length})
          </summary>
          <div className="mt-2 space-y-2 opacity-70">
            {archivedProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                isExpanded={false}
                onToggle={() => {}}
                readonly
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    content?: string;
    projectStatus?: string;
    projectDeadline?: number;
    createdAt: number;
    updatedAt: number;
  };
  isExpanded: boolean;
  onToggle: () => void;
  readonly?: boolean;
}

function ProjectCard({ project, isExpanded, onToggle, readonly }: ProjectCardProps) {
  const { updateCard, deleteCard, cards, openEditor, linkTasksToProject, unlinkTaskFromProject, linkNotesToProject, linkResourcesToProject } = useAppStore();
  const [relationPicker, setRelationPicker] = useState<{ type: 'task' | 'note' | 'resource' } | null>(null);

  // Derive linked items from cards using projectId relationship
  const linkedTasks = cards.filter(c => c.paraType === 'task' && c.projectId === project.id);
  const completedTasks = linkedTasks.filter(t => t.completed);
  const progress = linkedTasks.length > 0 ? `${completedTasks.length}/${linkedTasks.length}` : null;

  // Get linked notes & resources
  const linkedNotes = cards.filter(c => c.paraType === 'note' && c.projectId === project.id);
  const linkedResources = cards.filter(c => c.paraType === 'resource' && c.projectId === project.id);

  const statusIdx = getStatusIndex(project.projectStatus);
  const isArchived = project.projectStatus === 'archived';

  return (
    <div className={`glass-soft rounded-2xl overflow-hidden transition-all ${
      isArchived ? 'opacity-70' : ''
    }`}>
      {/* Header - always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left p-5 flex items-center gap-3"
      >
        <Rocket className="w-5 h-5 text-indigo-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-stone-800 truncate">{project.title}</h3>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {project.projectDeadline && (
              <span className="flex items-center gap-1 text-xs text-stone-400">
                <Calendar className="w-3 h-3" />
                {formatDate(project.projectDeadline)}
              </span>
            )}
            {progress && (
              <span className="text-xs text-indigo-500 font-medium">{progress} 完成</span>
            )}
          </div>
        </div>

        {/* Status badge */}
        <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-500 rounded-lg shrink-0">
          {PROJECT_STATUS_LABELS[(project.projectStatus || 'idea') as keyof typeof PROJECT_STATUS_LABELS]}
        </span>

        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && !readonly && (
        <div className="px-5 pb-5 space-y-4">
          {/* Status flow */}
          <div>
            <p className="text-xs text-stone-500 mb-2 font-medium">项目阶段</p>
            <div className="flex items-center gap-1">
              {PROJECT_STATUS_ORDER.map((status, idx) => (
                <button
                  key={status}
                  onClick={() => updateCard(project.id, { projectStatus: status })}
                  disabled={isArchived}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                    idx === statusIdx
                      ? 'bg-indigo-500 text-white font-medium shadow-md'
                      : idx < statusIdx
                      ? 'bg-indigo-100 text-indigo-400 cursor-default'
                      : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                  } ${!isArchived && idx > statusIdx ? 'hover:shadow-sm' : ''}`}
                >
                  {PROJECT_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          {/* Linked tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-stone-500 font-medium flex items-center gap-1">
                <CheckSquare className="w-3.5 h-3.5" />
                关联任务 ({completedTasks.length}/{linkedTasks.length})
              </p>
              {!readonly && !isArchived && (
                <button
                  onClick={() => setRelationPicker({ type: 'task' })}
                  className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> 添加
                </button>
              )}
            </div>
            {linkedTasks.length > 0 ? (
              <div className="space-y-1.5">
                {linkedTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors group">
                    <button
                      onClick={() => updateCard(task.id, { completed: !task.completed })}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                        task.completed ? 'bg-teal-500 border-teal-500' : 'border-stone-300'
                      }`}
                    >
                      {task.completed && <CheckSquare className="w-3 h-3 text-white" />}
                    </button>
                    <span className={`text-sm flex-1 ${task.completed ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                      {task.title}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-stone-400 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                    {!readonly && !isArchived && (
                      <button
                        onClick={() => unlinkTaskFromProject(project.id, task.id)}
                        className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">暂无关联任务</p>
            )}
          </div>

          {/* Linked notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-stone-500 font-medium flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                关联笔记 ({linkedNotes.length})
              </p>
              {!readonly && !isArchived && (
                <button
                  onClick={() => setRelationPicker({ type: 'note' })}
                  className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> 添加
                </button>
              )}
            </div>
            {linkedNotes.length > 0 ? (
              <div className="space-y-1">
                {linkedNotes.map(note => (
                  <div key={note.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors group">
                    <button
                      onClick={() => openEditor(note as Parameters<typeof openEditor>[0])}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <FileText className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="text-sm text-stone-700 truncate">{note.title}</span>
                      <ChevronRight className="w-3 h-3 text-stone-300 shrink-0" />
                    </button>
                    {!readonly && !isArchived && (
                      <button
                        onClick={() => {
                          updateCard(note.id, { projectId: undefined });
                        }}
                        className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">暂无关联笔记</p>
            )}
          </div>

          {/* Linked resources */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-stone-500 font-medium flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                关联资源 ({linkedResources.length})
              </p>
              {!readonly && !isArchived && (
                <button
                  onClick={() => setRelationPicker({ type: 'resource' })}
                  className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> 添加
                </button>
              )}
            </div>
            {linkedResources.length > 0 ? (
              <div className="space-y-1">
                {linkedResources.map(res => (
                  <div key={res.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors group">
                    <button
                      onClick={() => openEditor(res as Parameters<typeof openEditor>[0])}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="text-sm text-stone-700 truncate">{res.title}</span>
                      <ChevronRight className="w-3 h-3 text-stone-300 shrink-0" />
                    </button>
                    {!readonly && !isArchived && (
                      <button
                        onClick={() => {
                          // Resource cards need projectId field to support unlinking
                        }}
                        className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">暂无关联资源</p>
            )}
          </div>

          {/* Project notes */}
          {project.content && (
            <p className="text-sm text-stone-500 bg-white/40 rounded-lg p-3">{project.content}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {!isArchived && (
              <>
                <button
                  onClick={() => openEditor(project as Parameters<typeof openEditor>[0])}
                  className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
                >
                  编辑
                </button>
                <button
                  onClick={() => updateCard(project.id, { projectStatus: 'archived' })}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-stone-100 text-stone-500 rounded-lg hover:bg-stone-200 transition-colors"
                >
                  <Archive className="w-3 h-3" />
                  归档
                </button>
              </>
            )}
            <button
              onClick={() => {
                if (confirm('确定删除该项目？')) deleteCard(project.id);
              }}
              className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto"
            >
              删除
            </button>
          </div>

          {/* Relation Picker Modal */}
          {relationPicker && (
            <RelationPicker
              paraType={relationPicker.type}
              currentLinkedIds={
                relationPicker.type === 'task'
                  ? linkedTasks.map(t => t.id)
                  : relationPicker.type === 'note'
                  ? linkedNotes.map(n => n.id)
                  : linkedResources.map(r => r.id)
              }
              onConfirm={(selectedIds) => {
                if (relationPicker.type === 'task') {
                  selectedIds.forEach(id => updateCard(id, { projectId: project.id }));
                } else if (relationPicker.type === 'note') {
                  selectedIds.forEach(id => updateCard(id, { projectId: project.id }));
                } else {
                  // Resource linking not fully implemented
                }
                setRelationPicker(null);
              }}
              onClose={() => setRelationPicker(null)}
            />
          )}
        </div>
      )}

      {/* Readonly expanded view */}
      {isExpanded && readonly && (
        <div className="px-5 pb-5">
          {project.content && (
            <p className="text-sm text-stone-500 bg-white/40 rounded-lg p-3 mb-3">{project.content}</p>
          )}
          <button
            onClick={() => updateCard(project.id, { projectStatus: 'active' })}
            className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
          >
            取消归档
          </button>
        </div>
      )}
    </div>
  );
}
