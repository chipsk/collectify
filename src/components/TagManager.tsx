'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { PARAType } from '@/lib/types';
import { Tag, Trash2, Edit2, Plus, Search, ChevronRight, Merge, X } from 'lucide-react';

const PARA_LABELS: Record<string, string> = {
  note: '笔记',
  task: '任务',
  project: '项目',
  area: '领域',
  resource: '资源',
};

interface TagInfo {
  tag: string;
  total: number;
  modules: Record<string, number>;
}

export default function TagManager() {
  const { cards, updateCard } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState<PARAType | 'all'>('all');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [mergeTag, setMergeTag] = useState<{ from: string; to: string } | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [previewTag, setPreviewTag] = useState<string | null>(null);

  // 统计所有标签
  const allTags = useMemo(() => {
    const counts: Record<string, TagInfo> = {};
    cards.filter(c => !c.archived).forEach(card => {
      card.tags.forEach(tag => {
        if (!counts[tag]) counts[tag] = { tag, total: 0, modules: {} };
        counts[tag].total++;
        counts[tag].modules[card.paraType] = (counts[tag].modules[card.paraType] || 0) + 1;
      });
    });
    return Object.values(counts).sort((a, b) => b.total - a.total);
  }, [cards]);

  // 过滤
  const filteredTags = allTags.filter(t => {
    if (search && !t.tag.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterModule !== 'all' && !t.modules[filterModule]) return false;
    return true;
  });

  // 获取标签关联的卡片
  const getCardsWithTag = (tag: string) => {
    return cards.filter(c => !c.archived && c.tags.includes(tag));
  };

  // 重命名标签
  const renameTag = (oldTag: string, newTag: string) => {
    if (!newTag.trim() || oldTag === newTag) {
      setEditingTag(null);
      return;
    }
    cards.forEach(card => {
      if (card.tags.includes(oldTag)) {
        updateCard(card.id, {
          tags: card.tags.map(t => t === oldTag ? newTag.trim() : t)
        });
      }
    });
    setEditingTag(null);
  };

  // 删除标签
  const deleteTag = (tag: string) => {
    if (!confirm(`确定删除标签「${tag}」吗？将从所有卡片移除。`)) return;
    cards.forEach(card => {
      if (card.tags.includes(tag)) {
        updateCard(card.id, { tags: card.tags.filter(t => t !== tag) });
      }
    });
  };

  // 合并标签
  const confirmMerge = () => {
    if (!mergeTag) return;
    const { from, to } = mergeTag;
    cards.forEach(card => {
      if (card.tags.includes(from)) {
        const newTags = card.tags.filter(t => t !== from);
        if (!newTags.includes(to)) newTags.push(to);
        updateCard(card.id, { tags: newTags });
      }
    });
    setMergeTag(null);
  };

  // 新建标签
  const createTag = () => {
    if (!newTagName.trim()) return;
    alert(`标签「${newTagName}」会在编辑卡片时自动创建`);
    setNewTagName('');
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-stone-800 mb-6">🏷️ 标签管理</h2>

      {/* 搜索和筛选 */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索标签..."
            className="w-full pl-10 pr-4 py-2.5 glass-soft rounded-xl border-0 focus:ring-2 focus:ring-amber-300"
          />
        </div>
        <select
          value={filterModule}
          onChange={e => setFilterModule(e.target.value as PARAType | 'all')}
          className="px-4 py-2.5 glass-soft rounded-xl border-0 text-sm text-stone-600 focus:ring-2 focus:ring-amber-300"
        >
          <option value="all">全部模块</option>
          <option value="note">📝 笔记</option>
          <option value="task">📋 任务</option>
          <option value="project">🚀 项目</option>
          <option value="area">🎯 领域</option>
          <option value="resource">📚 资源</option>
        </select>
      </div>

      {/* 新建标签 */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTagName}
          onChange={e => setNewTagName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createTag()}
          placeholder="输入标签名后按回车新建..."
          className="flex-1 px-4 py-2.5 glass-soft rounded-xl border-0 text-sm focus:ring-2 focus:ring-amber-300"
        />
        <button
          onClick={createTag}
          className="px-4 py-2.5 btn-gradient text-white rounded-xl text-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          新建
        </button>
      </div>

      {/* 标签列表 */}
      <div className="space-y-2">
        {filteredTags.map(({ tag, total, modules }) => (
          <div key={tag} className="glass-soft rounded-xl overflow-hidden">
            <div className="p-4 flex items-center gap-3">
              <Tag className="w-4 h-4 text-amber-500 shrink-0" />

              {editingTag === tag ? (
                <input
                  type="text"
                  defaultValue={tag}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') renameTag(tag, (e.target as HTMLInputElement).value);
                    if (e.key === 'Escape') setEditingTag(null);
                  }}
                  onBlur={e => renameTag(tag, e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              ) : (
                <button
                  onClick={() => setPreviewTag(previewTag === tag ? null : tag)}
                  className="flex-1 font-medium text-stone-700 text-left hover:text-amber-600 transition-colors"
                >
                  {tag}
                </button>
              )}

              <span className="text-sm text-stone-400 shrink-0">{total}次</span>

              {/* 模块分布 */}
              <div className="flex gap-1 shrink-0">
                {Object.entries(modules).map(([mod, count]) => (
                  <span
                    key={mod}
                    className="text-xs px-2 py-0.5 bg-stone-100 rounded-full text-stone-500"
                    title={`${PARA_LABELS[mod] || mod}: ${count}次`}
                  >
                    {PARA_LABELS[mod] || mod}:{count}
                  </span>
                ))}
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setEditingTag(tag)}
                  className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
                  title="重命名"
                >
                  <Edit2 className="w-4 h-4 text-stone-400" />
                </button>
                <button
                  onClick={() => setMergeTag({ from: tag, to: '' })}
                  className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
                  title="合并到其他标签"
                >
                  <Merge className="w-4 h-4 text-stone-400" />
                </button>
                <button
                  onClick={() => deleteTag(tag)}
                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                  title="删除标签"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>

            {/* 卡片预览（可折叠） */}
            {previewTag === tag && (
              <div className="border-t border-stone-200/50 px-4 py-3 bg-stone-50/50">
                <p className="text-xs text-stone-400 mb-2">
                  使用此标签的卡片（共 {getCardsWithTag(tag).length} 张）：
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {getCardsWithTag(tag).slice(0, 10).map(card => (
                    <button
                      key={card.id}
                      onClick={() => {
                        const { openEditor } = useAppStore.getState();
                        openEditor(card);
                        setPreviewTag(null);
                      }}
                      className="text-xs px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-stone-600 hover:border-amber-300 hover:text-amber-600 transition-colors truncate max-w-[160px]"
                    >
                      {card.title}
                    </button>
                  ))}
                  {getCardsWithTag(tag).length > 10 && (
                    <span className="text-xs text-stone-400 self-center">
                      +{getCardsWithTag(tag).length - 10} 更多
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredTags.length === 0 && (
          <div className="text-center py-16 text-stone-400">
            {search ? '没有找到匹配的标签' : '还没有标签'}
          </div>
        )}
      </div>

      {/* 合并标签弹窗 */}
      {mergeTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="glass-strong rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-stone-800">合并标签</h3>
              <button onClick={() => setMergeTag(null)} className="p-1 hover:bg-stone-100 rounded-lg">
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>
            <p className="text-sm text-stone-500 mb-4">
              将「<span className="font-medium text-amber-600">{mergeTag.from}</span>」合并到：
            </p>
            <select
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-700 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-amber-300"
              value={mergeTag.to}
              onChange={e => setMergeTag({ ...mergeTag, to: e.target.value })}
            >
              <option value="">选择目标标签...</option>
              {allTags.filter(t => t.tag !== mergeTag.from).map(t => (
                <option key={t.tag} value={t.tag}>{t.tag}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setMergeTag(null)}
                className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmMerge}
                disabled={!mergeTag.to}
                className="px-4 py-2 text-sm bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-40"
              >
                确认合并
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
