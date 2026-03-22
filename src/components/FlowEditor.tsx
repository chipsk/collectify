'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { ArrowLeft, Check, Type, AlignLeft, X } from 'lucide-react';

export default function FlowEditor() {
  const { isFlowMode, exitFlowMode, editingCard, updateCard, addCard, cards } = useAppStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [step, setStep] = useState<'title' | 'content'>('title');
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingCard && isFlowMode) {
      setTitle(editingCard.title);
      setContent(editingCard.content);
      setStep(editingCard.title ? 'content' : 'title');
    } else if (isFlowMode) {
      setTitle('');
      setContent('');
      setStep('title');
    }
  }, [isFlowMode, editingCard]);

  useEffect(() => {
    if (isFlowMode && step === 'title') {
      setTimeout(() => titleRef.current?.focus(), 50);
    } else if (isFlowMode && step === 'content') {
      setTimeout(() => contentRef.current?.focus(), 50);
    }
  }, [isFlowMode, step]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape' && isFlowMode) {
        handleSave();
      }
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isFlowMode, title, content]);

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (title.trim()) {
        setStep('content');
      }
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;
    
    if (editingCard) {
      updateCard(editingCard.id, { title, content });
    } else {
      addCard(title, content, []);
    }
    exitFlowMode();
  };

  if (!isFlowMode) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-stone-950 flex flex-col">
      {/* Minimal top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={exitFlowMode}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">退出</span>
        </button>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-600">
            {step === 'title' ? '1/2' : '2/2'}
          </span>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-200 hover:bg-stone-300 disabled:opacity-30 text-stone-800 text-sm font-medium rounded-xl transition-all"
          >
            <Check className="w-4 h-4" />
            完成
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-px bg-stone-800">
        <div 
          className="h-full bg-stone-500 transition-all duration-500"
          style={{ width: step === 'title' ? '50%' : '100%' }}
        />
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-full max-w-2xl">
          {step === 'title' ? (
            <div className="animate-in-fade">
              <div className="flex items-center gap-2 mb-6">
                <Type className="w-5 h-5 text-stone-600" />
                <span className="text-sm text-stone-600">写下标题</span>
              </div>
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                placeholder="这一刻在想什么..."
                className="w-full text-4xl font-bold text-stone-100 bg-transparent border-0 outline-none placeholder:text-stone-700 resize-none"
                style={{ fontFamily: 'inherit' }}
              />
              <div className="mt-8 text-center">
                <p className="text-sm text-stone-600">
                  按 <kbd className="px-2 py-1 bg-stone-800 rounded text-stone-400 text-xs">Enter</kbd> 继续写内容
                </p>
              </div>
            </div>
          ) : (
            <div className="animate-in-fade">
              <div className="flex items-center gap-2 mb-6">
                <AlignLeft className="w-5 h-5 text-stone-600" />
                <span className="text-sm text-stone-600">继续写...</span>
                <span className="text-xs text-stone-700">（可选）</span>
              </div>
              <textarea
                ref={contentRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="让思绪自由流淌..."
                className="w-full text-xl text-stone-300 leading-relaxed bg-transparent border-0 outline-none placeholder:text-stone-700 resize-none min-h-[200px]"
                style={{ fontFamily: 'inherit' }}
              />
              <div className="mt-4 text-center">
                <p className="text-xs text-stone-600">
                  按 <kbd className="px-2 py-1 bg-stone-800 rounded text-stone-400 text-xs">Esc</kbd> 或点击右上角完成
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex justify-center gap-2 pb-8">
        <div className={`w-2 h-2 rounded-full transition-all ${step === 'title' ? 'bg-stone-400' : 'bg-stone-700'}`} />
        <div className={`w-2 h-2 rounded-full transition-all ${step === 'content' ? 'bg-stone-400' : 'bg-stone-700'}`} />
      </div>
    </div>
  );
}
