// PARA 模块类型
export type PARAType = 'flash' | 'task' | 'note' | 'project' | 'area' | 'resource';
// 项目生命周期状态
export type ProjectStatus = 'idea' | 'active' | 'completed' | 'review' | 'archived';
// 任务优先级
export type TaskPriority = 'high' | 'medium' | 'low';
// 资源类型
export type ResourceType = 'article' | 'book' | 'video' | 'course';

export interface Card {
  id: string;
  title: string;
  content: string;
  tags: string[];
  // 双向链接：用 [[卡片ID]] 或 [[标题]] 引用其他卡片
  links: string[];
  createdAt: number;
  updatedAt: number;
  // Spaced repetition fields (SM-2)
  nextReviewAt?: number;
  interval?: number;
  easeFactor?: number;
  repetitions?: number;
  // PARA fields
  paraType: PARAType;
  // 闪念笔记：24h 过期时间戳
  flashExpiresAt?: number;
  // 任务：完成状态
  completed?: boolean;
  // 任务：截止日期
  dueDate?: number;
  // 任务：优先级
  priority?: TaskPriority;
  // 关联项目 ID
  projectId?: string;
  // 关联领域 ID
  areaId?: string;
  // 项目关联的其他卡片（数组形式）
  linkedTasks?: string[];
  linkedNotes?: string[];
  linkedResources?: string[];
  // 项目：生命周期状态
  projectStatus?: ProjectStatus;
  // 项目：截止日期
  projectDeadline?: number;
  // 资源：类型
  resourceType?: ResourceType;
  // 被哪些卡片引用
  referencedBy?: string[];

  // 归档状态
  archived: boolean;
  archivedAt?: number;

  // ===== 多层父子文档结构 =====
  parentId?: string;       // 父卡片ID，顶级卡片没有此字段
  childIds?: string[];     // 子卡片ID列表（冗余，用于快速查找）
  depth?: number;          // 层级深度（0=顶级，1=一级子文档...）

  // ===== CODE→PARA→Zettelkasten 新增字段 =====

  // 领域/习惯相关
  habitCheckin?: boolean;               // 是否为习惯打卡
  habitFrequency?: 'daily' | 'weekly'; // 习惯频率
  habitCompletedToday?: boolean;        // 今日是否已完成

  // 笔记提炼相关
  isAtomic?: boolean;                  // 是否已原子化
  coreInsight?: string;                // 核心洞见一句话
  relatedNotes?: string[];             // 关联笔记ID列表（Relation）

  // 整理状态
  organizedFrom?: 'flash';              // 来源：是否从闪念整理而来
  organizedAt?: number;                 // 整理时间

  // 任务扩展
  participants?: string;               // 参与人（逗号分隔字符串）
  location?: string;                   // 任务地点
  startDate?: number;                  // 任务开始日期
  resourceIds?: string[];              // 关联资源ID列表
  url?: string;                        // 资源链接
  source?: string;                     // 资源来源标记
  reviewEnabled?: boolean;              // 定期复盘提醒开关
  reviewDate?: string;                  // 定期复盘日期（ISO字符串）
}

// 计算两个卡片的相似度（基于标题+内容的词重叠）
export function calculateSimilarity(a: { title: string; content: string }, b: { title: string; content: string }): number {
  const tokenize = (text: string) => {
    return text.toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  };
  
  const tokensA = new Set(tokenize(a.title + ' ' + a.content));
  const tokensB = new Set(tokenize(b.title + ' ' + b.content));
  
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  
  let intersection = 0;
  tokensA.forEach(t => {
    if (tokensB.has(t)) intersection++;
  });
  
  const union = tokensA.size + tokensB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

export type HomeSection = 'home' | 'organize' | 'tags' | 'distill' | 'task' | 'note' | 'project' | 'area' | 'resource' | 'archived' | 'flash';

export interface AppState {
  cards: Card[];
  activeTag: string | null;
  isEditorOpen: boolean;
  editingCard: Card | null;
  isQuickCaptureOpen: boolean;
  isGraphOpen: boolean;
  isReviewMode: boolean;
  // 相似卡片检测
  similarSuggestions: { card: Card; similarity: number }[];
  isSimilarPanelOpen: boolean;
  // 历史上的今天
  isTimeCapsuleOpen: boolean;
  // 心流写作
  isFlowMode: boolean;
  // PARA 导航 - 保持兼容，但推荐使用 homeSection
  activePARA: PARAType | null;
  // CODE→PARA 首页导航
  homeSection: HomeSection;
  // 多层父子文档结构
  pendingParentId: string | null;   // 创建子文档时待设置的父卡片ID
}