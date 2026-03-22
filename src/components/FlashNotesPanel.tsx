'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Zap, Clock, Trash2, CheckSquare, FileText, AlertTriangle, Rocket, Copy } from 'lucide-react';
import ContextMenu from './ContextMenu';

function getTimeRemaining(expiresAt: number): { text: string; color: string; urgent: boolean } {
  const now = Date.now();
  const diff = expiresAt - now;
  
  if (diff <= 0) {
    return { text: '已过期', color: 'text-red-500', urgent: true };
  }
  
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  
  if (hours > 12) {
    return { text: `${hours}小时后过期`, color: 'text-green-500', urgent: false };
  } else if (hours > 4) {
    return { text: `${hours}小时后过期`, color: 'text-yellow-500', urgent: false };
  } else if (hours > 0) {
    return { text: `${hours}小时${minutes}分钟后过期`, color: 'text-orange-500', urgent: true };
  } else {
    return { text: `${minutes}分钟后过期`, color: 'text-red-500', urgent: true };
  }
}

export default function FlashNotesPanel() {
  const { getFlashNotes, getExpiredFlashNotes, deleteCard, convertFlashToTask, convertFlashToNote, updateCard, openEditor } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const expiredNotes = getExpiredFlashNotes();
  const activeNotes = getFlashNotes().filter(n => !n.flashExpiresAt || n.flashExpiresAt >= Date.now());

  const handleEditStart = (id: string, title: string) => {
    setEditingId(id);
    setEditingTitle(title);
  };

  const handleEditSave = (id: string) => {
    if (editingTitle.trim()) {
      updateCard(id, { title: editingTitle.trim() });
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const handleEditChange = (title: string) => setEditingTitle(title);

  const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleEditSave(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 过期警告 */}
      {expiredNotes.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-600">有 {expiredNotes.length} 条闪念笔记已过期</span>
          </div>
          <div className="space-y-2">
            {expiredNotes.map(note => (
              <FlashNoteCard
                key={note.id}
                note={note}
                isEditing={editingId === note.id}
                editingTitle={editingTitle}
                onEditStart={handleEditStart}
                onEditSave={handleEditSave}
                onEditKeyDown={handleEditKeyDown}
                onEditChange={handleEditChange}
                onConvertToTask={() => convertFlashToTask(note.id)}
                onConvertToNote={() => convertFlashToNote(note.id)}
                onDelete={() => deleteCard(note.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 活跃闪念笔记 */}
      {activeNotes.length === 0 && expiredNotes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center shadow-lg">
            <Zap className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold text-stone-700 mb-2">暂无闪念笔记</h3>
          <p className="text-sm text-stone-400">点击右下角按钮，捕捉你的闪念 ✨</p>
        </div>
      ) : activeNotes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-widest px-1">
            活跃闪念笔记 ({activeNotes.length})
          </h3>
          {activeNotes.map(note => (
            <FlashNoteCard
              key={note.id}
              note={note}
              isEditing={editingId === note.id}
              editingTitle={editingTitle}
              onEditStart={handleEditStart}
              onEditSave={handleEditSave}
              onEditKeyDown={handleEditKeyDown}
              onEditChange={handleEditChange}
              onConvertToTask={() => convertFlashToTask(note.id)}
              onConvertToNote={() => convertFlashToNote(note.id)}
              onDelete={() => deleteCard(note.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FlashNoteCardProps {
  note: { id: string; title: string; content: string; flashExpiresAt?: number };
  isEditing: boolean;
  editingTitle: string;
  onEditStart: (id: string, title: string) => void;
  onEditSave: (id: string) => void;
  onEditKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onEditChange: (title: string) => void;
  onConvertToTask: () => void;
  onConvertToNote: () => void;
  onDelete: () => void;
}

function FlashNoteCard({ note, isEditing, editingTitle, onEditStart, onEditSave, onEditKeyDown, onEditChange, onConvertToTask, onConvertToNote, onDelete }: FlashNoteCardProps) {
  const { openEditor, convertFlashToProject } = useAppStore();
  const isExpired = note.flashExpiresAt && note.flashExpiresAt < Date.now();
  const timeInfo = note.flashExpiresAt ? getTimeRemaining(note.flashExpiresAt) : null;
  const preview = note.content?.slice(0, 60) + (note.content?.length > 60 ? '...' : '');

  const flashMenuItems = [
    {
      icon: <CheckSquare className="w-4 h-4" />,
      label: '转为任务',
      onClick: onConvertToTask,
    },
    {
      icon: <FileText className="w-4 h-4" />,
      label: '转为卡片笔记',
      onClick: onConvertToNote,
    },
    {
      icon: <Rocket className="w-4 h-4" />,
      label: '升级为项目',
      onClick: () => convertFlashToProject(note.id),
    },
    {
      icon: <Copy className="w-4 h-4" />,
      label: '复制内容',
      onClick: () => navigator.clipboard.writeText(`${note.title}\n\n${note.content}`),
      dividerBefore: true,
    },
    {
      icon: <Trash2 className="w-4 h-4" />,
      label: '删除',
      danger: true,
      onClick: () => {
        if (confirm('确定删除吗？')) {
          onDelete();
        }
      },
    },
  ];

  return (
    <div className="relative group/flash">
    <div className={`p-4 rounded-xl border transition-all ${
      isExpired
        ? 'bg-red-50/60 border-red-200/60'
        : 'bg-amber-50/40 border-amber-200/40 hover:border-amber-300 hover:bg-amber-50/60'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        {isEditing ? (
          <input
            autoFocus
            value={editingTitle}
            onChange={e => onEditChange(e.target.value)}
            onBlur={() => onEditSave(note.id)}
            onKeyDown={e => onEditKeyDown(e, note.id)}
            className="flex-1 text-sm font-semibold text-stone-800 border-b border-amber-400 outline-none bg-transparent"
          />
        ) : (
          <button
            onClick={() => onEditStart(note.id, note.title)}
            className="font-semibold text-stone-800 hover:text-amber-700 transition-colors text-left flex-1"
          >
            {note.title}
          </button>
        )}
        
        {timeInfo && (
          <span className={`flex items-center gap-1 text-xs shrink-0 ${timeInfo.color}`}>
            <Clock className="w-3 h-3" />
            {timeInfo.text}
          </span>
        )}
      </div>

      {preview && (
        <p className="text-sm text-stone-500 mb-3 line-clamp-2">{preview}</p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onConvertToTask}
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors"
        >
          <CheckSquare className="w-3 h-3" />
          转为任务
        </button>
        <button
          onClick={onConvertToNote}
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors"
        >
          <FileText className="w-3 h-3" />
          转为笔记
        </button>
        <button
          onClick={() => openEditor(note as Parameters<typeof openEditor>[0])}
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors"
        >
          编辑
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto"
        >
          <Trash2 className="w-3 h-3" />
          删除
        </button>
      </div>

      {/* Context Menu Trigger */}
      <div className="absolute top-3 right-3 opacity-0 group-hover/flash:opacity-100 transition-opacity z-10">
        <ContextMenu items={flashMenuItems} />
      </div>
    </div>
    </div>
  );
}
