import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

/**
 * Компонент индикатора загрузки
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  text 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`${sizeClasses[size]} border-2 border-white/20 border-t-[#F55128] rounded-full animate-spin`}
        role="status"
        aria-label="Загрузка"
      />
      {text && (
        <p className="text-white/60 text-sm font-medium">{text}</p>
      )}
    </div>
  );
};

