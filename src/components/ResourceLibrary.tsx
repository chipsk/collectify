'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/lib/types';

interface ResourceCardProps {
  resource: Card;
  onOpen: () => void;
}

function ResourceCard({ resource, onOpen }: ResourceCardProps) {
  const { cards } = useAppStore();

  // Find notes that reference this resource
  const referencedBy = cards.filter(
    c => c.paraType === 'note' && c.content?.includes(`[[${resource.title}]]`)
  );

  const typeIcon = () => {
    switch (resource.resourceType) {
      case 'article':
        return <ArticleIcon />;
      case 'book':
        return <BookIcon />;
      case 'video':
        return <VideoIcon />;
      case 'course':
        return <GraduationCapIcon />;
      default:
        return <ArticleIcon />;
    }
  };

  return (
    <div className="glass-soft rounded-2xl p-5 space-y-3 hover:border-indigo-200/50 transition-all">
      {/* Title + type icon (clickable to open link) */}
      <div className="flex items-start gap-2">
        <span className="shrink-0 mt-0.5">{typeIcon()}</span>
        {resource.url ? (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 font-medium text-stone-800 hover:text-indigo-600 transition-colors line-clamp-2 text-sm"
          >
            {resource.title}
          </a>
        ) : (
          <button onClick={onOpen} className="flex-1 font-medium text-stone-800 hover:text-indigo-600 transition-colors line-clamp-2 text-left text-sm">
            {resource.title}
          </button>
        )}
      </div>

      {/* Source tag */}
      {resource.source && (
        <p className="text-xs text-stone-400">{resource.source}</p>
      )}

      {/* My notes preview */}
      {resource.content && (
        <p className="text-sm text-stone-600 line-clamp-2">{resource.content}</p>
      )}

      {/* Referenced count */}
      {referencedBy.length > 0 && (
        <p className="text-xs text-purple-500">
          被 {referencedBy.length} 篇笔记引用
        </p>
      )}
    </div>
  );
}

// Minimal inline SVG icons (matching the task description)
function ArticleIcon() {
  return (
    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function GraduationCapIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
  );
}

type FilterType = 'all' | 'article' | 'book' | 'video' | 'course';

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'article', label: '文章' },
  { key: 'book', label: '书籍' },
  { key: 'video', label: '视频' },
  { key: 'course', label: '课程' },
];

export default function ResourceLibrary() {
  const { cards, openEditor } = useAppStore();
  const [filter, setFilter] = useState<FilterType>('all');

  const allResources = cards
    .filter(c => c.paraType === 'resource')
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const filteredResources = filter === 'all'
    ? allResources
    : allResources.filter(r => r.resourceType === filter);

  if (allResources.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center shadow-lg">
          <BookIcon />
        </div>
        <h3 className="text-lg font-semibold text-stone-700 mb-2">资源库为空</h3>
        <p className="text-sm text-stone-400">点击右下角按钮添加文章、书籍、视频或课程</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
              filter === opt.key
                ? 'bg-stone-800 text-white'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Resource Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map(resource => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onOpen={() => openEditor(resource)}
          />
        ))}
        {filteredResources.length === 0 && (
          <div className="col-span-full text-center py-8">
            <p className="text-sm text-stone-400">该类型下暂无资源</p>
          </div>
        )}
      </div>
    </div>
  );
}
