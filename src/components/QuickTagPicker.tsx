'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Plus, Tag } from 'lucide-react';
import { parseCompoundTag } from './TagInput';

interface QuickTagPickerProps {
  selectedTags: string[];
  onToggle: (tag: string) => void;
  onCreateTag?: (tag: string) => void;
}

export default function QuickTagPicker({ selectedTags, onToggle, onCreateTag }: QuickTagPickerProps) {
  const { cards } = useAppStore();

  // 统计标签使用频率
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    cards.filter(c => !c.archived).forEach(card => {
      card.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [cards]);

  // 按频率排序的标签
  const sortedTags = useMemo(() => {
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([tag]) => tag);
  }, [tagCounts]);

  // 前10个常用标签
  const topTags = sortedTags.slice(0, 10);

  return (
    <div className="mt-2">
      {/* 常用标签 */}
      {topTags.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-stone-400 mb-2">常用标签</p>
          <div className="flex flex-wrap gap-1.5">
            {topTags.map(tag => {
              const parts = parseCompoundTag(tag);
              const displayName = parts.length > 1 ? parts[parts.length - 1] : tag;
              return (
                <button
                  key={tag}
                  onClick={() => onToggle(tag)}
                  className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-amber-100 text-amber-700 font-medium border border-amber-200'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200 border border-transparent'
                  }`}
                >
                  {displayName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 所有标签（可滚动） */}
      {sortedTags.length > 10 && (
        <div>
          <p className="text-xs text-stone-400 mb-2">所有标签</p>
          <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
            {sortedTags.map(tag => {
              const parts = parseCompoundTag(tag);
              const displayName = parts.length > 1 ? parts[parts.length - 1] : tag;
              return (
                <button
                  key={tag}
                  onClick={() => onToggle(tag)}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
                    selectedTags.includes(tag)
                      ? 'bg-amber-50 text-amber-700 font-medium'
                      : 'text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  <Tag className="w-3 h-3 shrink-0 text-stone-400" />
                  <span className="flex-1 truncate">{tag}</span>
                  <span className="text-stone-400 shrink-0">{tagCounts[tag]}</span>
                  {selectedTags.includes(tag) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 新建标签 */}
      {onCreateTag && (
        <button
          onClick={() => {
            const name = prompt('输入新标签名：');
            if (name?.trim()) onCreateTag(name.trim());
          }}
          className="mt-2 w-full text-xs text-stone-400 hover:text-amber-500 py-1 flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" />
          新建标签
        </button>
      )}
    </div>
  );
}
