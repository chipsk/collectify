'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/lib/types';
import { CheckSquare, FileText, Target, Rocket, Calendar, ChevronRight, X } from 'lucide-react';

interface AreaDetailProps {
  area: Card;
  onClose: () => void;
}

function NoteMiniCard({ note, onOpen }: { note: Card; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="w-full text-left p-3 bg-white/60 border border-white/40 rounded-xl hover:bg-white/80 hover:border-indigo-200/50 transition-all"
    >
      <div className="flex items-center gap-2">
        <FileText className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <span className="text-sm text-stone-700 flex-1 truncate">{note.title}</span>
        <ChevronRight className="w-3 h-3 text-stone-300 shrink-0" />
      </div>
      {note.content && (
        <p className="text-xs text-stone-400 mt-1 ml-5 line-clamp-1">{note.content}</p>
      )}
    </button>
  );
}

function ProjectMiniCard({ project, onOpen }: { project: Card; onOpen: () => void }) {
  const { cards } = useAppStore();
  const linkedTasks = cards.filter(c => c.paraType === 'task' && c.projectId === project.id);
  const completedTasks = linkedTasks.filter(t => t.completed);
  const progress = linkedTasks.length > 0 ? Math.round((completedTasks.length / linkedTasks.length) * 100) : 0;

  return (
    <button
      onClick={onOpen}
      className="w-full text-left p-3 bg-white/60 border border-white/40 rounded-xl hover:bg-white/80 hover:border-indigo-200/50 transition-all"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Rocket className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span className="text-sm text-stone-700 flex-1 truncate">{project.title}</span>
        <ChevronRight className="w-3 h-3 text-stone-300 shrink-0" />
      </div>
      {linkedTasks.length > 0 && (
        <>
          <div className="flex items-center justify-between text-xs mb-1 ml-5">
            <span className="text-stone-400">{completedTasks.length}/{linkedTasks.length} 任务</span>
            <span className="text-indigo-500 font-medium">{progress}%</span>
          </div>
          <div className="h-1 bg-stone-100 rounded-full overflow-hidden ml-5">
            <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </>
      )}
    </button>
  );
}

export default function AreaDetail({ area, onClose }: AreaDetailProps) {
  const { cards, updateCard } = useAppStore();

  const relatedProjects = cards.filter(c => c.paraType === 'project' && c.areaId === area.id);
  const relatedNotes = cards.filter(c => c.paraType === 'note' && (c.areaId === area.id || c.content?.includes(`[[${area.title}]]`)));

  const isHabitEnabled = area.habitCheckin || false;

  return (
    <div className="space-y-6">
      {/* Close button */}
      <div className="flex justify-end">
        <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Header: area name + description */}
      <div>
        <h2 className="text-2xl font-bold text-stone-800">{area.title}</h2>
        {area.content && (
          <p className="text-stone-600 mt-2">{area.content}</p>
        )}
      </div>

      {/* Core insight */}
      {area.coreInsight && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs text-amber-600 font-medium mb-1">成功标准</p>
          <p className="text-stone-700">{area.coreInsight}</p>
        </div>
      )}

      {/* Habit checkin section */}
      {isHabitEnabled && (
        <div className="glass-soft rounded-2xl p-5">
          <h3 className="font-semibold text-stone-700 mb-3">习惯打卡</h3>
          <p className="text-sm text-stone-500 mb-3">
            频率：{area.habitFrequency === 'daily' ? '每日' : '每周'}
          </p>
          <button
            onClick={() => updateCard(area.id, { habitCompletedToday: !area.habitCompletedToday })}
            className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
              area.habitCompletedToday
                ? 'bg-green-500 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {area.habitCompletedToday ? '已打卡' : '今日打卡'}
          </button>
        </div>
      )}

      {/* Related projects */}
      {relatedProjects.length > 0 && (
        <div>
          <h3 className="font-semibold text-stone-700 mb-3 flex items-center gap-2">
            <Rocket className="w-4 h-4 text-indigo-500" />
            关联项目 ({relatedProjects.length})
          </h3>
          <div className="space-y-2">
            {relatedProjects.map(p => (
              <ProjectMiniCard
                key={p.id}
                project={p}
                onOpen={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Related notes */}
      {relatedNotes.length > 0 && (
        <div>
          <h3 className="font-semibold text-stone-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-stone-400" />
            相关笔记 ({relatedNotes.length})
          </h3>
          <div className="space-y-2">
            {relatedNotes.map(n => (
              <NoteMiniCard
                key={n.id}
                note={n}
                onOpen={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {relatedProjects.length === 0 && relatedNotes.length === 0 && !isHabitEnabled && (
        <div className="text-center py-8">
          <Target className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="text-sm text-stone-400">暂无关联内容</p>
        </div>
      )}
    </div>
  );
}
