'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface CalendarViewProps {
  className?: string;
}

interface CalendarItem {
  id: string;
  title: string;
  paraType: 'task' | 'project' | 'area';
  dueDate?: number;
  projectDeadline?: number;
  completed?: boolean;
  habitCompletedToday?: boolean;
}

export default function CalendarView({ className = '' }: CalendarViewProps) {
  const { cards, openEditor } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const today = new Date();
  const todayStr = today.toDateString();

  // Weekday labels
  const weekdays = ['一', '二', '三', '四', '五', '六', '日'];

  // Navigate months
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Get calendar grid data
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of month and total days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    // Day of week for first day (0=Sun, convert to Mon-based)
    let startWeekday = firstDay.getDay();
    startWeekday = startWeekday === 0 ? 6 : startWeekday - 1; // Convert to Mon=0

    // Build grid cells
    const cells: Array<{ date: number | null; isToday: boolean; isWeekend: boolean }> = [];

    // Padding before first day
    for (let i = 0; i < startWeekday; i++) {
      cells.push({ date: null, isToday: false, isWeekend: false });
    }

    // Days of month
    for (let d = 1; d <= totalDays; d++) {
      const cellDate = new Date(year, month, d);
      const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
      const isToday = cellDate.toDateString() === todayStr;
      cells.push({ date: d, isToday, isWeekend });
    }

    // Fill remaining cells to complete 6 rows (42 cells)
    while (cells.length < 42) {
      cells.push({ date: null, isToday: false, isWeekend: false });
    }

    return cells;
  }, [currentMonth, todayStr]);

  // Get items for current month
  const monthItems = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const items: CalendarItem[] = [];

    cards.forEach(card => {
      if (card.archived) return;

      // Tasks with due dates
      if (card.paraType === 'task' && card.dueDate) {
        const d = new Date(card.dueDate);
        if (d.getFullYear() === year && d.getMonth() === month) {
          items.push({
            id: card.id,
            title: card.title,
            paraType: 'task',
            dueDate: card.dueDate,
            completed: card.completed,
          });
        }
      }

      // Projects with deadlines
      if (card.paraType === 'project' && card.projectDeadline) {
        const d = new Date(card.projectDeadline);
        if (d.getFullYear() === year && d.getMonth() === month) {
          items.push({
            id: card.id,
            title: card.title,
            paraType: 'project',
            projectDeadline: card.projectDeadline,
          });
        }
      }

      // Areas with habit checkin enabled (show today's completion)
      if (card.paraType === 'area' && card.habitCheckin) {
        const d = new Date();
        if (d.getFullYear() === year && d.getMonth() === month) {
          items.push({
            id: card.id,
            title: card.title,
            paraType: 'area',
            habitCompletedToday: card.habitCompletedToday,
          });
        }
      }
    });

    return items;
  }, [cards, currentMonth]);

  // Group items by day
  const itemsByDate = useMemo(() => {
    const map = new Map<number, CalendarItem[]>();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    monthItems.forEach(item => {
      let dateNum: number;
      if (item.dueDate) {
        dateNum = new Date(item.dueDate).getDate();
      } else if (item.projectDeadline) {
        dateNum = new Date(item.projectDeadline).getDate();
      } else {
        // For habits, show on today's date only
        dateNum = today.getDate();
      }

      if (!map.has(dateNum)) {
        map.set(dateNum, []);
      }
      map.get(dateNum)!.push(item);
    });

    return map;
  }, [monthItems, currentMonth, today]);

  // Selected date items
  const selectedItems = useMemo(() => {
    if (selectedDate === null) return [];
    return itemsByDate.get(selectedDate) || [];
  }, [selectedDate, itemsByDate]);

  const monthLabel = currentMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-stone-100 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-stone-400" />
          <span className="font-semibold text-stone-700">{monthLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors text-stone-500 hover:text-stone-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToToday}
            className="px-2 py-1 text-xs text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            今天
          </button>
          <button
            onClick={nextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors text-stone-500 hover:text-stone-700"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 mb-1">
        {weekdays.map((day, i) => (
          <div key={i} className="text-center text-xs text-stone-400 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarData.map((cell, idx) => {
          const items = cell.date ? itemsByDate.get(cell.date) || [] : [];
          const hasItems = items.length > 0;
          const hasOverdue = items.some(item => {
            if (item.dueDate) {
              const due = new Date(item.dueDate);
              const now = new Date();
              return due < now && !item.completed;
            }
            return false;
          });

          return (
            <div
              key={idx}
              className="relative"
              onMouseEnter={() => cell.date && setHoveredDate(cell.date)}
              onMouseLeave={() => setHoveredDate(null)}
              onClick={() => cell.date && hasItems && setSelectedDate(selectedDate === cell.date ? null : cell.date)}
            >
              {/* Date cell */}
              <div
                className={`
                  min-h-[52px] border rounded-lg p-1 transition-all cursor-default
                  ${cell.date === null ? 'border-transparent' : ''}
                  ${cell.isToday ? 'bg-amber-50 border-amber-200' : 'border-stone-100'}
                  ${cell.date !== null && !cell.isToday ? 'hover:bg-stone-50' : ''}
                  ${cell.date !== null && hasItems ? 'cursor-pointer' : ''}
                `}
              >
                {cell.date !== null && (
                  <>
                    <div className={`text-xs font-medium mb-0.5 ${
                      cell.isToday ? 'text-amber-600' : cell.isWeekend ? 'text-stone-400' : 'text-stone-600'
                    }`}>
                      {cell.date}
                    </div>

                    {/* Item dots */}
                    {hasItems && (
                      <div className="flex flex-wrap gap-0.5 mt-0.5">
                        {items.slice(0, 3).map((item, i) => (
                          <div
                            key={item.id}
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.paraType === 'task'
                                ? item.completed ? 'bg-stone-300' : 'bg-teal-400'
                                : item.paraType === 'project'
                                ? 'bg-indigo-400'
                                : item.habitCompletedToday ? 'bg-green-400' : 'bg-stone-200'
                            }`}
                          />
                        ))}
                        {items.length > 3 && (
                          <span className="text-[8px] text-stone-400 leading-none">+{items.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Overdue indicator */}
                    {hasOverdue && (
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-400" />
                    )}
                  </>
                )}
              </div>

              {/* Hover preview */}
              {cell.date !== null && hasItems && hoveredDate === cell.date && (
                <div className="hidden group-hover:block absolute z-20 left-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-stone-200 p-3 text-xs">
                  <p className="font-semibold text-stone-700 mb-2">{cell.date}日</p>
                  {items.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 mb-1.5 cursor-pointer hover:bg-stone-50 p-1 -mx-1 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        const card = cards.find(c => c.id === item.id);
                        if (card) openEditor(card);
                      }}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        item.paraType === 'task'
                          ? item.completed ? 'bg-stone-300' : 'bg-teal-400'
                          : item.paraType === 'project'
                          ? 'bg-indigo-400'
                          : item.habitCompletedToday ? 'bg-green-400' : 'bg-stone-200'
                      }`} />
                      <span className={`truncate flex-1 ${
                        item.paraType === 'task' && item.completed ? 'text-stone-400 line-through' : 'text-stone-600'
                      }`}>
                        {item.title}
                      </span>
                      {item.paraType === 'task' && !item.completed && (
                        <span className="text-[10px] text-teal-500">任务</span>
                      )}
                      {item.paraType === 'project' && (
                        <span className="text-[10px] text-indigo-500">项目</span>
                      )}
                      {item.paraType === 'area' && (
                        <span className="text-[10px] text-green-500">打卡</span>
                      )}
                    </div>
                  ))}
                  {items.length > 3 && (
                    <p className="text-stone-400 mt-1 pt-1 border-t border-stone-100">
                      还有 {items.length - 3} 项...
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-stone-100">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
          <span className="text-[10px] text-stone-400">任务</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <span className="text-[10px] text-stone-400">项目</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[10px] text-stone-400">打卡</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <span className="text-[10px] text-stone-400">过期</span>
        </div>
      </div>

      {/* Selected date detail panel */}
      {selectedDate !== null && selectedItems.length > 0 && (
        <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-stone-700">{selectedDate}日</p>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-stone-400 hover:text-stone-600 text-xs"
            >
              关闭
            </button>
          </div>
          <div className="space-y-1.5">
            {selectedItems.map(item => {
              const card = cards.find(c => c.id === item.id);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 bg-white rounded-lg cursor-pointer hover:bg-white hover:shadow-sm transition-all"
                  onClick={() => card && openEditor(card)}
                >
                  <span className={`w-1.5 h-4 rounded-full flex-shrink-0 ${
                    item.paraType === 'task'
                      ? item.completed ? 'bg-stone-300' : 'bg-teal-400'
                      : item.paraType === 'project'
                      ? 'bg-indigo-400'
                      : item.habitCompletedToday ? 'bg-green-400' : 'bg-stone-200'
                  }`} />
                  <span className={`flex-1 text-xs truncate ${
                    item.paraType === 'task' && item.completed ? 'text-stone-400 line-through' : 'text-stone-600'
                  }`}>
                    {item.title}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    item.paraType === 'task' ? 'bg-teal-50 text-teal-600' :
                    item.paraType === 'project' ? 'bg-indigo-50 text-indigo-600' :
                    'bg-green-50 text-green-600'
                  }`}>
                    {item.paraType === 'task' ? '任务' :
                     item.paraType === 'project' ? '项目' : '打卡'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
