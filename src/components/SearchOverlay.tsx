import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { PARAType, Card } from '@/lib/types';

type TimeRange = 'all' | 'today' | 'week' | 'month';

interface SearchFilters {
  paraType: PARAType | null;
  timeRange: TimeRange;
}

const PARA_ICONS: Record<PARAType, string> = {
  flash: '⚡',
  task: '📋',
  note: '📝',
  project: '🚀',
  area: '🎯',
  resource: '📚',
};

const PARA_LABELS: Record<PARAType, string> = {
  flash: '闪念',
  task: '任务',
  note: '笔记',
  project: '项目',
  area: '领域',
  resource: '资源',
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightMatch({ text, query, className = '' }: { text: string; query: string; className?: string }) {
  if (!query.trim()) return <span className={className}>{text}</span>;

  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-200 text-stone-800 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60 * 1000) return '刚刚';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const { cards, openEditor } = useAppStore();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    paraType: null,
    timeRange: 'all',
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setFilters({ paraType: null, timeRange: 'all' });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const searchCards = (): Card[] => {
    const { paraType, timeRange } = filters;

    return cards
      .filter((card) => {
        if (card.archived) return false;

        // PARA type filter
        if (paraType && card.paraType !== paraType) return false;

        // Time filter
        if (timeRange && timeRange !== 'all') {
          const now = Date.now();
          const cardDate = card.createdAt;
          if (timeRange === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (cardDate < today.getTime()) return false;
          } else if (timeRange === 'week') {
            const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
            if (cardDate < weekAgo) return false;
          } else if (timeRange === 'month') {
            const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
            if (cardDate < monthAgo) return false;
          }
        }

        // Keyword search
        if (query.trim()) {
          const q = query.toLowerCase();
          const matchTitle = card.title.toLowerCase().includes(q);
          const matchContent = (card.content || '').toLowerCase().includes(q);
          const matchTags = card.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchContent && !matchTags) return false;
        }

        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  };

  const recentCards = (): Card[] => {
    return cards
      .filter((c) => !c.archived)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);
  };

  const results = searchCards();

  // Group results by PARA type
  const groupedResults = results.reduce<Record<PARAType, Card[]>>((acc, card) => {
    if (!acc[card.paraType]) acc[card.paraType] = [];
    acc[card.paraType].push(card);
    return acc;
  }, {} as Record<PARAType, Card[]>);

  const groupedEntries = Object.entries(groupedResults) as [PARAType, Card[]][];

  const handleSelectCard = (card: Card) => {
    openEditor(card);
    onClose();
  };

  const paraTypes: PARAType[] = ['note', 'task', 'project', 'area', 'resource', 'flash'];
  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'today', label: '今天' },
    { value: 'week', label: '本周' },
    { value: 'month', label: '本月' },
  ];

  const displayCards = query.trim() ? results : recentCards();
  const isRecentMode = !query.trim() && displayCards.length > 0;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center"
      style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Search Box Container */}
      <div className="w-full max-w-2xl mt-20 mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
        {/* Search Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100">
          <Search className="w-5 h-5 text-stone-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索标题、内容或标签..."
            className="flex-1 text-lg text-stone-800 placeholder-stone-300 outline-none bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-stone-400 bg-stone-50 border border-stone-200 rounded-lg">
            ESC
          </kbd>
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-3 border-b border-stone-100 flex flex-wrap gap-4">
          {/* PARA Type Filters */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setFilters((f) => ({ ...f, paraType: null }))}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filters.paraType === null
                  ? 'bg-stone-800 text-white'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              全部
            </button>
            {paraTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilters((f) => ({ ...f, paraType: f.paraType === type ? null : type }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
                  filters.paraType === type
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                <span>{PARA_ICONS[type]}</span>
                {PARA_LABELS[type]}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-stone-200 self-center" />

          {/* Time Range Filters */}
          <div className="flex items-center gap-1">
            {timeRanges.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilters((f) => ({ ...f, timeRange: value }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  filters.timeRange === value
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-stone-50 text-stone-400 hover:bg-stone-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto">
          {isRecentMode && (
            <p className="text-xs text-stone-400 px-5 pt-4 pb-2 font-medium">最近编辑</p>
          )}

          {query.trim() && groupedEntries.length > 0 && (
            <div className="py-2">
              {groupedEntries.map(([type, typeCards]) => (
                <div key={type}>
                  <div className="flex items-center gap-2 px-5 py-2">
                    <span className="text-sm">{PARA_ICONS[type]}</span>
                    <span className="text-sm font-medium text-stone-700">{PARA_LABELS[type]}</span>
                    <span className="text-xs text-stone-400">({typeCards.length})</span>
                  </div>
                  <div className="px-2 pb-1">
                    {typeCards.map((card) => (
                      <div
                        key={card.id}
                        className="p-3 mx-1 hover:bg-stone-50 cursor-pointer rounded-xl transition-colors"
                        onClick={() => handleSelectCard(card)}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <HighlightMatch
                            text={card.title}
                            query={query}
                            className="font-medium text-stone-800 text-sm"
                          />
                          {card.archived && (
                            <span className="text-xs bg-stone-200 text-stone-500 px-1.5 rounded">
                              已归档
                            </span>
                          )}
                        </div>
                        {card.content && (
                          <p className="text-xs text-stone-400 line-clamp-2 ml-6">
                            <HighlightMatch text={card.content} query={query} />
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 ml-6">
                          {card.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs text-stone-400">
                              #{tag}
                            </span>
                          ))}
                          <span className="text-xs text-stone-400">{formatTime(card.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {query.trim() && groupedEntries.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-2xl flex items-center justify-center">
                <Search className="w-7 h-7 text-stone-300" />
              </div>
              <p className="text-stone-500 font-medium">未找到匹配的结果</p>
              <p className="text-xs text-stone-400 mt-1">试试其他关键词或筛选条件</p>
            </div>
          )}

          {isRecentMode && (
            <div className="px-2 pb-2">
              {recentCards().map((card) => (
                <div
                  key={card.id}
                  className="p-3 mx-1 hover:bg-stone-50 cursor-pointer rounded-xl transition-colors"
                  onClick={() => handleSelectCard(card)}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-stone-400">{PARA_ICONS[card.paraType]}</span>
                    <span className="font-medium text-stone-800 text-sm">{card.title}</span>
                    {card.archived && (
                      <span className="text-xs bg-stone-200 text-stone-500 px-1.5 rounded">
                        已归档
                      </span>
                    )}
                  </div>
                  {card.content && (
                    <p className="text-xs text-stone-400 line-clamp-2 ml-6">{card.content}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 ml-6">
                    {card.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs text-stone-400">
                        #{tag}
                      </span>
                    ))}
                    <span className="text-xs text-stone-400">{formatTime(card.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-200 rounded text-xs">↵</kbd>
              选择
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-200 rounded text-xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-200 rounded text-xs">↓</kbd>
              导航
            </span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-200 rounded text-xs">⌘</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-200 rounded text-xs">K</kbd>
            <span>搜索</span>
            <span className="mx-2">|</span>
            <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-200 rounded text-xs">ESC</kbd>
            <span>关闭</span>
          </div>
        </div>
      </div>
    </div>
  );
}
