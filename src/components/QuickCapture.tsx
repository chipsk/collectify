'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { PARAType, Card } from '@/lib/types';
import FlashForm from './forms/FlashForm';
import TaskForm from './forms/TaskForm';
import NoteForm from './forms/NoteForm';
import ProjectForm from './forms/ProjectForm';
import AreaForm from './forms/AreaForm';
import ResourceForm from './forms/ResourceForm';

const PARA_OPTIONS: { type: PARAType; label: string; icon: string }[] = [
  { type: 'flash', label: '闪念笔记', icon: '⚡' },
  { type: 'task', label: '任务', icon: '📋' },
  { type: 'note', label: '卡片笔记', icon: '📝' },
  { type: 'project', label: '项目', icon: '🚀' },
  { type: 'area', label: '领域', icon: '🎯' },
  { type: 'resource', label: '资源库', icon: '📚' },
];

const MODULE_LABELS: Record<PARAType, string> = {
  flash: '闪念笔记',
  task: '任务',
  note: '卡片笔记',
  project: '项目',
  area: '领域',
  resource: '资源库',
};

export default function QuickCapture() {
  const [paraType, setParaType] = useState<PARAType>('flash');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const titleRef = useRef<HTMLInputElement>(null);

  const {
    isQuickCaptureOpen,
    closeQuickCapture,
    cards,
    allTags,
    openSimilarPanel,
    closeSimilarPanel,
    isSimilarPanelOpen,
    pendingParentId,
  } = useAppStore();

  // Get related options from store
  const projects = cards
    .filter(c => c.paraType === 'project')
    .map(c => ({ id: c.id, title: c.title }));
  const areas = cards
    .filter(c => c.paraType === 'area')
    .map(c => ({ id: c.id, title: c.title }));
  const resources = cards
    .filter(c => c.paraType === 'resource')
    .map(c => ({ id: c.id, title: c.title }));
  const allTagLabels = allTags.map(t => t.tag);

  useEffect(() => {
    if (isQuickCaptureOpen) {
      // If creating a child document, infer paraType from parent
      if (pendingParentId) {
        const parent = cards.find(c => c.id === pendingParentId);
        setParaType(parent?.paraType || 'note');
      } else {
        setParaType('flash');
      }
      setFormData({});
      closeSimilarPanel();
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [isQuickCaptureOpen, closeSimilarPanel, pendingParentId, cards]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') closeQuickCapture();
    }
    if (isQuickCaptureOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isQuickCaptureOpen, closeQuickCapture]);

  // 知识磁吸：只对 task/note/project/area/resource 触发
  const similarCards = (() => {
    if (paraType === 'flash') return [];
    if (!formData.title?.trim()) return [];

    const newCard = { title: formData.title, content: formData.content || '' };
    return cards
      .filter(c => c.paraType !== 'flash' && c.id !== formData._tempId)
      .map(card => {
        const tokenize = (text: string) =>
          text.toLowerCase()
            .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 1);

        const tokensA = new Set(tokenize(newCard.title + ' ' + newCard.content));
        const tokensB = new Set(tokenize(card.title + ' ' + card.content));

        if (tokensA.size === 0 || tokensB.size === 0) return { card, sim: 0 };

        let inter = 0;
        tokensA.forEach(t => { if (tokensB.has(t)) inter++; });
        const sim = inter / Math.max(tokensA.size, tokensB.size);
        return { card, sim };
      })
      .filter(x => x.sim >= 0.2)
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 3);
  })();

  const handleSave = () => {
    const title = formData.title?.trim();
    if (!title) return;

    if (similarCards.length > 0 && !isSimilarPanelOpen) {
      openSimilarPanel(similarCards.map(x => ({ card: x.card, similarity: x.sim })));
      return;
    }

    const now = Date.now();
    const cardPayload: Card = {
      id: crypto.randomUUID(),
      title,
      content: formData.content || '',
      tags: formData.tags || [],
      links: [],
      createdAt: now,
      updatedAt: now,
      archived: false,
      paraType,
      // 父子文档结构
      parentId: pendingParentId || undefined,
      depth: pendingParentId ? ((cards.find(c => c.id === pendingParentId)?.depth) ?? 0) + 1 : 0,
      // task-specific
      ...(paraType === 'task' ? {
        completed: false,
        priority: formData.priority || 'medium',
        dueDate: formData.dueDateTs,
        startDate: formData.startDateTs,
        projectId: formData.projectId || undefined,
        areaId: formData.areaId || undefined,
        habitCheckin: formData.habitCheckin || false,
        habitFrequency: formData.habitCheckin ? (formData.habitFrequency || 'daily') : undefined,
        // participants and location stored in content or as extra fields
        participants: formData.participants,
        location: formData.location,
      } : {}),
      // note-specific
      ...(paraType === 'note' ? {
        coreInsight: formData.coreInsight || '',
        isAtomic: formData.isAtomic || false,
        nextReviewAt: now + 24 * 60 * 60 * 1000,
      } : {}),
      // project-specific
      ...(paraType === 'project' ? {
        content: formData.content || '',
        projectStatus: formData.projectStatus || 'idea',
        projectDeadline: formData.projectDeadlineTs,
        areaId: formData.areaId || undefined,
        resourceIds: formData.resourceIds || [],
      } : {}),
      // area-specific
      ...(paraType === 'area' ? {
        content: formData.content || '',
        habitCheckin: formData.habitCheckin || false,
        habitFrequency: formData.habitCheckin ? (formData.habitFrequency || 'daily') : undefined,
      } : {}),
      // resource-specific
      ...(paraType === 'resource' ? {
        resourceType: formData.resourceType || 'article',
        url: formData.url || '',
        source: formData.source || '',
        // notes already in content
      } : {}),
      // flash-specific
      ...(paraType === 'flash' ? {
        flashExpiresAt: now + 24 * 60 * 60 * 1000,
        nextReviewAt: now + 24 * 60 * 60 * 1000,
      } : {}),
    };

    // Add to store directly
    let newCards = [cardPayload, ...useAppStore.getState().cards];
    // Update parent's childIds
    if (pendingParentId) {
      newCards = newCards.map(c =>
        c.id === pendingParentId
          ? { ...c, childIds: [...(c.childIds || []), cardPayload.id] }
          : c
      );
    }
    useAppStore.setState({ cards: newCards });
    if (typeof window !== 'undefined') {
      localStorage.setItem('collectify-v4', JSON.stringify(newCards));
    }

    closeQuickCapture();
    closeSimilarPanel();
  };

  const renderForm = () => {
    const commonProps = { data: formData, onChange: setFormData };
    switch (paraType) {
      case 'flash':
        return <FlashForm {...commonProps} />;
      case 'task':
        return <TaskForm {...commonProps} projects={projects} areas={areas} />;
      case 'note':
        return <NoteForm {...commonProps} allTags={allTagLabels} />;
      case 'project':
        return <ProjectForm {...commonProps} areas={areas} resources={resources} />;
      case 'area':
        return <AreaForm {...commonProps} />;
      case 'resource':
        return <ResourceForm {...commonProps} />;
      default:
        return null;
    }
  };

  if (!isQuickCaptureOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeQuickCapture} />
      <div className="relative glass-strong rounded-3xl w-full max-w-lg overflow-hidden animate-in-slide max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-200/50">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-800">新建{pendingParentId ? '子' : ''}{MODULE_LABELS[paraType]}</h2>
              {similarCards.length > 0 && !isSimilarPanelOpen && (
                <p className="text-xs text-purple-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  检测到 {similarCards.length} 条相似内容
                </p>
              )}
            </div>
          </div>
          <button onClick={closeQuickCapture} className="p-2 hover:bg-white/50 rounded-xl transition-colors">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Type Selector */}
        <div className="px-6 pt-4 pb-0 shrink-0">
          <div className="flex flex-wrap gap-2">
            {PARA_OPTIONS.map(opt => (
              <button
                key={opt.type}
                type="button"
                onClick={() => {
                  setParaType(opt.type);
                  setFormData({});
                }}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  paraType === opt.type
                    ? 'bg-stone-800 text-white shadow-md'
                    : 'glass-soft text-stone-600 hover:bg-white/50'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {renderForm()}

          {/* Flash note warning */}
          {paraType === 'flash' && (
            <p className="text-xs text-amber-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              闪念笔记将在 24 小时后自动过期，请及时处理
            </p>
          )}

          {/* Knowledge magnet preview */}
          {similarCards.length > 0 && !isSimilarPanelOpen && (
            <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl">
              <p className="text-xs text-purple-600 font-medium mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                知识磁吸 — 发现相似内容
              </p>
              <div className="space-y-1.5">
                {similarCards.map(({ card, sim }) => (
                  <div key={card.id} className="flex items-center justify-between text-xs">
                    <span className="text-stone-600 truncate flex-1">{card.title}</span>
                    <span className="text-purple-500 ml-2 shrink-0">{Math.round(sim * 100)}%相似</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-white/40 border-t border-white/30 shrink-0">
          <button
            onClick={closeQuickCapture}
            className="px-5 py-2.5 text-stone-600 hover:bg-white/50 rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.title?.trim()}
            className="px-5 py-2.5 btn-gradient text-white font-medium rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {similarCards.length > 0 && !isSimilarPanelOpen ? '查看相似' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
