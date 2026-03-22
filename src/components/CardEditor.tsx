'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trash2, Link2, X, Archive, RotateCcw, CheckSquare, FileText, BookOpen, Plus } from 'lucide-react';
import TagInput from './TagInput';
import QuickTagPicker from './QuickTagPicker';
import { Card } from '@/lib/types';
import { useAppStore, parseContentWithLinks } from '@/lib/store';
import RelationPicker from './RelationPicker';
import FlashForm from './forms/FlashForm';
import TaskForm from './forms/TaskForm';
import NoteForm from './forms/NoteForm';
import ProjectForm from './forms/ProjectForm';
import AreaForm from './forms/AreaForm';
import ResourceForm from './forms/ResourceForm';

export default function CardEditor() {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLinkHint, setShowLinkHint] = useState(false);
  const [relationPicker, setRelationPicker] = useState<{ type: 'task' | 'note' | 'resource' } | null>(null);

  const contentRef = useRef<HTMLTextAreaElement>(null);

  const {
    isEditorOpen, editingCard, closeEditor, updateCard, deleteCard, allTags, cards, openEditor,
    archiveCard, restoreCard,
  } = useAppStore();

  // Derived linked items
  const projectLinkedTasks = editingCard ? cards.filter(c => c.paraType === 'task' && c.projectId === editingCard.id) : [];
  const projectLinkedTaskIds = projectLinkedTasks.map(c => c.id);
  const projectLinkedNotes = editingCard ? cards.filter(c => c.paraType === 'note' && c.projectId === editingCard.id) : [];
  const projectLinkedNoteIds = projectLinkedNotes.map(c => c.id);
  const projectLinkedResources = editingCard ? cards.filter(c => c.paraType === 'resource' && c.projectId === editingCard.id) : [];
  const projectLinkedResourceIds = projectLinkedResources.map(c => c.id);

  // Helper: date string to timestamp
  const dateToTs = (dateStr: string) => {
    if (!dateStr) return undefined;
    return new Date(dateStr + 'T00:00:00').getTime();
  };

  // Initialize formData from editingCard
  useEffect(() => {
    if (editingCard && isEditorOpen) {
      const card = editingCard;
      // Build formData based on paraType, mapping card fields to form field names
      const fd: Record<string, any> = {
        title: card.title,
        content: card.content,
        tags: card.tags || [],
      };

      if (card.paraType === 'task') {
        fd.priority = card.priority || 'medium';
        fd.dueDate = card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '';
        fd.dueDateTs = card.dueDate;
        fd.startDate = card.startDate ? new Date(card.startDate).toISOString().split('T')[0] : '';
        fd.startDateTs = card.startDate;
        fd.projectId = card.projectId || '';
        fd.areaId = card.areaId || '';
        fd.habitCheckin = card.habitCheckin || false;
        fd.habitFrequency = card.habitFrequency || 'daily';
        fd.participants = card.participants || '';
        fd.location = card.location || '';
      } else if (card.paraType === 'note') {
        fd.coreInsight = card.coreInsight || '';
        fd.isAtomic = card.isAtomic || false;
      } else if (card.paraType === 'project') {
        fd.projectStatus = card.projectStatus || 'idea';
        fd.projectDeadline = card.projectDeadline ? new Date(card.projectDeadline).toISOString().split('T')[0] : '';
        fd.projectDeadlineTs = card.projectDeadline;
        fd.areaId = card.areaId || '';
        fd.resourceIds = card.resourceIds || [];
      } else if (card.paraType === 'area') {
        fd.habitCheckin = card.habitCheckin || false;
        fd.habitFrequency = card.habitFrequency || 'daily';
        fd.reviewEnabled = card.reviewEnabled || false;
        fd.reviewDate = card.reviewDate || '';
      } else if (card.paraType === 'resource') {
        fd.resourceType = card.resourceType || 'article';
        fd.url = card.url || '';
        fd.source = card.source || '';
      }

      setFormData(fd);
      setTags(card.tags || []);
      setShowDeleteConfirm(false);
      setShowLinkHint(false);
      setTimeout(() => contentRef.current?.focus(), 100);
    }
  }, [editingCard, isEditorOpen]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape' && isEditorOpen) handleSave();
    }
    if (isEditorOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isEditorOpen, formData, tags]);

  const handleSave = () => {
    if (!editingCard || !formData.title?.trim()) return;

    const title = formData.title.trim();
    const content = formData.content || '';
    const updateFields: Partial<Card> = { title, content, tags, updatedAt: Date.now() };

    if (editingCard.paraType === 'task') {
      Object.assign(updateFields, {
        priority: formData.priority,
        dueDate: formData.dueDateTs,
        startDate: formData.startDateTs,
        projectId: formData.projectId || undefined,
        areaId: formData.areaId || undefined,
        habitCheckin: formData.habitCheckin,
        habitFrequency: formData.habitCheckin ? formData.habitFrequency : undefined,
        participants: formData.participants,
        location: formData.location,
        completed: editingCard.completed,
      });
    } else if (editingCard.paraType === 'note') {
      Object.assign(updateFields, {
        coreInsight: formData.coreInsight || '',
        isAtomic: formData.isAtomic || false,
        projectId: editingCard.projectId,
        relatedNotes: editingCard.relatedNotes,
      });
    } else if (editingCard.paraType === 'project') {
      Object.assign(updateFields, {
        projectStatus: formData.projectStatus,
        projectDeadline: formData.projectDeadlineTs,
        areaId: formData.areaId || undefined,
        resourceIds: formData.resourceIds || [],
      });
    } else if (editingCard.paraType === 'area') {
      Object.assign(updateFields, {
        habitCheckin: formData.habitCheckin,
        habitFrequency: formData.habitCheckin ? formData.habitFrequency : undefined,
        reviewEnabled: formData.reviewEnabled,
        reviewDate: formData.reviewDate,
      });
    } else if (editingCard.paraType === 'resource') {
      Object.assign(updateFields, {
        resourceType: formData.resourceType,
        url: formData.url || '',
        source: formData.source || '',
      });
    }

    updateCard(editingCard.id, updateFields);
    closeEditor();
  };

  const handleDelete = () => {
    if (!editingCard) return;
    deleteCard(editingCard.id);
    closeEditor();
  };

  const handleArchive = () => {
    if (!editingCard) return;
    archiveCard(editingCard.id);
    closeEditor();
  };

  const handleRestore = () => {
    if (!editingCard) return;
    restoreCard(editingCard.id);
    closeEditor();
  };

  const segments = parseContentWithLinks(formData.content || '', cards);
  const linkedCards = segments
    .filter(s => s.type === 'link' && s.cardId)
    .map(s => cards.find(c => c.id === s.cardId))
    .filter(Boolean) as Card[];

  const getCurrentLinkedIds = (): string[] => {
    if (!relationPicker || !editingCard) return [];
    if (relationPicker.type === 'task') {
      return cards.filter(c => c.paraType === 'task' && c.projectId === editingCard.id).map(c => c.id);
    }
    if (relationPicker.type === 'note') return editingCard.relatedNotes || [];
    return cards.filter(c => c.paraType === 'resource' && c.projectId === editingCard.id).map(c => c.id);
  };

  // Form rendering helpers
  const projects = cards.filter(c => c.paraType === 'project').map(c => ({ id: c.id, title: c.title }));
  const areas = cards.filter(c => c.paraType === 'area').map(c => ({ id: c.id, title: c.title }));
  const resources = cards.filter(c => c.paraType === 'resource').map(c => ({ id: c.id, title: c.title }));
  const allTagLabels = allTags.map(t => t.tag);

  const renderForm = () => {
    const commonProps = { data: formData, onChange: setFormData };
    switch (editingCard?.paraType) {
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
        return (
          <div className="space-y-4">
            <textarea
              ref={contentRef}
              value={formData.content || ''}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              placeholder="内容..."
              className="w-full text-stone-600 leading-relaxed border-0 focus:ring-0 resize-none p-0 bg-transparent min-h-[200px] placeholder:text-stone-300"
            />
          </div>
        );
    }
  };

  if (!isEditorOpen || !editingCard) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-50">
      <div className="h-full flex flex-col max-w-3xl mx-auto">
        <div className="flex items-center justify-between px-6 py-4 glass-soft backdrop-blur-xl border-b border-white/20">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 text-stone-600 hover:text-amber-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">保存返回</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLinkHint(!showLinkHint)}
              className={`p-2 rounded-xl transition-colors ${showLinkHint ? 'bg-purple-100 text-purple-600' : 'text-stone-400 hover:text-purple-500 hover:bg-purple-50'}`}
              title="插入链接"
            >
              <Link2 className="w-5 h-5" />
            </button>
            {editingCard.archived ? (
              <button
                onClick={handleRestore}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-50 rounded-xl transition-colors font-medium"
                title="恢复"
              >
                <RotateCcw className="w-4 h-4" />
                恢复
              </button>
            ) : (
              <button
                onClick={handleArchive}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100 rounded-xl transition-colors"
                title="归档"
              >
                <Archive className="w-4 h-4" />
                归档
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 btn-gradient text-white text-sm font-medium rounded-xl"
            >
              保存
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="mb-8">
            <input
              type="text"
              value={formData.title || ''}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="标题"
              className="w-full text-2xl font-bold text-stone-800 border-0 focus:ring-0 p-0 bg-transparent placeholder:text-stone-300"
            />
          </div>

          {/* Dynamic Form (replaces static textarea) */}
          <div className="mb-8">
            {renderForm()}
          </div>

          {/* Link hint */}
          {showLinkHint && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-100 rounded-xl">
              <p className="text-xs text-purple-600 font-medium mb-2">插入双向链接</p>
              <p className="text-xs text-stone-500 mb-2">在内容中输入 <code className="px-1.5 py-0.5 bg-purple-100 rounded text-purple-700">[[卡片标题]]</code> 即可引用其他卡片</p>
              <div className="flex flex-wrap gap-1.5">
                {cards.filter(c => c.id !== editingCard.id).slice(0, 5).map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, content: (prev.content || '') + `[[${c.title}]]` }));
                      setShowLinkHint(false);
                    }}
                    className="px-2 py-1 bg-white border border-purple-200 text-purple-700 text-xs rounded-lg hover:bg-purple-100 transition-colors truncate max-w-[150px]"
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bidirectional links display */}
          {linkedCards.length > 0 && (
            <div className="mb-8 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-widest mb-3">
                引用了 {linkedCards.length} 张卡片
              </p>
              <div className="space-y-2">
                {linkedCards.map(card => (
                  <button
                    key={card.id}
                    onClick={() => { closeEditor(); setTimeout(() => openEditor(card), 100); }}
                    className="w-full text-left p-3 bg-white/70 hover:bg-white rounded-xl transition-all group"
                  >
                    <p className="font-medium text-stone-800 group-hover:text-purple-700 text-sm transition-colors">
                      {card.title}
                    </p>
                    {card.content && (
                      <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">
                        {card.content.slice(0, 60)}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ===== Relation Management for project cards ===== */}
          {editingCard.paraType === 'project' && (
            <div className="mb-8 p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-4">
              <h4 className="font-semibold text-stone-700 text-sm">关联内容</h4>

              {/* Linked tasks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-stone-500">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>关联任务 ({projectLinkedTaskIds.length})</span>
                  </div>
                  <button
                    onClick={() => setRelationPicker({ type: 'task' })}
                    className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> 添加
                  </button>
                </div>
                <div className="space-y-1">
                  {projectLinkedTaskIds.length === 0 && (
                    <p className="text-xs text-stone-400 italic">暂无关联任务</p>
                  )}
                  {projectLinkedTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200">
                      <CheckSquare className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="text-sm text-stone-700 flex-1 truncate">{task.title}</span>
                      <button
                        onClick={() => updateCard(task.id, { projectId: undefined })}
                        className="text-xs text-stone-400 hover:text-red-500 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Linked notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-stone-500">
                    <FileText className="w-3.5 h-3.5" />
                    <span>关联笔记 ({projectLinkedNoteIds.length})</span>
                  </div>
                  <button
                    onClick={() => setRelationPicker({ type: 'note' })}
                    className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> 添加
                  </button>
                </div>
                <div className="space-y-1">
                  {projectLinkedNoteIds.length === 0 && (
                    <p className="text-xs text-stone-400 italic">暂无关联笔记</p>
                  )}
                  {projectLinkedNotes.map(note => (
                    <div key={note.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200">
                      <FileText className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="text-sm text-stone-700 flex-1 truncate">{note.title}</span>
                      <button
                        onClick={() => updateCard(note.id, { projectId: undefined })}
                        className="text-xs text-stone-400 hover:text-red-500 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Linked resources */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-stone-500">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>关联资源 ({projectLinkedResourceIds.length})</span>
                  </div>
                  <button
                    onClick={() => setRelationPicker({ type: 'resource' })}
                    className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> 添加
                  </button>
                </div>
                <div className="space-y-1">
                  {projectLinkedResourceIds.length === 0 && (
                    <p className="text-xs text-stone-400 italic">暂无关联资源</p>
                  )}
                  {projectLinkedResources.map(res => (
                    <div key={res.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200">
                      <BookOpen className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="text-sm text-stone-700 flex-1 truncate">{res.title}</span>
                      <button
                        onClick={() => updateCard(res.id, { projectId: undefined })}
                        className="text-xs text-stone-400 hover:text-red-500 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Task card: project selector */}
          {editingCard.paraType === 'task' && (
            <div className="mb-8 p-4 bg-stone-50 border border-stone-200 rounded-xl">
              <h4 className="font-semibold text-stone-700 text-sm mb-3">关联项目</h4>
              <select
                value={formData.projectId || ''}
                onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">无</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Note card: project selector + related notes */}
          {editingCard.paraType === 'note' && (
            <div className="mb-8 p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-4">
              <div>
                <h4 className="font-semibold text-stone-700 text-sm mb-2">所属项目</h4>
                <select
                  value={formData.projectId || ''}
                  onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="">无</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-stone-700 text-sm">关联笔记</h4>
                  <button
                    onClick={() => setRelationPicker({ type: 'note' })}
                    className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> 添加
                  </button>
                </div>
                <div className="space-y-1">
                  {(editingCard.relatedNotes || []).length === 0 && (
                    <p className="text-xs text-stone-400 italic">暂无关联笔记</p>
                  )}
                  {(editingCard.relatedNotes || []).map(noteId => {
                    const note = cards.find(c => c.id === noteId);
                    if (!note) return null;
                    return (
                      <div key={noteId} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200">
                        <FileText className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="text-sm text-stone-700 flex-1 truncate">{note.title}</span>
                        <button
                          onClick={() => {
                            const newIds = (editingCard.relatedNotes || []).filter(id => id !== noteId);
                            updateCard(editingCard.id, { relatedNotes: newIds });
                          }}
                          className="text-xs text-stone-400 hover:text-red-500 shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tags section */}
          <div className="pt-6 border-t border-stone-200">
            <TagInput
              tags={tags}
              onChange={setTags}
              allTags={allTagLabels.filter((t) => !tags.includes(t))}
            />
            <QuickTagPicker
              selectedTags={tags}
              onToggle={(tag) => {
                if (tags.includes(tag)) setTags(tags.filter(t => t !== tag));
                else setTags([...tags, tag]);
              }}
            />
          </div>

          <div className="mt-8 text-xs text-stone-400 flex items-center gap-2">
            <span>创建于 {new Date(editingCard.createdAt).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</span>
            {editingCard.links?.length > 0 && (
              <span className="text-purple-500">· 引用了 {editingCard.links.length} 张卡片</span>
            )}
          </div>
        </div>
      </div>

      {relationPicker && (
        <RelationPicker
          paraType={relationPicker.type}
          currentLinkedIds={getCurrentLinkedIds()}
          onConfirm={(selectedIds) => {
            if (relationPicker.type === 'task') {
              selectedIds.forEach(id => updateCard(id, { projectId: editingCard.id }));
            } else if (relationPicker.type === 'note') {
              if (editingCard.paraType === 'project') {
                selectedIds.forEach(id => updateCard(id, { projectId: editingCard.id }));
              } else {
                const merged = [...new Set([...(editingCard.relatedNotes || []), ...selectedIds])];
                updateCard(editingCard.id, { relatedNotes: merged });
              }
            } else {
              selectedIds.forEach(id => updateCard(id, { projectId: editingCard.id }));
            }
            setRelationPicker(null);
          }}
          onClose={() => setRelationPicker(null)}
        />
      )}

      {showDeleteConfirm && (
        <div className="absolute inset-0 z-60 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="glass-strong rounded-2xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-stone-800 mb-2">确认删除</h3>
            <p className="text-stone-500 text-sm mb-5">确定要删除这张卡片吗？</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
