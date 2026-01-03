import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

interface VpnKeyCodeProps {
  value: string;
  ariaLabel?: string;
  className?: string;
  tooltipCopyText?: string;
  tooltipCopiedText?: string;
}

export const VpnKeyCode: React.FC<VpnKeyCodeProps> = ({
  value,
  ariaLabel = 'VPN ключ. Нажмите для копирования',
  className = '',
  tooltipCopyText = 'Скопировать',
  tooltipCopiedText = 'Скопировано!',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(tooltipCopiedText, {
        duration: 2000,
        style: {
          background: 'var(--fg-4)',
          color: 'var(--background)',
          fontSize: '12px',
          fontWeight: 'bold',
          borderRadius: '12px',
        },
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Ошибка при копировании:', error);
      toast.error('Ошибка при копировании');
    }
  };

  return (
    <div 
      className="flex-1 relative group/copy cursor-pointer"
      onClick={handleCopy}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {copied ? 'Ключ скопирован в буфер обмена' : ''}
      </div>
      <code
        className={`block text-xs font-mono text-fg-3 break-words break-all min-w-0 leading-relaxed select-all group-hover/copy:text-fg-4 transition-colors ${className}`}
        aria-label={ariaLabel}
      >
        {value}
      </code>
      {showTooltip && value && !copied && (
        <div
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[var(--fg-4)] text-[var(--background)] text-[10px] font-medium rounded whitespace-nowrap pointer-events-none z-50 shadow-lg"
          style={{
            opacity: showTooltip ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
        >
          {tooltipCopyText}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-[var(--fg-4)]"></div>
        </div>
      )}
    </div>
  );
};
