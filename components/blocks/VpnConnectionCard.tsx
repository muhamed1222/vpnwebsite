'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, Key, Globe, RefreshCw, AlertCircle } from 'lucide-react';
import { VpnKeyCode } from '@/components/ui/VpnKeyCode';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getTelegramWebApp } from '@/lib/telegram';

/**
 * Компонент для отображения VPN ключа и QR кода
 * Позволяет пользователю скопировать ключ или отсканировать QR код
 */
export const VpnConnectionCard: React.FC = () => {
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [vpnKey, setVpnKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVpnKey = async () => {
    setLoading(true);
    setError(null);
    setQrDataUrl(null);
    setQrError(null);

    try {
      const data = await api.getUserConfig();
      if (data.ok && data.config) {
        setVpnKey(data.config);
      } else {
        setVpnKey(null);
        setError('VPN ключ недоступен');
      }
    } catch (err) {
      console.error('Error loading VPN key:', err);
      setVpnKey(null);
      setError('Не удалось загрузить VPN ключ. Попробуйте обновить страницу.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVpnKey();
  }, []);

  useEffect(() => {
    let active = true;

    const generateQr = async () => {
      if (!showQR || !vpnKey) {
        setQrDataUrl(null);
        setQrError(null);
        return;
      }

      try {
        // Динамический импорт qrcode для оптимизации размера бандла
        const QRCodeModule = await import('qrcode');
        const QRCode = QRCodeModule.default || QRCodeModule;
        const url = await QRCode.toDataURL(vpnKey, {
          width: 256,
          margin: 2,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        if (active) {
          setQrDataUrl(url);
          setQrError(null);
        }
      } catch (error) {
        console.error('Ошибка при генерации QR:', error);
        if (active) {
          setQrError('Не удалось сгенерировать QR код');
        }
      }
    };

    generateQr();
    return () => {
      active = false;
    };
  }, [showQR, vpnKey]);

  if (loading) {
    return (
      <div className="bg-[#121212] rounded-[16px] p-5 border border-white/5">
        <LoadingSpinner size="md" text="Загрузка VPN ключа..." />
      </div>
    );
  }

  if (error || !vpnKey) {
    return (
      <div className="bg-[#121212] rounded-[16px] p-5 border border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
            <AlertCircle size={20} className="text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-medium text-white mb-1">Ошибка загрузки</h3>
            <p className="text-white/60 text-xs">{error || 'VPN ключ недоступен'}</p>
          </div>
        </div>
        <button
          onClick={loadVpnKey}
          className="w-full bg-[#F55128] hover:bg-[#d43d1f] active:scale-[0.98] transition-all rounded-[10px] py-3 px-4 text-white font-medium flex items-center justify-center gap-2"
          type="button"
        >
          <RefreshCw size={18} />
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#121212] rounded-[16px] p-5 border border-white/5">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#F55128]/10 rounded-xl flex items-center justify-center border border-[#F55128]/20">
            <Key size={20} className="text-[#F55128]" />
          </div>
          <div>
            <h3 className="text-base font-medium text-white">VPN ключ</h3>
            <p className="text-white/40 text-xs">Используйте для подключения</p>
          </div>
        </div>
        <button
          onClick={() => setShowQR(!showQR)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
          aria-label={showQR ? 'Скрыть QR код' : 'Показать QR код'}
          type="button"
        >
          <QrCode size={20} className={`text-white/60 transition-colors ${showQR ? 'text-[#F55128]' : ''}`} />
        </button>
      </div>

      {/* VPN ключ */}
      <div className="mb-4">
        <VpnKeyCode
          value={vpnKey}
          ariaLabel="VPN ключ для подключения. Нажмите для копирования"
          tooltipCopyText="Нажмите для копирования"
          tooltipCopiedText="Ключ скопирован!"
        />
      </div>

      {/* QR код */}
      {showQR && (
        <div className="mt-6 pt-6 border-t border-white/5">
          <div className="flex flex-col items-center">
            <h4 className="text-sm font-medium text-white/90 mb-4 flex items-center gap-2">
              <Globe size={18} />
              QR код для быстрого подключения
            </h4>
            {qrError ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] p-4 text-center">
                <p className="text-red-500 text-sm">{qrError}</p>
              </div>
            ) : qrDataUrl ? (
              <div className="bg-white p-4 rounded-[10px] border border-white/10">
                <img
                  src={qrDataUrl}
                  alt="QR код VPN ключа"
                  className="w-64 h-64"
                  aria-label="QR код для сканирования VPN ключа"
                />
              </div>
            ) : (
              <div className="w-64 h-64 bg-white/5 rounded-[10px] flex items-center justify-center border border-white/10">
                <LoadingSpinner size="md" text="Генерация QR кода..." />
              </div>
            )}
            <p className="text-white/40 text-xs mt-4 text-center max-w-xs">
              Отсканируйте QR код в приложении VPN для автоматического подключения
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

