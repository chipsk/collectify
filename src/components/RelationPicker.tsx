'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, PARAType } from '@/lib/types';
import { X, Search, CheckSquare, FileText, BookOpen, Target } from 'lucide-react';

interface RelationPickerProps {
  paraType: 'task' | 'note' | 'resource';
  currentLinkedIds: string[];
  onConfirm: (selectedIds: string[]) => void;
  onClose: () => void;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; empty: string }> = {
  task: { icon: <CheckSquare className="w-4 h-4" />, label: '任务', empty: '暂无任务可关联' },
  note: { icon: <FileText className="w-4 h-4" />, label: '笔记', empty: '暂无笔记可关联' },
  resource: { icon: <BookOpen className="w-4 h-4" />, label: '资源', empty: '暂无资源可关联' },
};

export default function RelationPicker({ paraType, currentLinkedIds, onConfirm, onClose }: RelationPickerProps) {
  const { cards } = useAppStore();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set(currentLinkedIds));

  // Get available cards (not archived, matching type, not already linked)
  const availableCards = useMemo(() => {
    return cards.filter(c =>
      !c.archived &&
      c.paraType === paraType &&
      !currentLinkedIds.includes(c.id)
    );
  }, [cards, paraType, currentLinkedIds]);

  // Filter by search
  const filteredCards = useMemo(() => {
    if (!search.trim()) return availableCards;
    const q = search.toLowerCase();
    return availableCards.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.content.toLowerCase().includes(q)
    );
  }, [availableCards, search]);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selected));
  };

  const cfg = TYPE_CONFIG[paraType];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[70vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="text-stone-500">{cfg.icon}</span>
            <h3 className="font-semibold text-stone-800">添加关联{cfg.label}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-stone-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`搜索${cfg.label}...`}
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filteredCards.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-stone-400">{cfg.empty}</p>
            </div>
          ) : (
            filteredCards.map(card => (
              <button
                key={card.id}
                onClick={() => toggleSelect(card.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                  selected.has(card.id)
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selected.has(card.id)
                    ? 'bg-indigo-500 border-indigo-500'
                    : 'border-stone-300'
                }`}>
                  {selected.has(card.id) && <CheckSquare className="w-3 h-3 text-white" />}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{card.title}</p>
                  {card.content && (
                    <p className="text-xs text-stone-400 truncate mt-0.5">{card.content.slice(0, 60)}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-stone-100 flex items-center gap-3">
          <span className="text-xs text-stone-400">
            已选 {selected.size - currentLinkedIds.length} 项（不含已关联）
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone-500 hover:bg-stone-100 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors font-medium"
            >
              确认添加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
