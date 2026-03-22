'use client';

import { FormInput, FormTextarea } from './Common';

interface FlashFormProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

export default function FlashForm({ data, onChange }: FlashFormProps) {
  return (
    <div className="space-y-4">
      <FormInput
        label="标题"
        value={data.title || ''}
        onChange={v => onChange({ ...data, title: v })}
        placeholder="一闪而过的想法..."
        required
      />
      <FormTextarea
        label="内容"
        value={data.content || ''}
        onChange={v => onChange({ ...data, content: v })}
        placeholder="补充细节...（可选）"
        rows={4}
      />
    </div>
  );
}
