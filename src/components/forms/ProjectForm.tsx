'use client';

import { ProjectStatus } from '@/lib/types';
import { FormInput, FormTextarea, FormSection, DatePicker, PARASelect, PARAMultiSelect } from './Common';

const PROJECT_STATUS_OPTIONS: { key: ProjectStatus; label: string; icon: string }[] = [
  { key: 'idea', label: '构思', icon: '💡' },
  { key: 'active', label: '进行中', icon: '🚀' },
  { key: 'completed', label: '已完成', icon: '✅' },
  { key: 'review', label: '复盘', icon: '📋' },
  { key: 'archived', label: '归档', icon: '📦' },
];

interface ProjectFormProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  areas: { id: string; title: string }[];
  resources: { id: string; title: string }[];
}

export default function ProjectForm({ data, onChange, areas, resources }: ProjectFormProps) {
  const dateToTs = (dateStr: string) => {
    if (!dateStr) return undefined;
    return new Date(dateStr + 'T00:00:00').getTime();
  };

  return (
    <div className="space-y-5">
      <FormInput
        label="项目标题"
        value={data.title || ''}
        onChange={v => onChange({ ...data, title: v })}
        placeholder="长期目标..."
        required
      />

      <FormTextarea
        label="项目描述"
        value={data.content || ''}
        onChange={v => onChange({ ...data, content: v })}
        placeholder="项目概述...（可选）"
        rows={2}
      />

      <FormSection label="截止日期">
        <DatePicker
          value={data.projectDeadline || ''}
          onChange={v => onChange({ ...data, projectDeadline: v, projectDeadlineTs: dateToTs(v) })}
        />
      </FormSection>

      <FormSection label="项目状态">
        <div className="flex flex-wrap gap-2">
          {PROJECT_STATUS_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange({ ...data, projectStatus: opt.key })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                (data.projectStatus || 'idea') === opt.key
                  ? 'bg-stone-800 text-white shadow-md'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </FormSection>

      <FormSection label="关联">
        <PARASelect
          label="关联领域"
          value={data.areaId || ''}
          onChange={v => onChange({ ...data, areaId: v })}
          options={areas}
        />
      </FormSection>

      {resources.length > 0 && (
        <FormSection label="关联资源">
          <PARAMultiSelect
            label=""
            value={data.resourceIds || []}
            onChange={v => onChange({ ...data, resourceIds: v })}
            options={resources}
          />
        </FormSection>
      )}
    </div>
  );
}
