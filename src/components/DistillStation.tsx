'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/lib/types';
import { Sparkles, Link2, ChevronDown, ChevronUp, CheckCircle, X, ArrowRight, Lightbulb } from 'lucide-react';

function parseContentWithLinksLocal(content: string, cards: Card[]): { type: 'text' | 'link'; text: string; cardId?: string }[] {
  const segments: { type: 'text' | 'link'; text: string; cardId?: string }[] = [];
  const regex = /\[\[([^\]]+)\]\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', text: content.slice(lastIndex, match.index) });
    }
    const linkText = match[1].trim();
    const linkedCard = cards.find(c => c.id === linkText || c.title === linkText);
    segments.push({ type: 'link', text: linkText, cardId: linkedCard?.id });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'text', text: content.slice(lastIndex) });
  }

  return segments;
}

interface NoteEditorProps {
  note: Card;
  onClose: () => void;
}

function NoteEditor({ note, onClose }: NoteEditorProps) {
  const { cards, updateCard, openEditor } = useAppStore();
  const [coreInsight, setCoreInsight] = useState(note.coreInsight || '');
  const [relatedNotes, setRelatedNotes] = useState<string[]>(note.relatedNotes || []);
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get notes that this note references
  const referencedLinks = cards.filter(c => note.links?.includes(c.id));
  // Get notes that reference this note
  const referencedBy = cards.filter(c => c.links?.includes(note.id));

  const searchResults = cards.filter(c => 
    c.id !== note.id &&
    !relatedNotes.includes(c.id) &&
    (c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     c.content.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 5);

  const handleSaveInsight = () => {
    updateCard(note.id, {
      coreInsight,
      isAtomic: true,
    });
  };

  const handleAddRelation = (id: string) => {
    const newRelated = [...relatedNotes, id];
    setRelatedNotes(newRelated);
    updateCard(note.id, { relatedNotes: newRelated });
    setSearchQuery('');
  };

  const handleRemoveRelation = (id: string) => {
    const newRelated = relatedNotes.filter(r => r !== id);
    setRelatedNotes(newRelated);
    updateCard(note.id, { relatedNotes: newRelated });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-stone-800">原子笔记编辑器</h3>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Note Title & Content */}
          <div className="p-4 bg-stone-50 rounded-xl">
            <h4 className="font-semibold text-stone-800 mb-2">{note.title}</h4>
            <p className="text-sm text-stone-600 leading-relaxed">
              {parseContentWithLinksLocal(note.content, cards).map((seg, i) => 
                seg.type === 'link' ? (
                  <span key={i} className="text-purple-600 font-medium bg-purple-50 px-1 rounded">
                    [[{seg.text}]]
                  </span>
                ) : (
                  <span key={i}>{seg.text}</span>
                )
              )}
            </p>
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {note.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Core Insight Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-purple-500" />
              <h5 className="text-sm font-semibold text-stone-700">核心洞见</h5>
            </div>
            <p className="text-xs text-stone-500">
              这条笔记的核心思想是什么？尝试用一句话总结...
            </p>
            <textarea
              value={coreInsight}
              onChange={e => setCoreInsight(e.target.value)}
              placeholder="例如：知识需要主动构建，而非被动接收"
              className="w-full px-4 py-3 border border-purple-200 rounded-xl text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-purple-50/30 resize-none"
              rows={2}
            />
            <button
              onClick={handleSaveInsight}
              disabled={!coreInsight.trim()}
              className="flex items-center gap-1 px-4 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              保存洞见（标记为已原子化）
            </button>
          </div>

          {/* Relations Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-purple-500" />
              <h5 className="text-sm font-semibold text-stone-700">关联笔记</h5>
            </div>

            {/* Current relations */}
            {relatedNotes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {relatedNotes.map(rid => {
                  const relatedCard = cards.find(c => c.id === rid);
                  if (!relatedCard) return null;
                  return (
                    <div key={rid} className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-lg group">
                      <span className="max-w-[120px] truncate">{relatedCard.title}</span>
                      <button
                        onClick={() => handleRemoveRelation(rid)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add relation */}
            <button
              onClick={() => setShowRelationModal(!showRelationModal)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-dashed border-purple-300 text-purple-500 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <Link2 className="w-3 h-3" />
              添加关联笔记
            </button>

            {showRelationModal && (
              <div className="p-3 bg-stone-50 rounded-xl space-y-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="搜索笔记标题或内容..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                {searchResults.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleAddRelation(c.id)}
                    className="w-full text-left p-2 rounded-lg hover:bg-white transition-colors"
                  >
                    <p className="text-sm font-medium text-stone-700 truncate">{c.title}</p>
                    <p className="text-xs text-stone-400 truncate">{c.content?.slice(0, 50)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Link Graph */}
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-stone-700">引用关系</h5>
            <div className="flex gap-6">
              {/* This note references */}
              <div className="flex-1">
                <p className="text-xs text-stone-500 mb-2">
                  引用了 {referencedLinks.length} 张卡片
                </p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {referencedLinks.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { onClose(); openEditor(c as Parameters<typeof openEditor>[0]); }}
                      className="w-full flex items-center gap-2 p-2 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
                    >
                      <ArrowRight className="w-3 h-3 text-purple-400 shrink-0" />
                      <span className="text-xs text-purple-700 truncate flex-1">{c.title}</span>
                    </button>
                  ))}
                  {referencedLinks.length === 0 && (
                    <p className="text-xs text-stone-400 italic">暂无引用</p>
                  )}
                </div>
              </div>

              {/* Referenced by */}
              <div className="flex-1">
                <p className="text-xs text-stone-500 mb-2">
                  被 {referencedBy.length} 张卡片引用
                </p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {referencedBy.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { onClose(); openEditor(c as Parameters<typeof openEditor>[0]); }}
                      className="w-full flex items-center gap-2 p-2 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors text-left"
                    >
                      <ArrowRight className="w-3 h-3 text-indigo-400 shrink-0 rotate-180" />
                      <span className="text-xs text-indigo-700 truncate flex-1">{c.title}</span>
                    </button>
                  ))}
                  {referencedBy.length === 0 && (
                    <p className="text-xs text-stone-400 italic">暂无引用</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Distill Tips */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
            <h5 className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              Zettelkasten 提炼提示
            </h5>
            <ul className="text-xs text-purple-600 space-y-1">
              <li>• 这条笔记的<strong>核心思想</strong>是什么？</li>
              <li>• 它与我的<strong>现有知识网络</strong>如何连接？</li>
              <li>• 如何用<strong>一句话</strong>向他人解释这个概念？</li>
              <li>• 定期重读，更新链接，保持知识鲜活</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DistillStation() {
  const { getDistillQueue, cards } = useAppStore();
  const [editingNote, setEditingNote] = useState<Card | null>(null);

  const distillQueue = getDistillQueue();
  const shortNotes = distillQueue.filter(n => (n.content?.length || 0) < 50);
  const allNotes = distillQueue;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 glass-soft rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h2 className="font-semibold text-stone-800">提炼台</h2>
        </div>
        <p className="text-sm text-stone-500">
          深度加工卡片笔记，提取核心洞见，建立知识网络
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
          <p className="text-2xl font-bold text-purple-600">{distillQueue.length}</p>
          <p className="text-xs text-purple-500">待提炼笔记</p>
        </div>
        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <p className="text-2xl font-bold text-indigo-600">{shortNotes.length}</p>
          <p className="text-xs text-indigo-500">内容较短的笔记</p>
        </div>
      </div>

      {/* Note List */}
      {allNotes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold text-stone-700 mb-2">太棒了！</h3>
          <p className="text-sm text-stone-400">所有笔记都已完成原子化 ✨</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
            待提炼笔记 ({allNotes.length})
          </h3>
          {allNotes.map(note => {
            const isShort = (note.content?.length || 0) < 50;
            const referencedBy = cards.filter(c => c.links?.includes(note.id)).length;
            const references = cards.filter(c => note.links?.includes(c.id)).length;

            return (
              <div
                key={note.id}
                className={`p-4 rounded-xl border transition-all hover:-translate-y-0.5 cursor-pointer ${
                  isShort
                    ? 'bg-amber-50/40 border-amber-200/40 hover:border-amber-300 hover:bg-amber-50/60'
                    : 'bg-white/60 border-white/40 hover:border-purple-200/60 hover:bg-white/80'
                }`}
                onClick={() => setEditingNote(note)}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-stone-800 line-clamp-1">{note.title}</h4>
                      {note.isAtomic && (
                        <span className="shrink-0 px-1.5 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" />
                          原子化
                        </span>
                      )}
                      {isShort && !note.isAtomic && (
                        <span className="shrink-0 px-1.5 py-0.5 bg-amber-100 text-amber-600 text-xs rounded-full">
                          待丰富
                        </span>
                      )}
                    </div>
                    {note.coreInsight && (
                      <p className="text-sm text-purple-600 italic line-clamp-1">
                        "{note.coreInsight}"
                      </p>
                    )}
                  </div>
                </div>

                {note.content && (
                  <p className="text-sm text-stone-500 line-clamp-2 mb-3">
                    {note.content?.slice(0, 100)}
                  </p>
                )}

                {/* Tags */}
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {note.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-stone-100 text-stone-500 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Meta row */}
                <div className="flex items-center gap-4 text-xs text-stone-400">
                  {references > 0 && (
                    <span className="flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      引用了 {references}
                    </span>
                  )}
                  {referencedBy > 0 && (
                    <span className="flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 rotate-180" />
                      被 {referencedBy} 引用
                    </span>
                  )}
                  {note.relatedNotes && note.relatedNotes.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Link2 className="w-3 h-3" />
                      {note.relatedNotes.length} 关联
                    </span>
                  )}
                  <span className="ml-auto text-stone-400">
                    {new Date(note.updatedAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Note Editor Modal */}
      {editingNote && (
        <NoteEditor note={editingNote} onClose={() => setEditingNote(null)} />
      )}
    </div>
  );
}
