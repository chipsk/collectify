'use client';

import { ChevronRight } from 'lucide-react';
import { Card } from '@/lib/types';

interface BreadcrumbNavProps {
  ancestors: Card[];
  currentParent: Card | null;
  onNavigate: (id: string | null) => void;
}

export default function BreadcrumbNav({ ancestors, currentParent, onNavigate }: BreadcrumbNavProps) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-stone-500 mb-4 flex-wrap">
      <button
        onClick={() => onNavigate(null)}
        className="hover:text-stone-700 transition-colors px-2 py-0.5 rounded hover:bg-stone-100"
      >
        全部
      </button>

      {ancestors.map(ancestor => (
        <span key={ancestor.id} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3 text-stone-400 shrink-0" />
          <button
            onClick={() => onNavigate(ancestor.id)}
            className="hover:text-stone-700 transition-colors px-2 py-0.5 rounded hover:bg-stone-100 max-w-[120px] truncate"
          >
            {ancestor.title}
          </button>
        </span>
      ))}

      {currentParent && (
        <>
          <ChevronRight className="w-3 h-3 text-stone-400 shrink-0" />
          <span className="text-stone-700 font-medium px-2 py-0.5 max-w-[120px] truncate">
            {currentParent.title}
          </span>
        </>
      )}
    </div>
  );
}
