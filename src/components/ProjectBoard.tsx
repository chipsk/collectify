'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, ProjectStatus } from '@/lib/types';
import { PROJECT_STATUS_ORDER, PROJECT_STATUS_LABELS } from '@/lib/store';
import { Rocket, CheckSquare, FileText, BookOpen, Calendar, Archive, ChevronDown, ChevronRight, Clock, Plus, X, Edit2, Copy, Trash2, Link2, LayoutList, Columns } from 'lucide-react';
import ContextMenu from './ContextMenu';
import RelationPicker from './RelationPicker';

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}月${day}日`;
}

interface ProjectCardMiniProps {
  project: Card;
  onExpand: () => void;
}

function ProjectCardMini({ project, onExpand }: ProjectCardMiniProps) {
  const { cards, updateCard, openEditor, archiveCard, deleteCard } = useAppStore();

  const linkedTasks = cards.filter(c => c.paraType === 'task' && c.projectId === project.id);
  const completedTasks = linkedTasks.filter(t => t.completed);
  const progress = linkedTasks.length > 0 ? Math.round((completedTasks.length / linkedTasks.length) * 100) : 0;

  const isArchived = project.projectStatus === 'archived';

  const projectMenuItems = isArchived ? [
    { icon: <Rocket className="w-4 h-4" />, label: '恢复项目', onClick: () => updateCard(project.id, { projectStatus: 'active' }) },
    { icon: <Trash2 className="w-4 h-4" />, label: '永久删除', danger: true, onClick: () => { if (confirm('确定永久删除吗？')) deleteCard(project.id); } },
  ] : [
    ...(project.projectStatus !== 'idea' ? [{ icon: <Rocket className="w-4 h-4" />, label: '设为构思', onClick: () => updateCard(project.id, { projectStatus: 'idea' }) }] : []),
    ...(project.projectStatus !== 'active' ? [{ icon: <Rocket className="w-4 h-4" />, label: '设为进行中', onClick: () => updateCard(project.id, { projectStatus: 'active' }) }] : []),
    ...(project.projectStatus !== 'completed' ? [{ icon: <CheckSquare className="w-4 h-4" />, label: '设为已完成', onClick: () => updateCard(project.id, { projectStatus: 'completed' }) }] : []),
    ...(project.projectStatus !== 'review' ? [{ icon: <FileText className="w-4 h-4" />, label: '设为复盘', onClick: () => updateCard(project.id, { projectStatus: 'review' }) }] : []),
    { icon: <Edit2 className="w-4 h-4" />, label: '编辑', onClick: () => openEditor(project as Parameters<typeof openEditor>[0]), dividerBefore: true },
    { icon: <Link2 className="w-4 h-4" />, label: '复制链接', onClick: () => navigator.clipboard.writeText(`[[${project.title}]]`) },
    { icon: <Archive className="w-4 h-4" />, label: '归档', danger: true, onClick: () => archiveCard(project.id), dividerBefore: true },
    { icon: <Trash2 className="w-4 h-4" />, label: '删除', danger: true, onClick: () => { if (confirm('确定删除吗？')) deleteCard(project.id); } },
  ];

  return (
    <div className="relative group/project">
      <div
        className="p-3 bg-white/60 border border-white/40 rounded-xl hover:border-indigo-200/60 hover:bg-white/80 transition-all cursor-pointer"
        onClick={onExpand}
      >
        <div className="flex items-start gap-2 mb-2">
          <Rocket className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <h4 className="font-medium text-stone-800 text-sm line-clamp-1 flex-1">{project.title}</h4>
        </div>

        {linkedTasks.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-stone-400">{completedTasks.length}/{linkedTasks.length} 任务</span>
              <span className="text-indigo-500 font-medium">{progress}%</span>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-stone-400">
          {project.projectDeadline && (
            <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{formatDate(project.projectDeadline)}</span>
          )}
          {linkedTasks.length > 0 && (
            <span className="flex items-center gap-0.5"><CheckSquare className="w-3 h-3" />{linkedTasks.length}</span>
          )}
        </div>
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover/project:opacity-100 transition-opacity z-10">
        <ContextMenu items={projectMenuItems} />
      </div>
    </div>
  );
}

interface ProjectExpandedProps {
  project: Card;
  onClose: () => void;
}

function ProjectExpanded({ project, onClose }: ProjectExpandedProps) {
  const { cards, updateCard, deleteCard, openEditor } = useAppStore();
  const [relationPicker, setRelationPicker] = useState<{ type: 'task' | 'note' | 'resource' } | null>(null);

  const linkedTasks = cards.filter(c => c.paraType === 'task' && c.projectId === project.id);
  const completedTasks = linkedTasks.filter(t => t.completed);
  const linkedNotes = cards.filter(c => c.paraType === 'note' && c.projectId === project.id);
  const linkedResources = cards.filter(c => c.paraType === 'resource' && c.projectId === project.id);

  const statusIdx = PROJECT_STATUS_ORDER.indexOf(project.projectStatus || 'idea');
  const isArchived = project.projectStatus === 'archived';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <Rocket className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-stone-800">{project.title}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <p className="text-xs text-stone-500 mb-2 font-medium">项目阶段</p>
            <div className="flex items-center gap-1 flex-wrap">
              {PROJECT_STATUS_ORDER.map((status, idx) => (
                <button
                  key={status}
                  onClick={() => !isArchived && updateCard(project.id, { projectStatus: status })}
                  disabled={isArchived}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                    idx === statusIdx
                      ? 'bg-indigo-500 text-white font-medium shadow-md'
                      : idx < statusIdx
                      ? 'bg-indigo-100 text-indigo-400 cursor-default'
                      : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                  } ${!isArchived && idx > statusIdx ? 'hover:shadow-sm cursor-pointer' : ''}`}
                >
                  {PROJECT_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-stone-500 font-medium flex items-center gap-1">
                <CheckSquare className="w-3.5 h-3.5" />
                关联任务 ({completedTasks.length}/{linkedTasks.length})
              </p>
              {!isArchived && (
                <button onClick={() => setRelationPicker({ type: 'task' })} className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5">
                  <Plus className="w-3 h-3" /> 添加
                </button>
              )}
            </div>
            {linkedTasks.length > 0 ? (
              <div className="space-y-1.5">
                {linkedTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors group">
                    <button onClick={() => updateCard(task.id, { completed: !task.completed })} className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${task.completed ? 'bg-teal-500 border-teal-500' : 'border-stone-300'}`}>
                      {task.completed && <CheckSquare className="w-3 h-3 text-white" />}
                    </button>
                    <span className={`text-sm flex-1 ${task.completed ? 'line-through text-stone-400' : 'text-stone-700'}`}>{task.title}</span>
                    {task.dueDate && <span className="text-xs text-stone-400 flex items-center gap-0.5"><Clock className="w-3 h-3" />{formatDate(task.dueDate)}</span>}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-stone-400 italic">暂无关联任务</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-stone-500 font-medium flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                关联笔记 ({linkedNotes.length})
              </p>
            </div>
            {linkedNotes.length > 0 ? (
              <div className="space-y-1">
                {linkedNotes.map(note => (
                  <div key={note.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors group">
                    <button onClick={() => { onClose(); openEditor(note as Parameters<typeof openEditor>[0]); }} className="flex items-center gap-2 flex-1 text-left">
                      <FileText className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="text-sm text-stone-700 truncate">{note.title}</span>
                      <ChevronRight className="w-3 h-3 text-stone-300 shrink-0" />
                    </button>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-stone-400 italic">暂无关联笔记</p>}
          </div>

          {project.content && (
            <p className="text-sm text-stone-500 bg-stone-50 rounded-lg p-3">{project.content}</p>
          )}
        </div>

        <div className="p-5 border-t border-stone-100 flex items-center gap-2">
          {!isArchived && (
            <button onClick={() => { onClose(); openEditor(project as Parameters<typeof openEditor>[0]); }} className="px-4 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors font-medium">
              编辑详情
            </button>
          )}
          <button onClick={() => { if (confirm('确定删除该项目？')) { deleteCard(project.id); onClose(); } }} className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors ml-auto">
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectBoard() {
  const { cards } = useAppStore();
  const [expandedProject, setExpandedProject] = useState<Card | null>(null);
  const [view, setView] = useState<'all' | 'kanban'>('all');

  // All projects sorted by updatedAt desc
  const allProjects = [...cards.filter(c => c.paraType === 'project')].sort((a, b) => b.updatedAt - a.updatedAt);

  // Group by status for kanban
  const groupedProjects = PROJECT_STATUS_ORDER.reduce((acc, status) => {
    acc[status] = allProjects.filter(p => p.projectStatus === status);
    return acc;
  }, {} as Record<ProjectStatus, Card[]>);

  const activeColumns = PROJECT_STATUS_ORDER.filter(s => s !== 'archived');
  const archivedProjects = groupedProjects.archived || [];

  if (allProjects.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-lg">
          <Rocket className="w-8 h-8 text-indigo-500" />
        </div>
        <h3 className="text-lg font-semibold text-stone-700 mb-2">暂无项目</h3>
        <p className="text-sm text-stone-400">点击右下角按钮创建项目</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView('all')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            view === 'all' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
          }`}
        >
          <LayoutList className="w-4 h-4" />
          全部项目
        </button>
        <button
          onClick={() => setView('kanban')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            view === 'kanban' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
          }`}
        >
          <Columns className="w-4 h-4" />
          看板视图
        </button>
      </div>

      {/* ALL VIEW */}
      {view === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allProjects.map(project => {
            const linkedTasks = cards.filter(c => c.paraType === 'task' && c.projectId === project.id);
            const completedTasks = linkedTasks.filter(t => t.completed);
            const progress = linkedTasks.length > 0 ? Math.round((completedTasks.length / linkedTasks.length) * 100) : 0;
            const statusColors: Record<string, string> = {
              idea: 'bg-stone-100 text-stone-600',
              active: 'bg-indigo-100 text-indigo-600',
              completed: 'bg-green-100 text-green-600',
              review: 'bg-yellow-100 text-yellow-700',
              archived: 'bg-stone-100 text-stone-400',
            };

            return (
              <div
                key={project.id}
                className="p-5 bg-white/60 border border-white/40 rounded-2xl hover:border-indigo-200/60 hover:bg-white/80 transition-all cursor-pointer"
                onClick={() => setExpandedProject(project)}
              >
                <div className="flex items-start gap-2 mb-3">
                  <Rocket className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <h4 className="font-semibold text-stone-800 line-clamp-1 flex-1">{project.title}</h4>
                </div>

                {project.content && (
                  <p className="text-xs text-stone-400 line-clamp-2 mb-3">{project.content}</p>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[project.projectStatus || 'idea']}`}>
                    {PROJECT_STATUS_LABELS[project.projectStatus || 'idea']}
                  </span>
                  {project.projectDeadline && (
                    <span className="text-xs text-stone-400 flex items-center gap-0.5">
                      <Calendar className="w-3 h-3" />{formatDate(project.projectDeadline)}
                    </span>
                  )}
                </div>

                {linkedTasks.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-stone-400">{completedTasks.length}/{linkedTasks.length} 任务</span>
                      <span className="text-indigo-500 font-medium">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* KANBAN VIEW — vertical columns */}
      {view === 'kanban' && (
        <div className="flex gap-4">
          {activeColumns.map(status => {
            const projects = groupedProjects[status] || [];
            const statusColors: Record<string, string> = {
              idea: 'bg-stone-100 border-stone-200',
              active: 'bg-indigo-50 border-indigo-200',
              completed: 'bg-green-50 border-green-200',
              review: 'bg-yellow-50 border-yellow-200',
              archived: 'bg-stone-50 border-stone-200',
            };

            return (
              <div key={status} className="flex-1 min-w-[240px] flex flex-col gap-3">
                {/* Column Header */}
                <div className={`p-3 rounded-xl border ${statusColors[status]}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-stone-700 text-sm">{PROJECT_STATUS_LABELS[status]}</h3>
                    <span className="text-xs text-stone-500 bg-white px-2 py-0.5 rounded-full">{projects.length}</span>
                  </div>
                </div>

                {/* Column Cards — vertical stack with max-height scroll */}
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[60vh] pr-1">
                  {projects.map(project => (
                    <ProjectCardMini
                      key={project.id}
                      project={project}
                      onExpand={() => setExpandedProject(project)}
                    />
                  ))}
                  {projects.length === 0 && (
                    <p className="text-xs text-stone-400 text-center py-4 italic">暂无项目</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Archived Section */}
      {archivedProjects.length > 0 && (
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm text-stone-500 hover:text-stone-700 px-2">
            <Archive className="w-4 h-4" />
            已归档 ({archivedProjects.length})
            <ChevronDown className="w-4 h-4 ml-auto group-open:rotate-180 transition-transform" />
          </summary>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 opacity-70">
            {archivedProjects.map(project => (
              <div
                key={project.id}
                className="p-3 bg-stone-50 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-100 transition-colors"
                onClick={() => setExpandedProject(project)}
              >
                <h4 className="font-medium text-stone-600 text-sm line-clamp-1">{project.title}</h4>
                {project.projectDeadline && (
                  <p className="text-xs text-stone-400 mt-1">截止: {formatDate(project.projectDeadline)}</p>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Expanded Project Modal */}
      {expandedProject && (
        <ProjectExpanded project={expandedProject} onClose={() => setExpandedProject(null)} />
      )}
    </div>
  );
}
