import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
  lines?: number;
}

/**
 * Компонент skeleton loader для имитации загрузки контента
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines,
}) => {
  const baseClasses = 'animate-pulse bg-white/10 rounded';

  if (variant === 'text' && lines) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
            style={{ height: height || '1rem' }}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  if (variant === 'circular') {
    return (
      <div
        className={`${baseClasses} ${className}`}
        style={{
          width: width || '3rem',
          height: height || width || '3rem',
          borderRadius: '50%',
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={`${baseClasses} ${className}`}
      style={{
        width: width || '100%',
        height: height || '1rem',
      }}
      aria-hidden="true"
    />
  );
};

/**
 * Skeleton для карточки подписки
 */
export const SubscriptionCardSkeleton: React.FC = () => {
  return (
    <div className="bg-[#121212] rounded-[16px] p-6 border border-white/10 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <SkeletonLoader variant="text" lines={1} width="40%" height="1.5rem" />
        <SkeletonLoader variant="circular" width="2rem" height="2rem" />
      </div>
      <SkeletonLoader variant="text" lines={2} />
    </div>
  );
};

/**
 * Skeleton для кнопки
 */
export const ButtonSkeleton: React.FC<{ fullWidth?: boolean }> = ({ fullWidth = true }) => {
  return (
    <SkeletonLoader
      variant="rectangular"
      width={fullWidth ? '100%' : 'auto'}
      height="3rem"
      className="rounded-[10px]"
    />
  );
};

