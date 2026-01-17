'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DocumentDuplicateIcon as Copy, CheckIcon as Check } from '@heroicons/react/24/outline';
import { useTelegramAlert } from '@/hooks/useTelegramAlert';
import { logError } from '@/lib/utils/logging';

interface VpnKeyCodeProps {
  value: string;
  ariaLabel?: string;
  className?: string;
  tooltipCopyText?: string;
  tooltipCopiedText?: string;
}

/**
 * Компонент для отображения и копирования VPN ключа
 * Показывает ключ в виде кода с возможностью копирования
 */
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
  const showAlert = useTelegramAlert();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (!value) return;

    const { copyToClipboard } = await import('@/lib/utils/clipboard');
    const copied = await copyToClipboard(value);
    
    if (copied) {
      setCopied(true);
      showAlert(tooltipCopiedText);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        setShowTooltip(false);
      }, 2000);
    } else {
      logError('Failed to copy', new Error('Clipboard API not available'), {
        action: 'copyToClipboard',
        component: 'VpnKeyCode'
      });
      showAlert('Не удалось скопировать');
    }
  };

  const handleMouseEnter = () => {
    if (!copied) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    if (!copied) {
      setShowTooltip(false);
    }
  };

  if (!value) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleCopy}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-full bg-black/40 rounded-[10px] p-4 flex items-center justify-between border border-white/5 hover:bg-black/60 active:bg-black/80 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 group"
        aria-label={ariaLabel}
        type="button"
      >
        <code className="text-[#F55128] text-base font-mono break-all pr-4 text-left">
          {value}
        </code>
        <div className="flex-shrink-0">
          {copied ? (
            <Check className="w-5 h-5 text-[#F55128]" aria-hidden="true" />
          ) : (
            <Copy className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" aria-hidden="true" />
          )}
        </div>
      </button>
      
      {showTooltip && !copied && (
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/90 text-black text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none z-10"
          role="tooltip"
        >
          {tooltipCopyText}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/90" />
        </div>
      )}
    </div>
  );
};

