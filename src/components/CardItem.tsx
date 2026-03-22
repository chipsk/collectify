'use client';

import { Card } from '@/lib/types';
import { Clock, ChevronRight, Link2, Edit2, Copy, FileText, Archive, Trash2, Brain, GitBranch, Rocket, ArrowRight, Plus } from 'lucide-react';
import { parseCompoundTag } from './TagInput';
import { parseContentWithLinks } from '@/lib/store';
import { useAppStore } from '@/lib/store';
import ContextMenu from './ContextMenu';

interface CardItemProps {
  card: Card;
  onClick: () => void;
  nextReviewDate: string;
  onAddChild?: (parentId: string) => void;
}

// 渲染复合标签（面包屑形式）
function CompoundTagBadge({ tag }: { tag: string }) {
  const parts = parseCompoundTag(tag);
  
  if (parts.length === 1) {
    return (
      <span className="px-2 py-0.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 text-xs rounded-full font-medium">
        {parts[0]}
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center px-2 py-0.5 bg-gradient-to-r from-slate-100 to-stone-100 text-slate-600 text-xs rounded-full font-medium">
      {parts.map((part, i) => (
        <span key={i} className="flex items-center">
          {i > 0 && <ChevronRight className="w-2.5 h-2.5 mx-0.5 text-slate-400" />}
          <span className={i === parts.length - 1 ? 'text-amber-700 font-semibold' : ''}>
            {part}
          </span>
        </span>
      ))}
    </span>
  );
}

// 渲染带链接的内容预览
function ContentPreview({ content }: { content: string }) {
  const { cards } = useAppStore();
  const segments = parseContentWithLinks(content, cards);
  
  return (
    <span>
      {segments.length === 0 
        ? content.slice(0, 100) + (content.length > 100 ? '...' : '')
        : segments.map((seg, i) => {
            if (seg.type === 'text') {
              const text = seg.text.slice(0, 100) + (seg.text.length > 100 ? '...' : '');
              return <span key={i} className="text-stone-500">{text}</span>;
            }
            return (
              <span key={i} className="text-purple-600 font-medium bg-purple-50 px-1 rounded">
                [[{seg.text}]]
              </span>
            );
          })
      }
    </span>
  );
}

export default function CardItem({ card, onClick, nextReviewDate, onAddChild }: CardItemProps) {
  const isDue = card.nextReviewAt && card.nextReviewAt <= Date.now();
  const preview = card.content?.slice(0, 100) + (card.content?.length > 100 ? '...' : '');
  const { updateCard, deleteCard, archiveCard, restoreCard, cards, openEditor, setHomeSection } = useAppStore();

  // Build context menu items based on paraType
  const buildMenuItems = () => {
    const isArchived = card.archived;

    if (isArchived) {
      return [
        {
          icon: <Rocket className="w-4 h-4" />,
          label: '恢复',
          onClick: () => restoreCard(card.id),
        },
        {
          icon: <Trash2 className="w-4 h-4" />,
          label: '永久删除',
          danger: true,
          onClick: () => {
            if (confirm('确定永久删除吗？此操作不可恢复。')) {
              deleteCard(card.id);
            }
          },
        },
      ];
    }

    switch (card.paraType) {
      case 'note':
        return [
          {
            icon: <Edit2 className="w-4 h-4" />,
            label: '编辑',
            onClick: () => openEditor(card),
          },
          {
            icon: <Plus className="w-4 h-4" />,
            label: '添加子文档',
            onClick: () => onAddChild?.(card.id),
          },
          {
            icon: <Link2 className="w-4 h-4" />,
            label: '复制双向链接',
            onClick: () => navigator.clipboard.writeText(`[[${card.title}]]`),
          },
          {
            icon: <Copy className="w-4 h-4" />,
            label: '复制为 Markdown',
            onClick: () => navigator.clipboard.writeText(`# ${card.title}\n\n${card.content}`),
          },
          {
            icon: <Brain className="w-4 h-4" />,
            label: '提炼',
            onClick: () => { onClick(); setHomeSection('distill'); },
            dividerBefore: true,
          },
          {
            icon: <GitBranch className="w-4 h-4" />,
            label: '查看引用',
            onClick: () => {
              // Show referenced-by cards (cards that link to this card)
              const referencingCards = cards.filter(c =>
                c.links?.includes(card.id) || c.links?.includes(card.title)
              );
              if (referencingCards.length > 0) {
                alert(`被以下笔记引用：\n${referencingCards.map(c => `• ${c.title}`).join('\n')}`);
              } else {
                alert('暂无笔记引用此卡片');
              }
            },
          },
          {
            icon: <Archive className="w-4 h-4" />,
            label: '归档',
            danger: true,
            onClick: () => archiveCard(card.id),
            dividerBefore: true,
          },
          {
            icon: <Trash2 className="w-4 h-4" />,
            label: '删除',
            danger: true,
            onClick: () => {
              if (confirm('确定删除吗？')) {
                deleteCard(card.id);
              }
            },
          },
        ];

      case 'resource':
        return [
          {
            icon: <Edit2 className="w-4 h-4" />,
            label: '编辑',
            onClick: () => openEditor(card),
          },
          {
            icon: <Plus className="w-4 h-4" />,
            label: '添加子文档',
            onClick: () => onAddChild?.(card.id),
          },
          {
            icon: <Link2 className="w-4 h-4" />,
            label: card.url ? '复制资源链接' : '复制链接',
            onClick: () => navigator.clipboard.writeText(card.url || `[[${card.title}]]`),
          },
          {
            icon: <Copy className="w-4 h-4" />,
            label: '复制为 Markdown',
            onClick: () => navigator.clipboard.writeText(`# ${card.title}\n\n${card.content}`),
          },
          {
            icon: <GitBranch className="w-4 h-4" />,
            label: '查看被引用',
            onClick: () => {
              const referencingCards = cards.filter(c =>
                c.links?.includes(card.id) || c.links?.includes(card.title)
              );
              if (referencingCards.length > 0) {
                alert(`被以下笔记引用：\n${referencingCards.map(c => `• ${c.title}`).join('\n')}`);
              } else {
                alert('暂无笔记引用此资源');
              }
            },
          },
          {
            icon: <Archive className="w-4 h-4" />,
            label: '归档',
            danger: true,
            onClick: () => archiveCard(card.id),
            dividerBefore: true,
          },
          {
            icon: <Trash2 className="w-4 h-4" />,
            label: '删除',
            danger: true,
            onClick: () => {
              if (confirm('确定删除吗？')) {
                deleteCard(card.id);
              }
            },
          },
        ];

      case 'area':
        return [
          {
            icon: <Edit2 className="w-4 h-4" />,
            label: '编辑',
            onClick: () => openEditor(card),
          },
          {
            icon: <Plus className="w-4 h-4" />,
            label: '添加子文档',
            onClick: () => onAddChild?.(card.id),
          },
          {
            icon: <GitBranch className="w-4 h-4" />,
            label: '习惯打卡设置',
            onClick: () => openEditor(card),
          },
          {
            icon: <Link2 className="w-4 h-4" />,
            label: '复制链接',
            onClick: () => navigator.clipboard.writeText(`[[${card.title}]]`),
          },
          {
            icon: <Archive className="w-4 h-4" />,
            label: '归档',
            danger: true,
            onClick: () => archiveCard(card.id),
            dividerBefore: true,
          },
          {
            icon: <Trash2 className="w-4 h-4" />,
            label: '删除',
            danger: true,
            onClick: () => {
              if (confirm('确定删除吗？')) {
                deleteCard(card.id);
              }
            },
          },
        ];

      case 'flash':
        return [
          {
            icon: <ArrowRight className="w-4 h-4" />,
            label: '转为任务',
            onClick: () => {
              const { convertFlashToTask } = useAppStore.getState();
              convertFlashToTask(card.id);
            },
          },
          {
            icon: <FileText className="w-4 h-4" />,
            label: '转为卡片笔记',
            onClick: () => {
              const { convertFlashToNote } = useAppStore.getState();
              convertFlashToNote(card.id);
            },
          },
          {
            icon: <Rocket className="w-4 h-4" />,
            label: '升级为项目',
            onClick: () => {
              const { convertFlashToProject } = useAppStore.getState();
              convertFlashToProject(card.id);
            },
          },
          {
            icon: <Copy className="w-4 h-4" />,
            label: '复制内容',
            onClick: () => navigator.clipboard.writeText(`${card.title}\n\n${card.content}`),
            dividerBefore: true,
          },
          {
            icon: <Trash2 className="w-4 h-4" />,
            label: '删除',
            danger: true,
            onClick: () => {
              if (confirm('确定删除吗？')) {
                deleteCard(card.id);
              }
            },
          },
        ];

      default:
        return [
          {
            icon: <Edit2 className="w-4 h-4" />,
            label: '编辑',
            onClick: () => openEditor(card),
          },
          {
            icon: <Plus className="w-4 h-4" />,
            label: '添加子文档',
            onClick: () => onAddChild?.(card.id),
          },
          {
            icon: <Archive className="w-4 h-4" />,
            label: '归档',
            danger: true,
            onClick: () => archiveCard(card.id),
            dividerBefore: true,
          },
          {
            icon: <Trash2 className="w-4 h-4" />,
            label: '删除',
            danger: true,
            onClick: () => {
              if (confirm('确定删除吗？')) {
                deleteCard(card.id);
              }
            },
          },
        ];
    }
  };

  return (
    <div className="relative group/card">
      <button
        onClick={onClick}
        className="w-full text-left p-5 glass-soft rounded-2xl card-hover group"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-stone-800 group-hover:text-amber-700 transition-colors line-clamp-1 flex-1">
            {card.title}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            {card.links?.length > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-purple-500" title="引用了其他卡片">
                <Link2 className="w-3 h-3" />
                <span>{card.links.length}</span>
              </span>
            )}
            {isDue && (
              <span className="w-2 h-2 mt-1 bg-amber-400 rounded-full animate-pulse" title="待复习" />
            )}
          </div>
        </div>
        
        {preview && (
          <p className="text-sm line-clamp-2 mb-4 leading-relaxed">
            <ContentPreview content={card.content} />
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {card.tags.slice(0, 2).map(tag => (
              <CompoundTagBadge key={tag} tag={tag} />
            ))}
            {card.tags.length > 2 && (
              <span className="text-xs text-stone-400 self-center">+{card.tags.length - 2}</span>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-xs text-stone-400">
            <Clock className="w-3 h-3" />
            <span>{nextReviewDate}</span>
          </div>
        </div>
      </button>

      {/* Context Menu Trigger — always visible */}
      <div className="absolute top-3 right-3 z-10">
        <ContextMenu items={buildMenuItems()} triggerClassName="!opacity-100 !bg-transparent hover:!bg-stone-100" />
      </div>
    </div>
  );
}
