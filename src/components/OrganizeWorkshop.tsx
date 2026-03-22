'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/lib/types';
import { Clock, Trash2, CheckSquare, FileText, Rocket, AlertTriangle, ChevronDown, ChevronUp, X, Calendar } from 'lucide-react';

function getTimeRemaining(expiresAt: number): { text: string; color: string; urgent: boolean; expired: boolean } {
  const now = Date.now();
  const diff = expiresAt - now;
  
  if (diff <= 0) {
    return { text: '已过期', color: 'text-red-500', urgent: true, expired: true };
  }
  
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  
  if (hours > 12) {
    return { text: `${hours}小时后过期`, color: 'text-green-500', urgent: false, expired: false };
  } else if (hours > 4) {
    return { text: `${hours}小时后过期`, color: 'text-yellow-500', urgent: false, expired: false };
  } else if (hours > 0) {
    return { text: `${hours}小时${minutes}分钟后过期`, color: 'text-orange-500', urgent: true, expired: false };
  } else {
    return { text: `${minutes}分钟后过期`, color: 'text-red-500', urgent: true, expired: false };
  }
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}月${day}日`;
}

interface OrganizeCardProps {
  note: Card;
  isSelected: boolean;
  onToggleSelect: () => void;
}

function OrganizeCard({ note, isSelected, onToggleSelect }: OrganizeCardProps) {
  const { deleteCard, convertFlashToTask, convertFlashToNote, convertFlashToProject, openEditor, updateCard } = useAppStore();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [taskDueDate, setTaskDueDate] = useState<Date | null>(null);
  const [projectDeadline, setProjectDeadline] = useState<Date | null>(null);
  const [projectTitle, setProjectTitle] = useState(note.title);
  
  const timeInfo = note.flashExpiresAt ? getTimeRemaining(note.flashExpiresAt) : null;
  const preview = note.content?.slice(0, 80) + (note.content?.length > 80 ? '...' : '');

  const handleConvertToTask = () => {
    if (taskDueDate) {
      updateCard(note.id, {
        paraType: 'task',
        flashExpiresAt: undefined,
        completed: false,
        dueDate: taskDueDate.getTime(),
        organizedFrom: 'flash',
        organizedAt: Date.now(),
      });
    }
    setShowTaskModal(false);
  };

  const handleConvertToProject = () => {
    if (projectTitle.trim()) {
      updateCard(note.id, {
        paraType: 'project',
        flashExpiresAt: undefined,
        projectStatus: 'idea',
        title: projectTitle.trim(),
        projectDeadline: projectDeadline?.getTime(),
        organizedFrom: 'flash',
        organizedAt: Date.now(),
      });
    }
    setShowProjectModal(false);
  };

  return (
    <>
      <div className={`p-4 rounded-xl border transition-all ${
        timeInfo?.expired
          ? 'bg-red-50/60 border-red-200/60'
          : timeInfo?.urgent
          ? 'bg-orange-50/60 border-orange-200/60'
          : 'bg-amber-50/40 border-amber-200/40 hover:border-amber-300 hover:bg-amber-50/60'
      } ${isSelected ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {/* Selection checkbox */}
            <button
              onClick={onToggleSelect}
              className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all mt-0.5 ${
                isSelected
                  ? 'bg-indigo-500 border-indigo-500 text-white'
                  : 'border-stone-300 hover:border-indigo-400'
              }`}
            >
              {isSelected && <CheckSquare className="w-3.5 h-3.5" />}
            </button>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-stone-800 line-clamp-1">{note.title}</h4>
              {preview && (
                <p className="text-sm text-stone-500 mt-1 line-clamp-2">{preview}</p>
              )}
            </div>
          </div>
          
          {timeInfo && (
            <span className={`flex items-center gap-1 text-xs shrink-0 ${timeInfo.color}`}>
              <Clock className="w-3 h-3" />
              {timeInfo.text}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-7">
          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors font-medium"
          >
            <CheckSquare className="w-3 h-3" />
            转为任务
          </button>
          <button
            onClick={() => convertFlashToNote(note.id)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <FileText className="w-3 h-3" />
            转为笔记
          </button>
          <button
            onClick={() => setShowProjectModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Rocket className="w-3 h-3" />
            升级项目
          </button>
          <button
            onClick={() => deleteCard(note.id)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto"
          >
            <Trash2 className="w-3 h-3" />
            删除
          </button>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowTaskModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-800">转为任务</h3>
              <button onClick={() => setShowTaskModal(false)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-stone-600 mb-1">任务标题</p>
              <p className="font-medium text-stone-800">{note.title}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-stone-600 mb-2 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                截止日期
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '今天', days: 0 },
                  { label: '明天', days: 1 },
                  { label: '3天后', days: 3 },
                  { label: '本周', days: 7 },
                ].map(({ label, days }) => {
                  const d = new Date();
                  d.setDate(d.getDate() + days);
                  d.setHours(23, 59, 0, 0);
                  const isSelected = taskDueDate && taskDueDate.toDateString() === d.toDateString();
                  return (
                    <button
                      key={label}
                      onClick={() => setTaskDueDate(d)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-teal-500 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleConvertToTask}
              disabled={!taskDueDate}
              className="w-full py-2.5 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认转换
            </button>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowProjectModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-800">升级为项目</h3>
              <button onClick={() => setShowProjectModal(false)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-stone-600 mb-1">项目名称</p>
              <input
                type="text"
                value={projectTitle}
                onChange={e => setProjectTitle(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="输入项目名称..."
              />
            </div>

            <div className="mb-4">
              <p className="text-sm text-stone-600 mb-2 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                项目截止日期（可选）
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '无', days: -1 },
                  { label: '本周', days: 7 },
                  { label: '本月', days: 30 },
                  { label: '下季度', days: 90 },
                ].map(({ label, days }) => {
                  if (days === -1) {
                    return (
                      <button
                        key={label}
                        onClick={() => setProjectDeadline(null)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          projectDeadline === null
                            ? 'bg-indigo-500 text-white'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  }
                  const d = new Date();
                  d.setDate(d.getDate() + days);
                  d.setHours(23, 59, 0, 0);
                  return (
                    <button
                      key={label}
                      onClick={() => setProjectDeadline(d)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        projectDeadline && projectDeadline.toDateString() === d.toDateString()
                          ? 'bg-indigo-500 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleConvertToProject}
              disabled={!projectTitle.trim()}
              className="w-full py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认升级
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function OrganizeWorkshop() {
  const { getUnorganizedFlashes, getExpiredFlashNotes, cards, convertFlashToTask, convertFlashToNote, getFlashStats } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showExpired, setShowExpired] = useState(true);

  const unorganizedFlashes = getUnorganizedFlashes();
  const expiredFlashes = getExpiredFlashNotes();
  const flashStats = getFlashStats();

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === unorganizedFlashes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unorganizedFlashes.map(n => n.id)));
    }
  };

  const batchConvertToTask = () => {
    selectedIds.forEach(id => {
      convertFlashToTask(id);
    });
    setSelectedIds(new Set());
  };

  const batchConvertToNote = () => {
    selectedIds.forEach(id => {
      convertFlashToNote(id);
    });
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="flex items-center gap-4 p-4 glass-soft rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-stone-800">{flashStats.total}</span>
          <span className="text-sm text-stone-500">待整理</span>
        </div>
        {flashStats.expired > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-full">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-600">{flashStats.expired} 已过期</span>
          </div>
        )}
        {flashStats.urgent > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-600">{flashStats.urgent} 紧急</span>
          </div>
        )}
      </div>

      {/* Batch Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
          <span className="text-sm text-indigo-600 font-medium">
            已选择 {selectedIds.size} 条
          </span>
          <button
            onClick={batchConvertToTask}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            <CheckSquare className="w-3 h-3" />
            批量转为任务
          </button>
          <button
            onClick={batchConvertToNote}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-stone-500 text-white rounded-lg hover:bg-stone-600 transition-colors"
          >
            <FileText className="w-3 h-3" />
            批量转为笔记
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-stone-500 hover:text-stone-700"
          >
            取消选择
          </button>
        </div>
      )}

      {/* Expired Section */}
      {expiredFlashes.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowExpired(!showExpired)}
            className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
          >
            {showExpired ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <AlertTriangle className="w-4 h-4" />
            已过期 ({expiredFlashes.length})
          </button>
          
          {showExpired && (
            <div className="space-y-2">
              {expiredFlashes.map(note => (
                <OrganizeCard
                  key={note.id}
                  note={note}
                  isSelected={selectedIds.has(note.id)}
                  onToggleSelect={() => toggleSelect(note.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Flash Notes */}
      {unorganizedFlashes.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
              活跃闪念 ({unorganizedFlashes.length})
            </h3>
            <button
              onClick={toggleSelectAll}
              className="text-xs text-indigo-500 hover:text-indigo-600"
            >
              {selectedIds.size === unorganizedFlashes.length ? '取消全选' : '全选'}
            </button>
          </div>
          <div className="space-y-2">
            {unorganizedFlashes.map(note => (
              <OrganizeCard
                key={note.id}
                note={note}
                isSelected={selectedIds.has(note.id)}
                onToggleSelect={() => toggleSelect(note.id)}
              />
            ))}
          </div>
        </div>
      ) : expiredFlashes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center shadow-lg">
            <CheckSquare className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-stone-700 mb-2">太棒了！</h3>
          <p className="text-sm text-stone-400">所有闪念笔记都已整理完毕 ✨</p>
        </div>
      ) : null}
    </div>
  );
}
