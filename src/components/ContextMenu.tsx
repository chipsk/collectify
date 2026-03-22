'use client';

import { useState, useEffect, useRef } from 'react';
import { MoreHorizontal } from 'lucide-react';

export interface MenuItem {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  dividerBefore?: boolean;
}

interface ContextMenuProps {
  items: MenuItem[];
  triggerClassName?: string;
  menuClassName?: string;
  menuWidth?: number;
}

export default function ContextMenu({
  items,
  triggerClassName = '',
  menuClassName = '',
  menuWidth = 220,
}: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const approxMenuHeight = items.filter(i => !i.dividerBefore).length * 40 + 16;

      let x = rect.right + 8;
      let y = rect.top;

      if (x + menuWidth > viewportWidth - 8) {
        x = rect.left - menuWidth - 8;
      }
      if (x < 8) x = 8;
      if (y + approxMenuHeight > viewportHeight - 8) {
        y = viewportHeight - approxMenuHeight - 8;
      }
      if (y < 8) y = 8;

      setPosition({ x, y });
    }
    setIsOpen(true);
  };

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;
    item.onClick();
    closeMenu();
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={openMenu}
        className={`p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors ${triggerClassName}`}
        onMouseDown={e => e.preventDefault()}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className={`fixed z-[100] bg-white rounded-2xl shadow-2xl border border-stone-100 py-1.5 min-w-[200px] animate-in fade-in zoom-in-95 duration-100 origin-top-left ${menuClassName}`}
          style={{ left: position.x, top: position.y, width: menuWidth }}
          onMouseDown={e => e.stopPropagation()}
        >
          {items.map((item, idx) => {
            if (item.dividerBefore) {
              return (
                <div key={`divider-${idx}`} className="border-t border-stone-100 my-1.5" />
              );
            }
            return (
              <button
                key={idx}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  item.disabled
                    ? 'text-stone-300 cursor-not-allowed'
                    : item.danger
                    ? 'text-red-500 hover:bg-red-50'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span className={`w-4 h-4 shrink-0 ${item.danger ? 'text-red-400' : 'text-stone-400'}`}>
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.shortcut && (
                  <span className="text-xs text-stone-400 ml-auto">{item.shortcut}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
