import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { UI_CONSTANTS } from '@/lib/constants';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * Универсальный компонент BottomSheet с поддержкой жестов закрытия (drag-to-dismiss)
 * и плавной анимации появления контента.
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Управление жизненным циклом модалки и блокировкой скролла
  useEffect(() => {
    if (isOpen) {
      // Используем setTimeout для избежания синхронного setState
      const mountTimer = setTimeout(() => {
        setMounted(true);
        document.body.style.overflow = 'hidden';
        // Двойной rAF гарантирует, что браузер успеет отрисовать начальное состояние (mounted: true)
        // перед тем, как мы запустим анимацию (open: true)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setOpen(true);
            // Фокусируемся на кнопке закрытия для accessibility
            closeButtonRef.current?.focus();
          });
        });
      }, 0);
      
      return () => {
        clearTimeout(mountTimer);
      };
    } else {
      // Используем setTimeout для избежания синхронного setState
      const closeTimer = setTimeout(() => {
        setOpen(false);
      }, 0);
      
      const unmountTimer = setTimeout(() => {
        setMounted(false);
        document.body.style.overflow = 'unset';
      }, 850); // Должно совпадать с --dialog-animation-speed в globals.css
      
      return () => {
        clearTimeout(closeTimer);
        clearTimeout(unmountTimer);
      };
    }
  }, [isOpen]);

  // Обработка клавиатуры (Escape для закрытия)
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      // Ловим Tab для trap focus внутри модалки
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  // Обработчики жестов (Pointer Events для универсальности touch/mouse)
  const onPointerDown = (e: React.PointerEvent) => {
    // Начинаем перетаскивание только если нажали на шапку или handle
    if (contentRef.current && (e.target as Node).contains(contentRef.current)) return;
    
    startY.current = e.clientY;
    setIsDragging(true);
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startY.current;
    
    // Эффект "резиновой ленты" при попытке тянуть вверх
    if (deltaY < 0) {
      currentY.current = deltaY * 0.2;
    } else {
      currentY.current = deltaY;
    }
    setDragY(currentY.current);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const target = e.currentTarget as HTMLElement;
    target.releasePointerCapture(e.pointerId);
    
    // Если потянули вниз более чем на пороговое значение — закрываем
    if (currentY.current > UI_CONSTANTS.DRAG_THRESHOLD) {
      onClose();
    }
    
    // Сбрасываем смещение
    setDragY(0);
    currentY.current = 0;
  };

  if (!mounted) return null;

  return (
    <div 
      ref={dialogRef}
      className={`css-dialog ${open ? 'open' : ''}`}
      style={{ 
        visibility: mounted ? 'visible' : 'hidden',
        pointerEvents: open ? 'auto' : 'none'
      } as React.CSSProperties}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bottom-sheet-title"
      aria-hidden={!open}
    >
      {/* Затемнение фона (Backdrop) */}
      <div 
        className="css-dialog_backdrop" 
        onClick={onClose}
        style={{ 
          opacity: isDragging ? Math.max(0, 1 - dragY / 400) : undefined,
          transition: isDragging ? 'none' : undefined 
        }}
      />
      
      {/* Внутренний контейнер модалки */}
      <div 
        className={`css-dialog_inner shadow-2xl border-t border-x border-white/5 flex flex-col max-h-[92vh] font-sans ${isDragging ? 'no-transition' : ''}`}
        style={{ 
          transform: isDragging 
            ? `translate3d(0, ${dragY}px, 0)` 
            : `translate3d(0, ${open ? '0' : '100%'}, 0)`,
          willChange: 'transform'
        }}
      >
        {/* Область захвата (Handle + Title) */}
        <div 
          className="shrink-0 cursor-grab active:cursor-grabbing select-none touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Визуальный индикатор (Handle) */}
          <div className="flex justify-center py-3">
            <div className="w-10 h-1 bg-white/10 rounded-full" />
          </div>

          {/* Заголовок и кнопка закрытия */}
          <div className="flex items-center justify-between px-6 pb-4 border-b border-white/5">
            <h2 
              id="bottom-sheet-title"
              className="text-xl font-medium text-white pointer-events-none"
            >
              {title}
            </h2>
            <button 
              ref={closeButtonRef}
              onPointerDown={(e) => e.stopPropagation()} // Предотвращаем срабатывание захвата свайпа на кнопке
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/60 hover:text-white pointer-events-auto focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label={`Закрыть ${title}`}
              type="button"
            >
              <X size={24} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Скроллируемая область контента */}
        <div 
          className="overflow-y-auto custom-scrollbar p-6 touch-auto" 
          ref={contentRef}
          role="document"
          aria-label={`Содержимое ${title}`}
        >
          {children}
          {/* Отступ снизу для красоты */}
          <div className="h-10 shrink-0" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};
