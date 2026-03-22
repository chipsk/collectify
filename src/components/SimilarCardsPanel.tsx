'use client';

import { useAppStore } from '@/lib/store';
import { Link2, X, ArrowRight, Sparkles } from 'lucide-react';

export default function SimilarCardsPanel() {
  const { 
    isSimilarPanelOpen, 
    closeSimilarPanel, 
    similarSuggestions, 
    openEditor,
    cards,
    addCard,
    updateCard,
    editingCard,
    isQuickCaptureOpen,
  } = useAppStore();

  if (!isSimilarPanelOpen) return null;

  const isEditing = editingCard !== null;

  const handleMerge = (similarCard: typeof similarSuggestions[0]) => {
    if (isEditing && editingCard) {
      // Merge similar card's content into current card
      const mergedContent = editingCard.content 
        ? `${editingCard.content}\n\n---\n合并自「${similarCard.card.title}」：\n${similarCard.card.content}`
        : `合并自「${similarCard.card.title}」：\n${similarCard.card.content}`;
      updateCard(editingCard.id, { content: mergedContent });
      closeSimilarPanel();
    }
  };

  const handleOpenSimilar = (card: typeof similarSuggestions[0]) => {
    closeSimilarPanel();
    openEditor(card.card);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={closeSimilarPanel} />
      <div className="relative glass-strong rounded-3xl w-full max-w-md overflow-hidden animate-in-slide">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-md shadow-purple-200/50">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-800">知识磁吸</h2>
              <p className="text-xs text-stone-400">检测到相似内容</p>
            </div>
          </div>
          <button onClick={closeSimilarPanel} className="p-2 hover:bg-white/50 rounded-xl transition-colors">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-80 overflow-y-auto">
          {similarSuggestions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-stone-400 text-sm">没有找到相似卡片，很可能是全新内容~</p>
            </div>
          ) : (
            similarSuggestions.map(({ card, similarity }) => (
              <div 
                key={card.id}
                className="p-4 glass-soft rounded-2xl hover:bg-white/70 transition-all cursor-pointer group"
                onClick={() => handleOpenSimilar({ card, similarity })}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-stone-800 truncate group-hover:text-purple-700 transition-colors">
                      {card.title}
                    </h4>
                    <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">
                      {card.content?.slice(0, 60) || '无正文'}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    <span className="text-xs font-medium text-purple-600">
                      {Math.round(similarity * 100)}%相似
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex flex-wrap gap-1">
                    {card.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {isEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMerge({ card, similarity });
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-medium rounded-lg transition-colors"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      合并
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-white/40 border-t border-white/30">
          <button
            onClick={closeSimilarPanel}
            className="px-5 py-2.5 text-stone-600 hover:bg-white/50 rounded-xl transition-colors text-sm"
          >
            {isEditing ? '继续编辑' : '好的'}
          </button>
          {similarSuggestions.length > 0 && (
            <button
              onClick={closeSimilarPanel}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-md shadow-purple-200/50"
            >
              这是新内容，保存
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
