'use client';

import { FormInput, FormTextarea, FormCheckbox, FormSection, PrioritySelector, DatePicker, PARASelect } from './Common';
import { TaskPriority } from '@/lib/types';

interface TaskFormProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  projects: { id: string; title: string }[];
  areas: { id: string; title: string }[];
}

export default function TaskForm({ data, onChange, projects, areas }: TaskFormProps) {
  // Helper to convert YYYY-MM-DD to timestamp at midnight
  const dateToTs = (dateStr: string) => {
    if (!dateStr) return undefined;
    return new Date(dateStr + 'T00:00:00').getTime();
  };

  return (
    <div className="space-y-5">
      <FormInput
        label="任务标题"
        value={data.title || ''}
        onChange={v => onChange({ ...data, title: v })}
        placeholder="要完成的事情..."
        required
      />

      <FormTextarea
        label="任务描述"
        value={data.content || ''}
        onChange={v => onChange({ ...data, content: v })}
        placeholder="补充说明...（可选）"
        rows={2}
      />

      <FormSection label="时间">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">开始日期</label>
            <DatePicker
              value={data.startDate || ''}
              onChange={v => onChange({ ...data, startDate: v, startDateTs: dateToTs(v) })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">截止日期</label>
            <DatePicker
              value={data.dueDate || ''}
              onChange={v => onChange({ ...data, dueDate: v, dueDateTs: dateToTs(v) })}
              min={data.startDate || undefined}
            />
          </div>
        </div>
      </FormSection>

      <FormSection label="优先级">
        <PrioritySelector
          value={data.priority || 'medium'}
          onChange={v => onChange({ ...data, priority: v })}
        />
      </FormSection>

      <FormSection label="关联">
        <div className="grid grid-cols-2 gap-3">
          <PARASelect
            label="关联项目"
            value={data.projectId || ''}
            onChange={v => onChange({ ...data, projectId: v })}
            options={projects}
          />
          <PARASelect
            label="关联领域"
            value={data.areaId || ''}
            onChange={v => onChange({ ...data, areaId: v })}
            options={areas}
          />
        </div>
      </FormSection>

      <FormSection>
        <FormInput
          label="参与人"
          value={data.participants || ''}
          onChange={v => onChange({ ...data, participants: v })}
          placeholder="姓名，多个用逗号分隔（可选）"
        />
      </FormSection>

      <FormSection>
        <FormInput
          label="任务地点"
          value={data.location || ''}
          onChange={v => onChange({ ...data, location: v })}
          placeholder="地点...（可选）"
        />
      </FormSection>

      <FormSection>
        <FormCheckbox
          label="习惯打卡 — 每日/每周重复任务"
          value={data.habitCheckin || false}
          onChange={v => onChange({ ...data, habitCheckin: v })}
        />
      </FormSection>
    </div>
  );
}
