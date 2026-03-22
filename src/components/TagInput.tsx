'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  allTags: string[];
  placeholder?: string;
}

// 解析复合标签为层级数组
export function parseCompoundTag(tag: string): string[] {
  return tag.split('/').map(t => t.trim()).filter(Boolean);
}

// 获取标签的第一级
export function getTagLevel(tag: string, level: number): string | null {
  const parts = parseCompoundTag(tag);
  return parts[level] || null;
}

// 获取标签的所有前缀
export function getTagPrefixes(tag: string): string[] {
  const parts = parseCompoundTag(tag);
  const prefixes: string[] = [];
  for (let i = 1; i <= parts.length; i++) {
    prefixes.push(parts.slice(0, i).join('/'));
  }
  return prefixes;
}

// 渲染复合标签为面包屑
function CompoundTagDisplay({ tag, onRemove }: { tag: string; onRemove: () => void }) {
  const parts = parseCompoundTag(tag);
  
  if (parts.length === 1) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full text-sm font-medium shadow-sm">
        {parts[0]}
        <button type="button" onClick={onRemove} className="text-amber-600 hover:text-red-500 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-slate-100 to-stone-100 text-slate-700 rounded-full text-sm font-medium shadow-sm">
      {parts.map((part, index) => (
        <span key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="w-3 h-3 mx-0.5 text-slate-400" />}
          <span className={index === parts.length - 1 ? 'font-semibold text-amber-700' : 'text-slate-500'}>
            {part}
          </span>
        </span>
      ))}
      <button type="button" onClick={onRemove} className="ml-1 text-slate-500 hover:text-red-500 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}

export default function TagInput({ tags, onChange, allTags, placeholder = '添加标签...' }: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 生成智能建议
  const suggestions = (() => {
    if (!input.trim()) return [];

    const inputParts = parseCompoundTag(input);
    const lastPart = inputParts[inputParts.length - 1] || '';

    // 查找匹配的标签
    const matches = allTags.filter(tag => {
      if (tags.includes(tag)) return false;

      const tagParts = parseCompoundTag(tag);

      // 如果是输入多级，检查前缀是否匹配
      if (inputParts.length > 1) {
        for (let i = 0; i < inputParts.length - 1; i++) {
          if (tagParts[i] !== inputParts[i]) return false;
        }
        // 最后一级模糊匹配
        const lastTagPart = tagParts[inputParts.length - 1] || '';
        return lastTagPart.toLowerCase().includes(lastPart.toLowerCase());
      }

      // 单级模糊匹配
      return tagParts[0]?.toLowerCase().includes(lastPart.toLowerCase());
    });

    return matches.slice(0, 8);
  })();

  // 输入变化时重置选中索引
  useEffect(() => {
    setSelectedIndex(0);
  }, [input]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      addTag(suggestions[selectedIndex] || suggestions[0]);
    } else if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-2 items-center p-3 glass-soft rounded-xl focus-within:ring-2 focus-within:ring-amber-300 transition-all">
        {tags.map(tag => (
          <CompoundTagDisplay 
            key={tag} 
            tag={tag} 
            onRemove={() => removeTag(tag)} 
          />
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[100px] bg-transparent outline-none text-sm text-stone-700 placeholder:text-stone-400"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 glass-soft rounded-xl shadow-lg z-10 overflow-hidden">
          {suggestions.map((tag, idx) => {
            const parts = parseCompoundTag(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center ${
                  idx === selectedIndex
                    ? 'bg-amber-50 text-amber-700'
                    : 'hover:bg-white/60 text-stone-700'
                }`}
              >
                {parts.map((part, i) => (
                  <span key={i} className="flex items-center">
                    {i > 0 && <ChevronRight className="w-3 h-3 mx-1 text-stone-400" />}
                    <span className={i === parts.length - 1 ? 'font-medium text-amber-700' : 'text-stone-500'}>
                      {part}
                    </span>
                  </span>
                ))}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
