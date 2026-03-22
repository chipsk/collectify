'use client';

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, FolderOpen } from 'lucide-react';
import { parseCompoundTag } from './TagInput';

interface TagCloudProps {
  tags: { tag: string; count: number }[];
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

// 构建标签树
interface TagNode {
  name: string;
  fullPath: string;
  count: number;
  children: Map<string, TagNode>;
}

function buildTagTree(tags: { tag: string; count: number }[]): TagNode[] {
  const root = new Map<string, TagNode>();
  
  tags.forEach(({ tag, count }) => {
    const parts = parseCompoundTag(tag);
    if (parts.length === 0) return;
    
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const fullPath = parts.slice(0, i + 1).join('/');
      
      if (!current.has(part)) {
        current.set(part, {
          name: part,
          fullPath,
          count: 0,
          children: new Map(),
        });
      }
      
      if (i === parts.length - 1) {
        current.get(part)!.count += count;
      }
      
      current = current.get(part)!.children;
    }
  });
  
  return Array.from(root.values());
}

// 渲染标签树
function TagNodeItem({ 
  node, 
  depth = 0, 
  activeTag, 
  onSelectTag,
  expanded,
  onToggle
}: { 
  node: TagNode; 
  depth?: number;
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
  expanded: Set<string>;
  onToggle: (path: string) => void;
}) {
  const hasChildren = node.children.size > 0;
  const isExpanded = expanded.has(node.fullPath);
  const isActive = activeTag === node.fullPath;
  
  return (
    <div>
      <div 
        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-2 ${
          isActive
            ? 'bg-stone-800 text-white font-medium shadow-lg'
            : 'text-stone-600 hover:bg-white/50'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.fullPath);
            }}
            className="p-0.5 hover:bg-black/10 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
        {!hasChildren && <span className="w-5" />}
        
        <FolderOpen className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-amber-500'}`} />
        
        <button
          onClick={() => onSelectTag(node.fullPath)}
          className="flex-1 truncate"
        >
          {node.name}
        </button>
        
        <span className={`text-xs ${isActive ? 'text-stone-300' : 'text-stone-400'}`}>
          {node.count}
        </span>
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {Array.from(node.children.values()).map(child => (
            <TagNodeItem
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              activeTag={activeTag}
              onSelectTag={onSelectTag}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TagCloud({ tags, activeTag, onSelectTag }: TagCloudProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  
  const tagTree = useMemo(() => buildTagTree(tags), [tags]);
  
  const toggleExpand = (path: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };
  
  // 展开所有第一层
  const expandAll = () => {
    const firstLevel = new Set(tagTree.map(n => n.fullPath));
    setExpanded(firstLevel);
  };
  
  return (
    <div className="w-52 shrink-0">
      <div className="sticky top-24">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-widest">标签</h3>
          {tagTree.length > 0 && (
            <button
              onClick={expandAll}
              className="text-xs text-stone-400 hover:text-amber-600 transition-colors"
            >
              展开全部
            </button>
          )}
        </div>
        
        <div className="space-y-0.5">
          {/* 全部按钮 */}
          <button
            onClick={() => onSelectTag(null)}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
              activeTag === null
                ? 'bg-stone-800 text-white font-medium shadow-lg'
                : 'text-stone-600 hover:bg-white/50'
            }`}
          >
            全部
          </button>
          
          {/* 标签树 */}
          {tagTree.map(node => (
            <TagNodeItem
              key={node.fullPath}
              node={node}
              activeTag={activeTag}
              onSelectTag={onSelectTag}
              expanded={expanded}
              onToggle={toggleExpand}
            />
          ))}
          
          {tags.length === 0 && (
            <p className="text-sm text-stone-400 px-3 py-2">暂无标签</p>
          )}
        </div>
      </div>
    </div>
  );
}
