'use client';

import { create } from 'zustand';
import { Card, AppState, calculateSimilarity, PARAType, ProjectStatus, TaskPriority, HomeSection } from './types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'collectify-v4'; // bump version for para fields

// SM-2 Spaced Repetition Algorithm
export function calculateNextReview(card: Card, quality: number): Card {
  const now = Date.now();
  
  if (quality < 2) {
    return {
      ...card,
      nextReviewAt: now + 10 * 60 * 1000,
      repetitions: 0,
      interval: 1,
      easeFactor: Math.max(1.3, (card.easeFactor || 2.5) - 0.2),
    };
  }

  const repetitions = (card.repetitions || 0) + 1;
  let interval: number;
  let easeFactor = card.easeFactor || 2.5;

  if (repetitions === 1) {
    interval = 1;
  } else if (repetitions === 2) {
    interval = 3;
  } else {
    interval = Math.round((card.interval || 1) * easeFactor);
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(1.3, easeFactor);
  const nextReviewAt = now + interval * 24 * 60 * 60 * 1000;

  return {
    ...card,
    nextReviewAt,
    interval,
    easeFactor,
    repetitions,
  };
}

function getNextReviewDate(card: Card): string {
  if (!card.nextReviewAt) return '随时复习';
  const now = Date.now();
  const diff = card.nextReviewAt - now;
  
  if (diff <= 0) return '现在复习';
  if (diff < 60 * 60 * 1000) return `${Math.round(diff / (60 * 1000))}分钟后`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.round(diff / (60 * 60 * 1000))}小时后`;
  const days = Math.round(diff / (24 * 60 * 60 * 1000));
  return `${days}天后`;
}

function loadCards(): Card[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    // migrate from v3 (no paraType)
    const old = localStorage.getItem('collectify-v3');
    if (old) {
      try {
        const parsed = JSON.parse(old) as Card[];
        const migrated = parsed.map(c => ({
          ...c,
          links: c.links || [],
          paraType: (c as Card & { paraType?: PARAType }).paraType || 'note',
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      } catch { return []; }
    }
    return [];
  }
  try {
    const cards = JSON.parse(data) as Card[];
    const now = Date.now();
    // Migrate old 'archive' type to archived flag
    // Auto-archive expired flash notes (add "已过期" tag)
    return cards.map(card => {
      if ((card as any).paraType === 'archive') {
        return {
          ...card,
          paraType: 'note' as PARAType,
          archived: true,
          archivedAt: card.updatedAt,
        };
      }
      let result = { ...card, archived: card.archived || false };
      // Auto-archive expired flash notes
      if (result.paraType === 'flash' && result.flashExpiresAt && result.flashExpiresAt < now && !result.archived) {
        result.archived = true;
        result.archivedAt = result.flashExpiresAt;
        result.tags = [...(result.tags || []), '已过期'].filter(Boolean);
      }
      return result;
    });
  } catch { return []; }
}

function saveCards(cards: Card[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

// 从内容中解析 [[链接]]
export function parseLinks(content: string): string[] {
  const matches = content.match(/\[\[([^\]]+)\]\]/g) || [];
  return matches.map(m => m.slice(2, -2).trim());
}

// 解析内容中的 [[xxx]] 为可渲染片段
export interface ContentSegment {
  type: 'text' | 'link';
  text: string;
  cardId?: string;
}

export function parseContentWithLinks(content: string, cards: Card[]): ContentSegment[] {
  const segments: ContentSegment[] = [];
  const regex = /\[\[([^\]]+)\]\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', text: content.slice(lastIndex, match.index) });
    }
    const linkText = match[1].trim();
    const linkedCard = cards.find(c => 
      c.id === linkText || c.title === linkText
    );
    segments.push({ 
      type: 'link', 
      text: linkText,
      cardId: linkedCard?.id 
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'text', text: content.slice(lastIndex) });
  }

  return segments;
}

// 查找相似卡片（知识磁吸）
export function findSimilarCards(
  title: string, 
  content: string, 
  existingCards: Card[],
  threshold = 0.25
): { card: Card; similarity: number }[] {
  const newCard = { title, content };
  return existingCards
    .map(card => ({
      card,
      similarity: calculateSimilarity(newCard, card),
    }))
    .filter(x => x.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);
}

// 历史上的今天
export function getTimeCapsuleCards(cards: Card[]): Card[] {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const day = now.getDate();
  const thisYear = now.getFullYear();

  return cards
    .filter(card => {
      const d = new Date(card.createdAt);
      return d.getMonth() === month && d.getDate() === day && d.getFullYear() < thisYear;
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

// 获取本周时间范围
function getWeekRange(): { start: number; end: number } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 7);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday.getTime(), end: sunday.getTime() };
}

// PARA 状态流转顺序
export const PROJECT_STATUS_ORDER: ProjectStatus[] = ['idea', 'active', 'completed', 'review', 'archived'];
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  idea: '💡 构思',
  active: '🚀 进行中',
  completed: '✅ 已完成',
  review: '📋 审核',
  archived: '📦 归档',
};

export const useAppStore = create<AppState & {
  addCard: (title: string, content: string, tags: string[], links?: string[], paraType?: PARAType, parentId?: string) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  setActiveTag: (tag: string | null) => void;
  setActivePARA: (para: PARAType | null) => void;
  setHomeSection: (section: HomeSection) => void;
  openEditor: (card?: Card) => void;
  closeEditor: () => void;
  openQuickCapture: () => void;
  closeQuickCapture: () => void;
  openGraph: () => void;
  closeGraph: () => void;
  startReview: () => void;
  endReview: () => void;
  reviewCard: (card: Card, quality: number) => void;
  openSimilarPanel: (suggestions: { card: Card; similarity: number }[], pendingCard?: Card) => void;
  closeSimilarPanel: () => void;
  savePendingCard: () => void;
  openTimeCapsule: () => void;
  closeTimeCapsule: () => void;
  enterFlowMode: (card?: Card) => void;
  exitFlowMode: () => void;
  // 多层父子文档结构
  setPendingParentId: (id: string | null) => void;
  // PARA selectors
  filteredCards: Card[];
  dueCards: Card[];
  getNextReviewDate: (card: Card) => string;
  allTags: { tag: string; count: number }[];
  timeCapsuleCards: Card[];
  findSimilar: (title: string, content: string) => { card: Card; similarity: number }[];
  getFlashNotes: () => Card[];
  getTasks: () => Card[];
  getTodayTasks: () => Card[];
  getWeekTasks: () => Card[];
  getProjects: () => Card[];
  getAreas: () => Card[];
  getResources: () => Card[];
  getArchivedCards: () => Card[];
  getExpiredFlashNotes: () => Card[];
  getPARACounts: () => Record<PARAType, number>;
  advanceProjectStatus: (id: string) => void;
  convertFlashToTask: (id: string) => void;
  convertFlashToNote: (id: string) => void;
  archiveCard: (id: string) => void;
  restoreCard: (id: string) => void;
  linkTasksToProject: (projectId: string, taskIds: string[]) => void;
  unlinkTaskFromProject: (projectId: string, taskId: string) => void;
  linkNotesToProject: (projectId: string, noteIds: string[]) => void;
  linkResourcesToProject: (projectId: string, resourceIds: string[]) => void;
  linkTaskToArea: (taskId: string, areaId: string) => void;
  unlinkTaskFromArea: (taskId: string) => void;
  // CODE→PARA→Zettelkasten 新增 selectors
  getActiveProjects: () => Card[];
  getHabitCheckins: () => Card[];
  getUnorganizedFlashes: () => Card[];
  getDistillQueue: () => Card[];
  getFlashStats: () => { total: number; expired: number; urgent: number };
  convertFlashToProject: (id: string) => void;
  markHabitDone: (id: string) => void;
  updateCardAtomic: (id: string, updates: { isAtomic?: boolean; coreInsight?: string; relatedNotes?: string[] }) => void;
}>((set, get) => ({
  // Initial state
  cards: [],
  activeTag: null,
  isEditorOpen: false,
  editingCard: null,
  isQuickCaptureOpen: false,
  isGraphOpen: false,
  isReviewMode: false,
  similarSuggestions: [],
  isSimilarPanelOpen: false,
  pendingCardPayload: null as Card | null,
  isTimeCapsuleOpen: false,
  isFlowMode: false,
  activePARA: null,
  homeSection: 'home',
  // 多层父子文档结构
  pendingParentId: null,

  ...(typeof window !== 'undefined' && {
    cards: loadCards(),
  }),

  addCard: (title, content, tags, links = [], paraType: PARAType = 'note', parentId?: string) => {
    const now = Date.now();
    const card: Card = {
      id: uuidv4(),
      title,
      content,
      tags,
      links,
      createdAt: now,
      updatedAt: now,
      nextReviewAt: now + 24 * 60 * 60 * 1000,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      paraType,
      archived: false,
      // 父子文档结构
      parentId,
      depth: parentId ? ((get().cards.find(c => c.id === parentId)?.depth) ?? 0) + 1 : 0,
      // 闪念笔记自动设置 24h 过期
      ...(paraType === 'flash' ? { flashExpiresAt: now + 24 * 60 * 60 * 1000 } : {}),
    };
    let newCards = [card, ...get().cards];
    // 更新父卡片的 childIds
    if (parentId) {
      newCards = newCards.map(c =>
        c.id === parentId
          ? { ...c, childIds: [...(c.childIds || []), card.id] }
          : c
      );
    }
    set({ cards: newCards });
    saveCards(newCards);
  },

  updateCard: (id, updates) => {
    const newCards = get().cards.map(card =>
      card.id === id ? { ...card, ...updates, updatedAt: Date.now() } : card
    );
    set({ cards: newCards });
    saveCards(newCards);
  },

  deleteCard: (id) => {
    const card = get().cards.find(c => c.id === id);
    let newCards = get().cards.filter(c => c.id !== id);
    // 从父卡片的 childIds 中移除
    if (card?.parentId) {
      newCards = newCards.map(c =>
        c.id === card.parentId
          ? { ...c, childIds: (c.childIds || []).filter(cid => cid !== id) }
          : c
      );
    }
    set({ cards: newCards });
    saveCards(newCards);
  },

  setActiveTag: (tag) => set({ activeTag: tag }),
  setActivePARA: (para) => set({ activePARA: para }),
  setHomeSection: (section) => set({ homeSection: section }),

  openEditor: (card) => set({ 
    isEditorOpen: true, 
    editingCard: card || null 
  }),

  closeEditor: () => set({ 
    isEditorOpen: false, 
    editingCard: null 
  }),

  openQuickCapture: () => set({ isQuickCaptureOpen: true }),
  closeQuickCapture: () => set({ isQuickCaptureOpen: false, pendingParentId: null }),
  openGraph: () => set({ isGraphOpen: true }),
  closeGraph: () => set({ isGraphOpen: false }),
  startReview: () => set({ isReviewMode: true }),
  endReview: () => set({ isReviewMode: false }),

  openSimilarPanel: (suggestions, pendingCard?: Card) => set({ 
    similarSuggestions: suggestions, 
    isSimilarPanelOpen: true,
    pendingCardPayload: pendingCard || null,
  }),
  closeSimilarPanel: () => set({ isSimilarPanelOpen: false, similarSuggestions: [], pendingCardPayload: null }),
  savePendingCard: () => {
    const payload = get().pendingCardPayload;
    if (!payload) return;
    let newCards = [payload, ...get().cards];
    if (payload.parentId) {
      newCards = newCards.map(c =>
        c.id === payload.parentId
          ? { ...c, childIds: [...(c.childIds || []), payload.id] }
          : c
      );
    }
    set({ cards: newCards, pendingCardPayload: null });
    saveCards(newCards);
  },

  openTimeCapsule: () => set({ isTimeCapsuleOpen: true }),
  closeTimeCapsule: () => set({ isTimeCapsuleOpen: false }),

  enterFlowMode: (card) => set({ isFlowMode: true, editingCard: card || null, isEditorOpen: true }),
  exitFlowMode: () => set({ isFlowMode: false }),

  // 多层父子文档结构
  setPendingParentId: (id) => set({ pendingParentId: id }),

  reviewCard: (card, quality) => {
    const updatedCard = calculateNextReview(card, quality);
    const newCards = get().cards.map(c => 
      c.id === card.id ? updatedCard : c
    );
    set({ cards: newCards });
    saveCards(newCards);
  },

  // Derived state
  get filteredCards() {
    const { cards, activeTag, activePARA } = get();
    let result = cards.filter(card => !card.archived);
    if (activePARA) {
      result = result.filter(card => card.paraType === activePARA);
    }
    if (activeTag) {
      result = result.filter(card => 
        card.tags.some(tag => 
          tag === activeTag || tag.startsWith(activeTag + '/')
        )
      );
    }
    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  get dueCards() {
    const { cards } = get();
    const now = Date.now();
    return cards
      .filter(card => !card.archived && card.nextReviewAt && card.nextReviewAt <= now)
      .sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0));
  },

  getNextReviewDate,

  get allTags() {
    const { cards } = get();
    const tagCounts: Record<string, number> = {};
    cards.filter(c => !c.archived).forEach(card => {
      card.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  },

  get timeCapsuleCards() {
    return getTimeCapsuleCards(get().cards.filter(c => !c.archived));
  },

  get findSimilar() {
    const { cards } = get();
    return (title: string, content: string) => 
      findSimilarCards(title, content, cards.filter(c => !c.archived));
  },

  // PARA selectors
  getFlashNotes() {
    return get().cards
      .filter(c => !c.archived && c.paraType === 'flash')
      .sort((a, b) => (a.flashExpiresAt || 0) - (b.flashExpiresAt || 0));
  },

  getTasks() {
    return get().cards
      .filter(c => !c.archived && c.paraType === 'task' && !c.completed)
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return b.updatedAt - a.updatedAt;
      });
  },

  getTodayTasks() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;
    return get().cards
      .filter(c => !c.archived && c.paraType === 'task' && !c.completed && c.dueDate && c.dueDate >= startOfDay && c.dueDate <= endOfDay)
      .sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
  },

  getWeekTasks() {
    const { start, end } = getWeekRange();
    return get().cards
      .filter(c => !c.archived && c.paraType === 'task' && !c.completed && c.dueDate && c.dueDate >= start && c.dueDate <= end)
      .sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
  },

  getProjects() {
    return get().cards
      .filter(c => !c.archived && c.paraType === 'project')
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  getAreas() {
    return get().cards
      .filter(c => !c.archived && c.paraType === 'area')
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  getResources() {
    return get().cards
      .filter(c => !c.archived && c.paraType === 'resource')
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  getArchivedCards() {
    return get().cards
      .filter(c => c.archived)
      .sort((a, b) => (b.archivedAt || b.updatedAt) - (a.archivedAt || a.updatedAt));
  },

  getExpiredFlashNotes() {
    const now = Date.now();
    return get().cards
      .filter(c => !c.archived && c.paraType === 'flash' && c.flashExpiresAt && c.flashExpiresAt < now)
      .sort((a, b) => (a.flashExpiresAt || 0) - (b.flashExpiresAt || 0));
  },

  getPARACounts() {
    const counts: Record<PARAType, number> = {
      flash: 0, task: 0, note: 0, project: 0, area: 0, resource: 0,
    };
    get().cards.forEach(c => {
      if (!c.archived && counts[c.paraType] !== undefined) {
        counts[c.paraType]++;
      }
    });
    // task count = only incomplete tasks
    counts.task = get().cards.filter(c => !c.archived && c.paraType === 'task' && !c.completed).length;
    return counts;
  },

  advanceProjectStatus(id) {
    const card = get().cards.find(c => c.id === id);
    if (!card || card.paraType !== 'project') return;
    const current = card.projectStatus || 'idea';
    const idx = PROJECT_STATUS_ORDER.indexOf(current);
    if (idx < PROJECT_STATUS_ORDER.length - 1) {
      get().updateCard(id, { projectStatus: PROJECT_STATUS_ORDER[idx + 1] });
    }
  },

  convertFlashToTask(id) {
    get().updateCard(id, { 
      paraType: 'task', 
      flashExpiresAt: undefined,
      completed: false,
    });
  },

  convertFlashToNote(id) {
    get().updateCard(id, { 
      paraType: 'note', 
      flashExpiresAt: undefined,
      organizedFrom: 'flash',
      organizedAt: Date.now(),
    });
  },

  archiveCard(id) {
    get().updateCard(id, { archived: true, archivedAt: Date.now() });
  },

  restoreCard(id) {
    get().updateCard(id, { archived: false, archivedAt: undefined });
  },

  linkTasksToProject(projectId, taskIds) {
    // Update each task's projectId
    taskIds.forEach(taskId => {
      get().updateCard(taskId, { projectId });
    });
  },

  unlinkTaskFromProject(projectId, taskId) {
    get().updateCard(taskId, { projectId: undefined });
  },

  linkNotesToProject(projectId, noteIds) {
    // no-op: linkedNotes not a stored field
  },

  linkResourcesToProject(projectId, resourceIds) {
    // no-op: linkedResources not a stored field
  },

  linkTaskToArea(taskId, areaId) {
    get().updateCard(taskId, { areaId });
  },

  unlinkTaskFromArea(taskId) {
    get().updateCard(taskId, { areaId: undefined });
  },

  // CODE→PARA→Zettelkasten 新增 selectors 实现

  getActiveProjects() {
    return get().cards
      .filter(c => !c.archived && c.paraType === 'project' && c.projectStatus === 'active')
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  getHabitCheckins() {
    return get().cards
      .filter(c => !c.archived && c.habitCheckin === true && c.paraType === 'area')
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  getUnorganizedFlashes() {
    const now = Date.now();
    return get().cards
      .filter(c => !c.archived && c.paraType === 'flash' && c.flashExpiresAt && c.flashExpiresAt >= now)
      .sort((a, b) => (a.flashExpiresAt || 0) - (b.flashExpiresAt || 0));
  },

  getDistillQueue() {
    return get().cards
      .filter(c => !c.archived && c.paraType === 'note' && (c.isAtomic === false || c.isAtomic === undefined || !c.coreInsight))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  getFlashStats() {
    const now = Date.now();
    const allFlashes = get().cards.filter(c => !c.archived && c.paraType === 'flash' && c.flashExpiresAt);
    const expired = allFlashes.filter(c => c.flashExpiresAt && c.flashExpiresAt < now).length;
    const urgent = allFlashes.filter(c => {
      if (!c.flashExpiresAt || c.flashExpiresAt < now) return false;
      const hoursLeft = (c.flashExpiresAt - now) / (60 * 60 * 1000);
      return hoursLeft <= 4;
    }).length;
    return { total: allFlashes.length, expired, urgent };
  },

  convertFlashToProject(id) {
    get().updateCard(id, { 
      paraType: 'project', 
      flashExpiresAt: undefined,
      projectStatus: 'idea',
      organizedFrom: 'flash',
      organizedAt: Date.now(),
    });
  },

  markHabitDone(id) {
    get().updateCard(id, { habitCompletedToday: true });
  },

  updateCardAtomic(id, updates) {
    get().updateCard(id, updates);
  },
}));
