'use client';

import { useState } from 'react';
import { Card } from '@/lib/types';
import { useAppStore, calculateNextReview } from '@/lib/store';
import { Brain, X, ChevronRight, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

export default function SpacedReview() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);

  const { isReviewMode, dueCards, endReview, reviewCard, getNextReviewDate } = useAppStore();

  const currentCard = dueCards[currentIndex];
  const progress = dueCards.length > 0 ? `${currentIndex + 1} / ${dueCards.length}` : '0 / 0';

  const handleRate = (quality: number) => {
    if (!currentCard) return;
    reviewCard(currentCard, quality);
    
    if (currentIndex < dueCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowAnswer(false);
    } else {
      setSessionDone(true);
    }
  };

  const qualityLabels = [
    { q: 0, label: '忘了', color: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200 hover:from-red-200 hover:to-rose-200' },
    { q: 1, label: '模糊', color: 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border border-orange-200 hover:from-orange-200 hover:to-amber-200' },
    { q: 2, label: '一般', color: 'bg-gradient-to-r from-yellow-100 to-lime-100 text-yellow-700 border border-yellow-200 hover:from-yellow-200 hover:to-lime-200' },
    { q: 3, label: '良好', color: 'bg-gradient-to-r from-lime-100 to-green-100 text-lime-700 border border-lime-200 hover:from-lime-200 hover:to-green-200' },
    { q: 4, label: '很好', color: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 hover:from-green-200 hover:to-emerald-200' },
    { q: 5, label: '完美', color: 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border border-emerald-200 hover:from-emerald-200 hover:to-teal-200' },
  ];

  if (!isReviewMode) return null;

  if (dueCards.length === 0 || sessionDone) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full flex items-center justify-center shadow-xl shadow-amber-200/50">
            {sessionDone ? (
              <CheckCircle2 className="w-12 h-12 text-amber-700" />
            ) : (
              <Brain className="w-12 h-12 text-amber-700" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-stone-800 mb-3">
            {sessionDone ? '今日复习完成！' : '暂无待复习卡片'}
          </h2>
          <p className="text-stone-500 mb-8 leading-relaxed">
            {sessionDone 
              ? `太棒了！你完成了 ${dueCards.length} 张卡片的复习，知识正在悄悄沉淀中~ ✨` 
              : '所有卡片都已复习完毕，明天再来吧！'}
          </p>
          <button
            onClick={endReview}
            className="px-6 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-colors shadow-lg shadow-stone-200/50"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 via-stone-50 to-stone-50">
      <div className="sticky top-0 bg-white/70 backdrop-blur-xl border-b border-stone-100 px-6 py-4 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-200/50">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-stone-800">遗忘曲线复习</h1>
              <p className="text-sm text-stone-400">{progress}</p>
            </div>
          </div>
          <button
            onClick={endReview}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-stone-400" />
          </button>
        </div>
      </div>

      <div className="h-1 bg-stone-100">
        <div 
          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / dueCards.length) * 100}%` }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="glass-strong rounded-3xl overflow-hidden shadow-2xl shadow-stone-200/40">
          <div className="p-8 pb-12 border-b border-white/30 bg-gradient-to-b from-white/80 to-white/50">
            <div className="text-xs font-medium text-amber-500 uppercase tracking-widest mb-4">
              先回忆一下
            </div>
            <h2 className="text-2xl font-bold text-stone-800 mb-4">
              {currentCard.title}
            </h2>
            <p className="text-stone-500 leading-relaxed">
              {currentCard.content || '无正文内容'}
            </p>
            {currentCard.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {currentCard.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-stone-100 text-stone-500 text-xs rounded-lg">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {!showAnswer ? (
            <div className="p-8 text-center bg-white/40">
              <button
                onClick={() => setShowAnswer(true)}
                className="px-8 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-all shadow-lg shadow-stone-200/40 inline-flex items-center gap-2"
              >
                查看答案
                <ChevronRight className="w-4 h-4" />
              </button>
              <p className="text-sm text-stone-400 mt-4">先尝试回忆，再查看答案</p>
            </div>
          ) : (
            <div className="p-8 bg-gradient-to-b from-white/50 to-white">
              <div className="text-center mb-6">
                <p className="text-sm text-stone-500 mb-2">这张卡片你掌握得如何？</p>
                <p className="text-xs text-stone-400">根据回忆难度选择，下次复习时间会自动调整</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {qualityLabels.map(({ q, label, color }) => (
                  <button
                    key={q}
                    onClick={() => handleRate(q)}
                    className={`px-4 py-3 rounded-xl border transition-all font-medium text-sm ${color}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-5 text-center text-xs text-stone-400 flex items-center justify-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>选择"良好"将在 {getNextReviewDate(calculateNextReview(currentCard, 3))} 再次出现</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
