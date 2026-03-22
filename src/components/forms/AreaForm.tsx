'use client';

import { FormInput, FormTextarea, FormCheckbox, FormSection } from './Common';

interface AreaFormProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

export default function AreaForm({ data, onChange }: AreaFormProps) {
  const habitEnabled = data.habitCheckin ?? false;

  return (
    <div className="space-y-5">
      <FormInput
        label="领域名称"
        value={data.title || ''}
        onChange={v => onChange({ ...data, title: v })}
        placeholder="持续关注的方向..."
        required
      />

      <FormTextarea
        label="领域描述"
        value={data.content || ''}
        onChange={v => onChange({ ...data, content: v })}
        placeholder="这个领域关注什么...（可选）"
        rows={2}
      />

      <FormSection label="习惯打卡设置">
        <FormCheckbox
          label="启用习惯打卡"
          value={habitEnabled}
          onChange={v => onChange({ ...data, habitCheckin: v, habitFrequency: v ? 'daily' : undefined })}
        />

        {habitEnabled && (
          <div className="mt-3">
            <label className="block text-xs font-medium text-stone-500 mb-1.5">打卡频率</label>
            <div className="flex gap-2">
              {[
                { key: 'daily', label: '每日' },
                { key: 'weekly', label: '每周' },
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onChange({ ...data, habitFrequency: opt.key as 'daily' | 'weekly' })}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    (data.habitFrequency || 'daily') === opt.key
                      ? 'bg-amber-400 text-white shadow-md'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </FormSection>

      <FormSection label="定期复盘提醒">
        <FormCheckbox
          label="启用定期复盘"
          value={data.reviewEnabled || false}
          onChange={v => onChange({ ...data, reviewEnabled: v })}
        />
        {data.reviewEnabled && (
          <div className="mt-2">
            <input
              type="date"
              value={data.reviewDate || ''}
              onChange={e => onChange({ ...data, reviewDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-stone-700 text-sm bg-white/60 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        )}
      </FormSection>
    </div>
  );
}
