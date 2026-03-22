'use client';

import TagInput from '@/components/TagInput';
import { FormInput, FormTextarea, FormCheckbox, FormSection } from './Common';

interface NoteFormProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  allTags: string[];
}

export default function NoteForm({ data, onChange, allTags }: NoteFormProps) {
  return (
    <div className="space-y-4">
      <FormInput
        label="笔记标题"
        value={data.title || ''}
        onChange={v => onChange({ ...data, title: v })}
        placeholder="知识卡片标题..."
        required
      />

      <FormTextarea
        label="笔记正文"
        value={data.content || ''}
        onChange={v => onChange({ ...data, content: v })}
        placeholder="记录你的理解、思考...（可选）"
        rows={4}
      />

      <FormSection label="标签">
        <TagInput
          tags={data.tags || []}
          onChange={v => onChange({ ...data, tags: v })}
          allTags={allTags}
          placeholder="添加标签..."
        />
      </FormSection>

      <FormTextarea
        label="核心洞见"
        value={data.coreInsight || ''}
        onChange={v => onChange({ ...data, coreInsight: v })}
        placeholder="一句话描述这个笔记的核心思想...（可选）"
        rows={2}
      />

      <FormSection>
        <FormCheckbox
          label="原子化 — 将此笔记拆分为更小的原子单元"
          value={data.isAtomic || false}
          onChange={v => onChange({ ...data, isAtomic: v })}
        />
      </FormSection>
    </div>
  );
}
