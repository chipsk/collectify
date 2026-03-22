'use client';

import { TaskPriority } from '@/lib/types';

// Priority Selector — 优先级三选一（高红/中黄/低绿）
interface PrioritySelectorProps {
  value: TaskPriority | undefined;
  onChange: (v: TaskPriority) => void;
}

export function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  const options: { key: TaskPriority; label: string; color: string; activeColor: string }[] = [
    { key: 'high', label: '高', color: 'text-stone-400 bg-stone-100 hover:bg-red-50', activeColor: 'bg-red-500 text-white shadow-md shadow-red-200' },
    { key: 'medium', label: '中', color: 'text-stone-400 bg-stone-100 hover:bg-amber-50', activeColor: 'bg-amber-400 text-white shadow-md shadow-amber-200' },
    { key: 'low', label: '低', color: 'text-stone-400 bg-stone-100 hover:bg-green-50', activeColor: 'bg-green-500 text-white shadow-md shadow-green-200' },
  ];
  return (
    <div className="flex gap-2">
      {options.map(opt => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
            value === opt.key ? opt.activeColor : opt.color
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// DatePicker — 日期选择器包装
interface DatePickerProps {
  value: string; // ISO date string YYYY-MM-DD
  onChange: (v: string) => void;
  min?: string;
  placeholder?: string;
}

export function DatePicker({ value, onChange, min, placeholder = '选择日期' }: DatePickerProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={e => onChange(e.target.value)}
      min={min}
      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-stone-700 text-sm bg-white/60 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
      placeholder={placeholder}
    />
  );
}

// PARA Select — 关联选择器（下拉）
interface PARASelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; title: string }[];
  placeholder?: string;
}

export function PARASelect({ label, value, onChange, options, placeholder = '请选择' }: PARASelectProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-500 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-stone-700 text-sm bg-white/60 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>{opt.title}</option>
        ))}
      </select>
    </div>
  );
}

// PARA MultiSelect — 多选
interface PARAMultiSelectProps {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  options: { id: string; title: string }[];
}

export function PARAMultiSelect({ label, value, onChange, options }: PARAMultiSelectProps) {
  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id));
    } else {
      onChange([...value, id]);
    }
  };
  return (
    <div>
      <label className="block text-xs font-medium text-stone-500 mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              value.includes(opt.id)
                ? 'bg-amber-400 text-white shadow-md'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {opt.title}
          </button>
        ))}
      </div>
    </div>
  );
}

// Section divider with label
export function FormSection({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      {label && <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">{label}</div>}
      {children}
    </div>
  );
}

// Text input with label
export function FormInput({ label, value, onChange, placeholder, required, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-500 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-stone-700 text-sm bg-white/60 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent placeholder:text-stone-400"
      />
    </div>
  );
}

// Textarea with label
export function FormTextarea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-500 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-stone-700 text-sm bg-white/60 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent placeholder:text-stone-400 resize-none"
      />
    </div>
  );
}

// Checkbox with label
export function FormCheckbox({ label, value, onChange }: {
  label: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div
        onClick={() => onChange(!value)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
          value ? 'bg-amber-400 border-amber-400' : 'border-stone-300 bg-white/60 group-hover:border-stone-400'
        }`}
      >
        {value && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="text-sm text-stone-700">{label}</span>
    </label>
  );
}
