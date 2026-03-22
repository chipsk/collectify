'use client';

import { useAppStore } from '@/lib/store';
import { Clock, X, Calendar, Sparkles } from 'lucide-react';

export default function TimeCapsule() {
  const { isTimeCapsuleOpen, closeTimeCapsule, timeCapsuleCards, openEditor } = useAppStore();

  if (!isTimeCapsuleOpen) return null;

  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200/50">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-stone-800">历史上的今天</h2>
              <p className="text-stone-500">{dateStr}</p>
            </div>
          </div>
          <button
            onClick={closeTimeCapsule}
            className="p-2.5 hover:bg-white/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {timeCapsuleCards.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center shadow-lg shadow-purple-100/50">
              <Sparkles className="w-9 h-9 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-stone-700 mb-2">今年这天还没记录</h3>
            <p className="text-sm text-stone-400 leading-relaxed">
              每年这天记录的内容，会在这里出现<br />
              继续积累，让记忆在这里重逢 ✨
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-stone-500 mb-6">
              在过去的今天，你记录了 <span className="font-semibold text-indigo-600">{timeCapsuleCards.length}</span> 条想法
            </p>
            {timeCapsuleCards.map(card => {
              const cardDate = new Date(card.createdAt);
              const yearsAgo = today.getFullYear() - cardDate.getFullYear();
              return (
                <button
                  key={card.id}
                  onClick={() => { openEditor(card); closeTimeCapsule(); }}
                  className="w-full text-left p-6 glass-strong rounded-2xl hover:bg-white/90 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg">
                        {yearsAgo}年前
                      </span>
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span className="text-xs text-stone-400">
                        {cardDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-stone-800 group-hover:text-indigo-700 transition-colors mb-2">
                    {card.title}
                  </h3>
                  {card.content && (
                    <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed">
                      {card.content}
                    </p>
                  )}
                  {card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {card.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-xs text-stone-400">
            每天 11:00 会自动推送当日提醒
          </p>
        </div>
      </div>
    </div>
  );
}
