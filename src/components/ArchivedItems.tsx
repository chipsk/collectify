'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, PARAType } from '@/lib/types';
import { Package, RotateCcw, Trash2, Search } from 'lucide-react';
import ContextMenu from './ContextMenu';

const PARA_ICONS: Record<PARAType, string> = {
  flash: '⚡',
  task: '📋',
  note: '📝',
  project: '🚀',
  area: '🎯',
  resource: '📚',
};

const PARA_LABELS: Record<PARAType, string> = {
  flash: '闪念笔记',
  task: '任务',
  note: '卡片笔记',
  project: '项目',
  area: '领域',
  resource: '资源库',
};

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
}

interface ArchivedCardItemProps {
  card: Card;
  onRestore: () => void;
  onDelete: () => void;
}

function ArchivedCardItem({ card, onRestore, onDelete }: ArchivedCardItemProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const archivedMenuItems = [
    {
      icon: <RotateCcw className="w-4 h-4" />,
      label: '恢复',
      onClick: onRestore,
    },
    {
      icon: <Trash2 className="w-4 h-4" />,
      label: '永久删除',
      danger: true,
      onClick: () => {
        if (confirm('确定永久删除吗？此操作不可恢复。')) {
          onDelete();
        }
      },
    },
  ];

  return (
    <div className="relative group/archived">
    <div className="flex items-start gap-3 p-4 bg-stone-50/50 border border-stone-200/40 rounded-xl hover:bg-stone-100/50 transition-colors">
      {/* Icon */}
      <div className="w-8 h-8 bg-stone-200 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-sm">{PARA_ICONS[card.paraType]}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-stone-400 bg-stone-200/60 px-1.5 py-0.5 rounded">
            {PARA_LABELS[card.paraType]}
          </span>
        </div>
        <h4 className="font-medium text-stone-700 text-sm line-clamp-1">{card.title}</h4>
        {card.content && (
          <p className="text-xs text-stone-400 mt-1 line-clamp-1">{card.content.slice(0, 80)}</p>
        )}
        {card.archivedAt && (
          <p className="text-xs text-stone-400 mt-1">
            归档于 {formatTimeAgo(card.archivedAt)}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onRestore}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors font-medium"
          title="恢复"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          恢复
        </button>
        {showConfirm ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-2 py-1.5 text-xs text-stone-500 hover:bg-stone-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={onDelete}
              className="px-2 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              确认删除
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="永久删除"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Context Menu */}
      <div className="absolute top-3 right-3 opacity-0 group-hover/archived:opacity-100 transition-opacity z-10">
        <ContextMenu items={archivedMenuItems} />
      </div>
    </div>
    </div>
  );
}

type FilterType = PARAType | 'all';

export default function ArchivedItems() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const { getArchivedCards, restoreCard, deleteCard } = useAppStore();

  const allArchived = getArchivedCards();

  // Filter by type and search
  const filtered = allArchived.filter(card => {
    const matchesType = filterType === 'all' || card.paraType === filterType;
    const matchesSearch = !search.trim() ||
      card.title.toLowerCase().includes(search.toLowerCase()) ||
      card.content.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Group by para type
  const grouped: Record<PARAType, Card[]> = {
    flash: [], task: [], note: [], project: [], area: [], resource: [],
  };
  filtered.forEach(card => {
    if (grouped[card.paraType]) {
      grouped[card.paraType].push(card);
    }
  });

  const handleRestore = (id: string) => {
    restoreCard(id);
  };

  const handleDelete = (id: string) => {
    deleteCard(id);
  };

  const paraTypes: PARAType[] = ['flash', 'task', 'note', 'project', 'area', 'resource'];

  if (allArchived.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-stone-800">已归档</h2>
            <p className="text-sm text-stone-500">所有归档内容都在这里</p>
          </div>
        </div>

        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-stone-100 to-stone-200 rounded-3xl flex items-center justify-center shadow-lg">
            <Package className="w-9 h-9 text-stone-400" />
          </div>
          <h3 className="text-lg font-semibold text-stone-700 mb-2">暂无归档内容</h3>
          <p className="text-sm text-stone-400">
            在卡片编辑器中点击「归档」按钮，可以将内容移至归档
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-stone-800">已归档</h2>
          <p className="text-sm text-stone-500">
            {allArchived.length} 条归档内容 · 可恢复或永久删除
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索归档内容..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/60 border border-stone-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filterType === 'all'
                ? 'bg-stone-800 text-white'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            全部 ({allArchived.length})
          </button>
          {paraTypes.map(type => {
            const count = allArchived.filter(c => c.paraType === type).length;
            if (count === 0) return null;
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
                  filterType === type
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {PARA_ICONS[type]} {count}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grouped List */}
      {filterType === 'all' ? (
        <div className="space-y-6">
          {paraTypes.map(type => {
            const cards = grouped[type];
            if (cards.length === 0) return null;
            return (
              <div key={type}>
                <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span>{PARA_ICONS[type]}</span>
                  <span>{PARA_LABELS[type]}</span>
                  <span className="text-stone-400 font-normal">({cards.length})</span>
                </h3>
                <div className="space-y-2">
                  {cards.map(card => (
                    <ArchivedCardItem
                      key={card.id}
                      card={card}
                      onRestore={() => handleRestore(card.id)}
                      onDelete={() => handleDelete(card.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(card => (
            <ArchivedCardItem
              key={card.id}
              card={card}
              onRestore={() => handleRestore(card.id)}
              onDelete={() => handleDelete(card.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
