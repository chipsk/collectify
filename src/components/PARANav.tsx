'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { HomeSection } from '@/lib/types';
import { Layers, Zap, CheckSquare, FileText, Rocket, Target, BookOpen, Archive, Flame, Sparkles, Package, Tag, MoreHorizontal, X } from 'lucide-react';

const NAV_ITEMS: { key: HomeSection; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'home', label: '今日行动', icon: <Sparkles className="w-4 h-4" />, color: 'text-teal-500' },
  { key: 'organize', label: '整理工坊', icon: <Flame className="w-4 h-4" />, color: 'text-orange-500' },
  { key: 'tags', label: '标签管理', icon: <Tag className="w-4 h-4" />, color: 'text-amber-500' },
  { key: 'distill', label: '提炼台', icon: <Zap className="w-4 h-4" />, color: 'text-purple-500' },
  { key: 'task', label: '任务', icon: <CheckSquare className="w-4 h-4" />, color: 'text-teal-500' },
  { key: 'note', label: '卡片笔记', icon: <FileText className="w-4 h-4" />, color: 'text-stone-500' },
  { key: 'project', label: '项目看板', icon: <Rocket className="w-4 h-4" />, color: 'text-indigo-500' },
  { key: 'area', label: '领域', icon: <Target className="w-4 h-4" />, color: 'text-purple-500' },
  { key: 'resource', label: '资源库', icon: <BookOpen className="w-4 h-4" />, color: 'text-green-500' },
  { key: 'archived', label: '已归档', icon: <Package className="w-4 h-4" />, color: 'text-stone-400' },
];

// Mobile: first 4 tabs shown directly, "更多" opens drawer
const MOBILE_TABS: { key: HomeSection; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'home', label: '首页', icon: <Sparkles className="w-5 h-5" />, color: 'text-teal-500' },
  { key: 'organize', label: '整理', icon: <Flame className="w-5 h-5" />, color: 'text-orange-500' },
  { key: 'tags', label: '标签', icon: <Tag className="w-5 h-5" />, color: 'text-amber-500' },
  { key: 'distill', label: '提炼', icon: <Zap className="w-5 h-5" />, color: 'text-purple-500' },
];

export default function PARANav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { homeSection, setHomeSection, getPARACounts, cards, getFlashStats, getArchivedCards, allTags } = useAppStore();
  const counts = getPARACounts();
  const flashStats = getFlashStats();
  const archivedCount = getArchivedCards().length;

  const handleNav = (key: HomeSection) => {
    setHomeSection(key);
    setMobileMenuOpen(false);
  };

  // ---- Desktop sidebar (lg+) ----
  const SidebarContent = () => (
    <div className="hidden lg:block w-56 shrink-0">
      <div className="sticky top-24">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-widest">导航</h3>
        </div>

        <div className="glass-soft rounded-2xl p-2 space-y-0.5">
          {NAV_ITEMS.map(({ key, label, icon, color }) => {
            const isActive = homeSection === key;
            const showPulse = key === 'organize' && flashStats.expired > 0;

            return (
              <button
                key={key}
                onClick={() => setHomeSection(key)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2.5 group ${
                  isActive
                    ? 'bg-stone-800 text-white font-medium shadow-lg'
                    : 'text-stone-600 hover:bg-white/50'
                }`}
              >
                <span className={`${color} ${isActive ? 'text-white opacity-90' : ''}`}>
                  {icon}
                </span>
                <span className="flex-1">{label}</span>

                {/* 过期红点（整理工坊） */}
                {showPulse && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}

                {/* 数量气泡 */}
                {key === 'task' && counts.task > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {counts.task}
                  </span>
                )}
                {key === 'note' && counts.note > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {counts.note}
                  </span>
                )}
                {key === 'project' && counts.project > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {counts.project}
                  </span>
                )}
                {key === 'area' && counts.area > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {counts.area}
                  </span>
                )}
                {key === 'resource' && counts.resource > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {counts.resource}
                  </span>
                )}
                {key === 'archived' && archivedCount > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {archivedCount}
                  </span>
                )}
                {key === 'organize' && (flashStats.total - flashStats.expired) > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {flashStats.total - flashStats.expired}
                  </span>
                )}
                {key === 'tags' && allTags.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {allTags.length}
                  </span>
                )}
                {key === 'distill' && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {counts.note}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ---- Mobile bottom tab bar ----
  const MobileTabBar = () => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-stone-200/70 safe-bottom">
      {/* Direct tabs */}
      <div className="flex items-center h-16">
        {MOBILE_TABS.map(({ key, label, icon }) => {
          const isActive = homeSection === key;
          return (
            <button
              key={key}
              onClick={() => handleNav(key)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors ${
                isActive
                  ? 'text-amber-500'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <span className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-amber-50' : ''}`}>
                {icon}
              </span>
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </button>
          );
        })}
        {/* More button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors ${
            mobileMenuOpen
              ? 'text-amber-500'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <span className={`p-1.5 rounded-xl transition-colors ${mobileMenuOpen ? 'bg-amber-50' : ''}`}>
            <MoreHorizontal className="w-5 h-5" />
          </span>
          <span className="text-[10px] font-medium leading-none">更多</span>
        </button>
      </div>
    </div>
  );

  // ---- Mobile drawer menu ----
  const MobileDrawer = () => {
    if (!mobileMenuOpen) return null;
    const restItems = NAV_ITEMS.filter(
      item => !MOBILE_TABS.some(tab => tab.key === item.key)
    );
    return (
      <>
        {/* Backdrop */}
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
        {/* Drawer */}
        <div className="lg:hidden fixed bottom-16 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-in-slide max-h-[70vh] overflow-y-auto">
          <div className="sticky top-0 bg-white pt-4 pb-2 px-4 border-b border-stone-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stone-600">更多功能</h3>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 transition-colors"
              >
                <X className="w-4 h-4 text-stone-400" />
              </button>
            </div>
          </div>
          <div className="p-3 space-y-0.5">
            {restItems.map(({ key, label, icon, color }) => {
              const isActive = homeSection === key;
              return (
                <button
                  key={key}
                  onClick={() => handleNav(key)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center gap-3 ${
                    isActive
                      ? 'bg-amber-50 text-amber-700 font-medium'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span className={color}>{icon}</span>
                  <span className="flex-1">{label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <SidebarContent />
      <MobileTabBar />
      <MobileDrawer />
    </>
  );
}
