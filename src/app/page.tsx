'use client';

import { useEffect, useState } from 'react';
import { Plus, Brain, Sparkles, PenLine, History, Flame, CheckSquare, Rocket, Target, Search, FileText } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import CardItem from '@/components/CardItem';
import CardEditor from '@/components/CardEditor';
import QuickCapture from '@/components/QuickCapture';
import PARANav from '@/components/PARANav';

import SpacedReview from '@/components/SpacedReview';
import SimilarCardsPanel from '@/components/SimilarCardsPanel';
import TimeCapsule from '@/components/TimeCapsule';
import FlowEditor from '@/components/FlowEditor';
import FlashNotesPanel from '@/components/FlashNotesPanel';
import TaskList from '@/components/TaskList';
import ProjectBoard from '@/components/ProjectBoard';
import OrganizeWorkshop from '@/components/OrganizeWorkshop';
import DistillStation from '@/components/DistillStation';
import ArchivedItems from '@/components/ArchivedItems';
import CalendarView from '@/components/CalendarView';
import TagManager from '@/components/TagManager';
import SearchOverlay from '@/components/SearchOverlay';
import ResourceLibrary from '@/components/ResourceLibrary';
import AreaDetail from '@/components/AreaDetail';

type HomeSection = 'home' | 'organize' | 'tags' | 'distill' | 'task' | 'note' | 'project' | 'area' | 'resource' | 'archived';

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return `今天 ${day}日`;
  return `${month}月${day}日`;
}

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const {
    cards,
    activeTag,
    setActiveTag,
    openEditor,
    openQuickCapture,

    startReview,
    enterFlowMode,
    openTimeCapsule,
    filteredCards,
    dueCards,
    getNextReviewDate,
    allTags,
    timeCapsuleCards,
    getTodayTasks,
    getActiveProjects,
    getHabitCheckins,
    getFlashStats,
    getPARACounts,
    updateCard,
    homeSection,
    setHomeSection,
    setPendingParentId,
  } = useAppStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset area selection when switching sections
  useEffect(() => {
    setSelectedAreaId(null);
  }, [homeSection]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-stone-50 to-amber-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-300 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-sm text-stone-400">加载中...</span>
        </div>
      </div>
    );
  }

  const todayTasks = getTodayTasks();
  const activeProjects = getActiveProjects();
  const habitCheckins = getHabitCheckins();
  const flashStats = getFlashStats();
  const counts = getPARACounts();

  // Render PARA-specific content
  const renderPARAContent = () => {
    switch (homeSection) {
      case 'organize':
        return <OrganizeWorkshop />;
      case 'tags':
        return <TagManager />;
      case 'distill':
        return <DistillStation />;
      case 'task':
        return <TaskList />;
      case 'project':
        return <ProjectBoard />;
      case 'resource':
        return <ResourceLibrary />;
      case 'area': {
        // Area section: list → detail navigation
        const areas = cards.filter(c => c.paraType === 'area').sort((a, b) => b.updatedAt - a.updatedAt);
        if (selectedAreaId) {
          const area = cards.find(c => c.id === selectedAreaId);
          if (area) {
            return (
              <div key="area-detail">
                <button
                  onClick={() => setSelectedAreaId(null)}
                  className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-4 transition-colors"
                >
                  ← 返回领域列表
                </button>
                <AreaDetail area={area} onClose={() => setSelectedAreaId(null)} />
              </div>
            );
          }
        }
        // Area list view
        return (
          <div key="area-list">
            {areas.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center shadow-lg">
                  <Target className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold text-stone-700 mb-2">暂无领域</h3>
                <p className="text-sm text-stone-400">点击右下角按钮创建领域</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {areas.map(area => {
                  const relatedProjects = cards.filter(c => c.paraType === 'project' && c.areaId === area.id);
                  const relatedNotes = cards.filter(c => c.paraType === 'note' && (c.areaId === area.id || c.content?.includes(`[[${area.title}]]`)));
                  return (
                    <button
                      key={area.id}
                      onClick={() => setSelectedAreaId(area.id)}
                      className="text-left p-5 bg-white/60 border border-white/40 rounded-2xl hover:border-purple-200/60 hover:bg-white/80 transition-all"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <Target className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                        <h4 className="font-semibold text-stone-800 line-clamp-1 flex-1">{area.title}</h4>
                      </div>
                      {area.content && (
                        <p className="text-xs text-stone-400 line-clamp-2 mb-3">{area.content}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-stone-400">
                        {relatedProjects.length > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Rocket className="w-3 h-3" />{relatedProjects.length} 项目
                          </span>
                        )}
                        {relatedNotes.length > 0 && (
                          <span className="flex items-center gap-0.5">
                            <FileText className="w-3 h-3" />{relatedNotes.length} 笔记
                          </span>
                        )}
                        {area.habitCheckin && (
                          <span className="flex items-center gap-0.5">
                            <CheckSquare className="w-3 h-3" />习惯打卡
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      }
      case 'note':
      case 'project':
      case 'resource':
        return renderCardListSection();
      case 'flash':
        return <FlashNotesPanel />;
      case 'archived':
        return <ArchivedItems />;
      default:
        return renderCardListSection();
    }
  };

  // Render card list for note/project/area/resource sections
  const renderCardListSection = () => {
    return renderCardList(filteredCards);
  };

  const renderCardList = (cardList: typeof filteredCards) => {
    if (cardList.length === 0) {
      return (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-stone-100 to-stone-200 rounded-3xl flex items-center justify-center shadow-lg shadow-stone-200/50">
            <Sparkles className="w-9 h-9 text-stone-400" />
          </div>
          <h3 className="text-lg font-semibold text-stone-700 mb-2">
            {homeSection ? getPARALabel(homeSection) + ' 暂无内容' : '开始记录你的想法'}
          </h3>
          <p className="text-sm text-stone-400 mb-6">
            {homeSection ? '点击右下角按钮创建' : '点击右下角按钮，捕捉闪念 ✨'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {cardList.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            onClick={() => openEditor(card)}
            nextReviewDate={getNextReviewDate(card)}
            onAddChild={(parentId) => {
              setPendingParentId(parentId);
              openQuickCapture();
            }}
          />
        ))}
      </div>
    );
  };

  // Render Command Center sections
  const renderCommandCenter = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-800">今日行动</h2>
          <p className="text-sm text-stone-500">
            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
        {flashStats.expired > 0 && (
          <button
            onClick={() => setHomeSection('organize')}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
          >
            <Flame className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-600">{flashStats.expired} 条过期</span>
          </button>
        )}
      </div>

      {/* Two column layout: left=content, right=calendar */}
      <div className="grid grid-cols-5 gap-6">
        {/* Left column (3/5): Today's Tasks + Active Projects + Habit Checkins */}
        <div className="col-span-3 space-y-6">
          {/* Section 1: Today's Tasks (teal theme) */}
          <div className="p-5 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl border border-teal-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                  <CheckSquare className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-teal-800">今日任务</h3>
              </div>
              {todayTasks.length > 0 && (
                <span className="text-xs text-teal-500 bg-teal-100 px-2 py-0.5 rounded-full">
                  {todayTasks.length} 项
                </span>
              )}
            </div>

            {todayTasks.length === 0 ? (
              <div className="text-center py-6">
                <CheckSquare className="w-7 h-7 text-teal-300 mx-auto mb-2" />
                <p className="text-sm text-teal-600 font-medium">太棒了！今天没有待办任务</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.slice(0, 5).map(task => {
                  const priorityColors = {
                    high: 'bg-red-400',
                    medium: 'bg-yellow-400',
                    low: 'bg-green-400',
                  };
                  return (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-white/70 rounded-xl">
                      <div className={`w-1.5 h-7 rounded-full ${priorityColors[task.priority || 'medium']}`} />
                      <span className="flex-1 text-sm text-stone-700 line-clamp-1">{task.title}</span>
                      {task.dueDate && (
                        <span className="text-xs text-teal-500">{formatDate(task.dueDate)}</span>
                      )}
                      <button
                        onClick={() => updateCard(task.id, { completed: !task.completed })}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          task.completed
                            ? 'bg-teal-500 border-teal-500 text-white'
                            : 'border-stone-300 hover:border-teal-400'
                        }`}
                      >
                        {task.completed && <CheckSquare className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  );
                })}
                {todayTasks.length > 5 && (
                  <button
                    onClick={() => setHomeSection('task')}
                    className="w-full text-center text-sm text-teal-600 py-2 hover:text-teal-700"
                  >
                    查看全部 {todayTasks.length} 项 →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Active Projects (indigo theme) */}
          <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-indigo-800">进行中项目</h3>
              </div>
              {activeProjects.length > 0 && (
                <span className="text-xs text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">
                  {activeProjects.length} 个
                </span>
              )}
            </div>

            {activeProjects.length === 0 ? (
              <div className="text-center py-6">
                <Rocket className="w-7 h-7 text-indigo-300 mx-auto mb-2" />
                <p className="text-sm text-indigo-600 font-medium">暂无进行中的项目</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeProjects.slice(0, 4).map(project => {
                  const linkedTasks = cards.filter(c => c.paraType === 'task' && c.projectId === project.id);
                  const completedTasks = linkedTasks.filter(t => t.completed);
                  const progress = linkedTasks.length > 0 ? Math.round((completedTasks.length / linkedTasks.length) * 100) : 0;

                  return (
                    <div key={project.id} className="p-3 bg-white/70 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex-1 font-medium text-stone-800 text-sm line-clamp-1">{project.title}</span>
                        {project.projectDeadline && (
                          <span className="text-xs text-indigo-500 flex items-center gap-0.5">
                            <Target className="w-3 h-3" />
                            {formatDate(project.projectDeadline)}
                          </span>
                        )}
                      </div>
                      {linkedTasks.length > 0 && (
                        <>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-stone-400">{completedTasks.length}/{linkedTasks.length} 任务</span>
                            <span className="text-indigo-500 font-medium">{progress}%</span>
                          </div>
                          <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
                {activeProjects.length > 4 && (
                  <button
                    onClick={() => setHomeSection('project')}
                    className="w-full text-center text-sm text-indigo-600 py-2 hover:text-indigo-700"
                  >
                    查看全部 {activeProjects.length} 个项目 →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Today's Habit Checkins (green theme) */}
          {habitCheckins.length > 0 && (
            <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-green-800">今日打卡</h3>
                </div>
                <span className="text-xs text-green-500 bg-green-100 px-2 py-0.5 rounded-full">
                  {habitCheckins.filter(h => h.habitCompletedToday).length}/{habitCheckins.length}
                </span>
              </div>

              <div className="space-y-2">
                {habitCheckins.map(habit => (
                  <div key={habit.id} className="flex items-center gap-3 p-3 bg-white/70 rounded-xl">
                    <button
                      onClick={() => updateCard(habit.id, { habitCompletedToday: !habit.habitCompletedToday })}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        habit.habitCompletedToday
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-stone-300 hover:border-green-400'
                      }`}
                    >
                      {habit.habitCompletedToday && <CheckSquare className="w-3.5 h-3.5" />}
                    </button>
                    <span className={`flex-1 text-sm ${habit.habitCompletedToday ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                      {habit.title}
                    </span>
                    <span className="text-xs text-stone-400">
                      {habit.habitFrequency === 'daily' ? '每日' : '每周'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-stone-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-stone-800">{counts.note}</p>
              <p className="text-xs text-stone-500">卡片笔记</p>
            </div>
            <div className="p-4 bg-stone-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-teal-600">{counts.task}</p>
              <p className="text-xs text-stone-500">待办任务</p>
            </div>
            <div className="p-4 bg-stone-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-indigo-600">{counts.project}</p>
              <p className="text-xs text-stone-500">项目</p>
            </div>
          </div>
        </div>

        {/* Right column (2/5): Calendar */}
        <div className="col-span-2">
          <CalendarView />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-50 to-amber-50">
      <header className="sticky top-0 z-30 bg-white/60 backdrop-blur-xl border-b border-white/40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-200/50">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-800 tracking-tight">拾迹</h1>
              <p className="text-xs text-stone-400">记录 · 整理 · 回忆</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 心流写作 */}
            <button
              onClick={() => enterFlowMode()}
              className="p-2.5 text-stone-500 hover:text-stone-700 hover:bg-white/60 rounded-xl transition-all"
              title="心流写作"
            >
              <PenLine className="w-5 h-5" />
            </button>
            
            {/* 历史上的今天 */}
            {timeCapsuleCards.length > 0 && (
              <button
                onClick={openTimeCapsule}
                className="flex items-center gap-1.5 px-3 py-1.5 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all text-sm"
                title="历史上的今天"
              >
                <History className="w-4 h-4" />
                <span className="text-xs font-medium">{timeCapsuleCards.length}</span>
              </button>
            )}
            
            {/* 复习 */}
            {dueCards.length > 0 && (
              <button
                onClick={startReview}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl hover:from-amber-100 hover:to-orange-100 transition-all group shadow-sm"
              >
                <Brain className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-amber-700">{dueCards.length}</span>
              </button>
            )}
            
            {/* 搜索 */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2.5 text-stone-500 hover:text-stone-700 hover:bg-white/60 rounded-xl transition-all"
              title="搜索 (⌘K)"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Left: PARA Navigation */}
          <PARANav />

          <div className="flex-1 min-w-0">
            {/* Command Center (Home) */}
            {homeSection === 'home' && renderCommandCenter()}

            {/* PARA-specific content */}
            {homeSection !== 'home' && (
              <>
                {/* Tag filter bar (only for notes/areas/resources/archive) */}
                {homeSection && !['organize', 'tags', 'distill', 'flash', 'task', 'project'].includes(homeSection) && (
                  <div className="mb-4">
                    {allTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        <button
                          onClick={() => setHomeSection('home')}
                          className="px-3 py-1 rounded-full text-xs font-medium transition-all bg-stone-800 text-white"
                        >
                          全部
                        </button>
                        {allTags.slice(0, 8).map(({ tag }) => (
                          <button
                            key={tag}
                            onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                              activeTag === tag
                                ? 'bg-stone-800 text-white'
                                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* PARA-specific content */}
                {renderPARAContent()}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Floating action buttons */}
      <div className="fixed right-6 bottom-6 flex flex-col gap-3 z-20">
        <button
          onClick={() => enterFlowMode()}
          className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 text-white rounded-xl shadow-lg shadow-purple-300/50 hover:shadow-xl hover:shadow-purple-300/60 hover:scale-105 transition-all flex items-center justify-center"
          title="心流写作"
        >
          <PenLine className="w-5 h-5" />
        </button>
        <button
          onClick={openQuickCapture}
          className="w-14 h-14 btn-gradient text-white rounded-2xl shadow-xl shadow-amber-300/50 hover:shadow-2xl hover:shadow-amber-300/60 hover:scale-105 transition-all flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Modals */}
      <QuickCapture />
      <CardEditor />
      <SpacedReview />
      <SimilarCardsPanel />
      <TimeCapsule />
      <FlowEditor />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function getPARALabel(para: string): string {
  const labels: Record<string, string> = {
    note: '卡片笔记',
    area: '领域',
    resource: '资源库',
    archived: '已归档',
    flash: '闪念笔记',
    task: '任务',
    project: '项目看板',
    organize: '整理工坊',
    distill: '提炼台',
    tags: '标签管理',
  };
  return labels[para] || para;
}
