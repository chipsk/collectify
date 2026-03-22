'use client';

import { ResourceType } from '@/lib/types';
import { FormInput, FormTextarea, FormSection } from './Common';

const RESOURCE_TYPE_OPTIONS: { key: ResourceType; label: string; icon: string }[] = [
  { key: 'article', label: '文章', icon: '📄' },
  { key: 'book', label: '书籍', icon: '📚' },
  { key: 'video', label: '视频', icon: '🎬' },
  { key: 'course', label: '课程', icon: '🎓' },
];

interface ResourceFormProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

export default function ResourceForm({ data, onChange }: ResourceFormProps) {
  return (
    <div className="space-y-4">
      <FormInput
        label="资源标题"
        value={data.title || ''}
        onChange={v => onChange({ ...data, title: v })}
        placeholder="资料名称..."
        required
      />

      <FormSection label="资源类型">
        <div className="flex flex-wrap gap-2">
          {RESOURCE_TYPE_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange({ ...data, resourceType: opt.key })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                (data.resourceType || 'article') === opt.key
                  ? 'bg-stone-800 text-white shadow-md'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </FormSection>

      <FormInput
        label="资源链接"
        value={data.url || ''}
        onChange={v => onChange({ ...data, url: v })}
        placeholder="https://..."
        type="url"
      />

      <FormInput
        label="来源标记"
        value={data.source || ''}
        onChange={v => onChange({ ...data, source: v })}
        placeholder="公众号：XXX / 作者：XXX（可选）"
      />

      <FormTextarea
        label="我的笔记"
        value={data.content || ''}
        onChange={v => onChange({ ...data, content: v })}
        placeholder="记录对这份资料的理解、摘录...（可选）"
        rows={3}
      />
    </div>
  );
}
