'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { TaskPriority, Card } from '@/lib/types';
import { CheckSquare, Clock, AlertCircle, ChevronDown, ChevronUp, Edit2, Copy, Archive, Trash2, Calendar, Rocket } from 'lucide-react';
import ContextMenu from './ContextMenu';

type TaskTab = 'all' | 'today' | 'week';

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string; border: string }> = {
  high: { label: '高', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-400', },
  medium: { label: '中', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-400', },
  low: { label: '低', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-400', },
};

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return `今天 ${day}日`;
  return `${month}月${day}日`;
}

function isOverdue(dueDate?: number): boolean {
  if (!dueDate) return false;
  const now = Date.now();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return dueDate < now && dueDate < endOfToday.getTime();
}

function TaskCard({ card, onToggle }: { card: Card & { id: string }; onToggle: () => void }) {
  const { updateCard, openEditor, getProjects, archiveCard, deleteCard } = useAppStore();
  const [expanded, setExpanded] = useState(false);
  
  const priority = card.priority || 'medium';
  const priorityCfg = PRIORITY_CONFIG[priority];
  const overdue = isOverdue(card.dueDate);
  const projects = getProjects();
  const linkedProject = projects.find(p => p.id === card.projectId);
  const isArchived = card.archived;

  const taskMenuItems = isArchived ? [
    {
      icon: <Rocket className="w-4 h-4" />,
      label: '恢复',
      onClick: () => {
        const { restoreCard } = useAppStore.getState();
        restoreCard(card.id);
      },
    },
    {
      icon: <Trash2 className="w-4 h-4" />,
      label: '永久删除',
      danger: true,
      onClick: () => {
        if (confirm('确定永久删除吗？此操作不可恢复。')) {
          deleteCard(card.id);
        }
      },
    },
  ] : [
    {
      icon: <CheckSquare className="w-4 h-4" />,
      label: card.completed ? '重新打开' : '完成任务',
      onClick: () => updateCard(card.id as string, { completed: !card.completed }),
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      label: '设为今日任务',
      onClick: () => {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        updateCard(card.id as string, { dueDate: today.getTime() });
      },
      dividerBefore: true,
    },
    {
      icon: <Edit2 className="w-4 h-4" />,
      label: '编辑',
      onClick: () => openEditor(card as Parameters<typeof openEditor>[0]),
    },
    {
      icon: <Copy className="w-4 h-4" />,
      label: '复制为 Markdown',
      onClick: () => navigator.clipboard.writeText(`- [${card.completed ? 'x' : ' '}] ${card.title}`),
    },
    {
      icon: <Archive className="w-4 h-4" />,
      label: '归档',
      danger: true,
      onClick: () => archiveCard(card.id),
      dividerBefore: true,
    },
    {
      icon: <Trash2 className="w-4 h-4" />,
      label: '删除',
      danger: true,
      onClick: () => {
        if (confirm('确定删除吗？')) {
          deleteCard(card.id);
        }
      },
    },
  ];

  return (
    <div className="relative">
    <div className={`p-4 rounded-xl border transition-all ${
      card.completed 
        ? 'bg-stone-50/50 border-stone-200/40 opacity-60' 
        : 'bg-white/60 border-white/40 hover:border-stone-200/60 hover:bg-white/80'
    }`}>
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Priority color bar */}
        {!card.completed && (
          <div className={`w-1.5 rounded-full self-stretch min-h-[48px] shrink-0 ${priorityCfg.border.replace('border-', 'bg-')}`} />
        )}
        
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => updateCard(card.id as string, { completed: !card.completed })}
              className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                card.completed
                  ? 'bg-teal-500 border-teal-500 text-white'
                  : 'border-stone-300 hover:border-teal-400'
              }`}
            >
              {card.completed && <CheckSquare className="w-3.5 h-3.5" />}
            </button>
            
            <span className={`flex-1 text-sm font-medium line-clamp-1 ${
              card.completed ? 'line-through text-stone-400' : 'text-stone-800'
            }`}>
              {card.title}
            </span>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 ml-7 flex-wrap">
            {/* Priority badge */}
            {!card.completed && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${priorityCfg.bg} ${priorityCfg.color}`}>
                {priorityCfg.label}优先级
              </span>
            )}

            {/* Due date */}
            {card.dueDate && (
              <span className={`flex items-center gap-1 text-xs ${
                overdue && !card.completed ? 'text-red-500' : 'text-stone-400'
              }`}>
                <Clock className="w-3 h-3" />
                {formatDate(card.dueDate)}
                {overdue && !card.completed && <AlertCircle className="w-3 h-3" />}
              </span>
            )}

            {/* Linked project */}
            {linkedProject && (
              <span className="text-xs px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded">
                {linkedProject.title}
              </span>
            )}
          </div>
        </div>

        {/* Expand button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 text-stone-400 hover:text-stone-600 transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded panel */}
      {expanded && !card.completed && (
        <div className="mt-3 ml-7 space-y-3">
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateCard(card.id as string, { completed: !card.completed })}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors font-medium"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              {card.completed ? '重新打开' : '标记完成'}
            </button>
            
            <button
              onClick={() => openEditor(card as Parameters<typeof openEditor>[0])}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors"
            >
              编辑详情
            </button>
          </div>

          {/* Quick set priority */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">优先级：</span>
            {(['high', 'medium', 'low'] as TaskPriority[]).map(p => (
              <button
                key={p}
                onClick={() => updateCard(card.id as string, { priority: p })}
                className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
                  priority === p
                    ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color} font-medium`
                    : 'bg-stone-50 text-stone-400 hover:bg-stone-100'
                }`}
              >
                {PRIORITY_CONFIG[p].label}
              </button>
            ))}
          </div>

          {/* Quick set due date */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">截止日期：</span>
            <button
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(23, 59, 0, 0);
                updateCard(card.id as string, { dueDate: tomorrow.getTime() });
              }}
              className="px-2 py-0.5 text-xs bg-stone-50 text-stone-500 rounded-md hover:bg-stone-100 transition-colors"
            >
              明天
            </button>
            <button
              onClick={() => {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                nextWeek.setHours(23, 59, 0, 0);
                updateCard(card.id as string, { dueDate: nextWeek.getTime() });
              }}
              className="px-2 py-0.5 text-xs bg-stone-50 text-stone-500 rounded-md hover:bg-stone-100 transition-colors"
            >
              一周后
            </button>
            <button
              onClick={() => updateCard(card.id as string, { dueDate: undefined })}
              className="px-2 py-0.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              清除
            </button>
          </div>

          {/* Link to project */}
          {projects.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500">关联项目：</span>
              <select
                value={card.projectId || ''}
                onChange={e => updateCard(card.id as string, { projectId: e.target.value || undefined })}
                className="text-xs px-2 py-1 rounded-md border border-stone-200 bg-white text-stone-600"
              >
                <option value="">无</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Context Menu */}
      <div className="absolute top-3 right-3 z-10">
        <ContextMenu items={taskMenuItems} />
      </div>
    </div>
    </div>
  );
}

export default function TaskList() {
  const [tab, setTab] = useState<TaskTab>('all');
  const { getTasks, getTodayTasks, getWeekTasks, cards } = useAppStore();

  const completedTasks = cards.filter(c => c.paraType === 'task' && c.completed && !c.archived);

  const tasks = tab === 'today' ? getTodayTasks() : tab === 'week' ? getWeekTasks() : getTasks();
  const tabCount = tab === 'today' ? getTodayTasks().length : tab === 'week' ? getWeekTasks().length : getTasks().length;

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 bg-stone-100/60 rounded-xl w-fit">
        {(['all', 'today', 'week'] as TaskTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm rounded-lg transition-all font-medium ${
              tab === t
                ? 'bg-white text-stone-800 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {t === 'all' ? '全部' : t === 'today' ? '今日' : '本周'}
            <span className="ml-1.5 text-xs opacity-60">{t === 'all' ? getTasks().length : t === 'today' ? getTodayTasks().length : getWeekTasks().length}</span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl flex items-center justify-center shadow-lg">
            <CheckSquare className="w-8 h-8 text-teal-500" />
          </div>
          <h3 className="text-lg font-semibold text-stone-700 mb-2">
            {tab === 'today' ? '今天没有任务' : tab === 'week' ? '本周没有任务' : '暂无任务'}
          </h3>
          <p className="text-sm text-stone-400">点击右下角按钮创建任务 ✨</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <TaskCard key={task.id} card={task as never} onToggle={() => {}} />
          ))}
        </div>
      )}

      {/* Completed section */}
      {completedTasks.length > 0 && (
        <div className="mt-6">
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-sm text-stone-500 hover:text-stone-700 mb-2">
              <CheckSquare className="w-4 h-4" />
              已完成 ({completedTasks.length})
            </summary>
            <div className="space-y-1 mt-2">
              {completedTasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-stone-50/50">
                  <CheckSquare className="w-4 h-4 text-teal-400 shrink-0" />
                  <span className="text-sm text-stone-400 line-through flex-1">{task.title}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
