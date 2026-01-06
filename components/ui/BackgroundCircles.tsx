import React, { memo } from 'react';

interface BackgroundCirclesProps {
  children?: React.ReactNode;
}

/**
 * Оптимизированный компонент фоновых кругов
 * Мемоизирован для предотвращения лишних ререндеров
 */
export const BackgroundCircles = memo<BackgroundCirclesProps>(({ children }) => {
  return (
    <div className="absolute top-0 left-0 right-0 h-[420px] flex items-end justify-center opacity-100 pointer-events-none">
      <div className="absolute w-[560px] h-[560px] border border-white/40 rounded-full flex flex-col items-center justify-center">
        <div className="relative w-32 h-32 flex items-center justify-center">
          {children}
        </div>
      </div>
      <div className="absolute w-[450px] h-[450px] border border-white/30 rounded-full" />
      <div className="absolute w-[600px] h-[600px] border border-white/20 rounded-full opacity-80" />
      <div className="absolute w-[360px] h-[360px] border border-white/10 rounded-full flex flex-col items-center justify-center" />
    </div>
  );
});

BackgroundCircles.displayName = 'BackgroundCircles';

