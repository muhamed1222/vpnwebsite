import React, { useState, useEffect } from 'react';
import { QrCode, Key, Globe } from 'lucide-react';
import { useVpnKey } from '../hooks/useVpnKey';
import { VpnKeyCode } from './VpnKeyCode';
import { SERVER_LOCATION } from '../constants';

export const VpnConnectionCard: React.FC = () => {
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const { vpnKey, loading, error, reload } = useVpnKey();

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
        const QRCode = await import('qrcode');
        const url = await QRCode.toDataURL(vpnKey, {
          width: 192,
          margin: 1,
          errorCorrectionLevel: 'M',
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

  return (
    <>
      {/* Карточка "Ваше подключение" */}
      <div className="card-ref flex flex-col mb-6">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center" aria-hidden="true">
                <Key size={20} className="text-[var(--primary)]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-fg-4">Ваше подключение</h3>
                <p className="text-xs text-fg-2">Единый ключ для всех стран доступа</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-2 border border-border" title="Ваш ключ работает во всех доступных странах">
                <span className="text-[14px]">{SERVER_LOCATION.emoji}</span>
                <span className="text-[11px] font-bold text-fg-3">Все локации</span>
              </div>
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--success-bg)]"
                role="status"
                aria-label="Статус подключения: Активно"
              >
                <div className="w-2 h-2 rounded-full bg-[var(--success-text)]" aria-hidden="true"></div>
                <span className="text-[11px] font-medium text-[var(--success-text)]">Активно</span>
              </div>
            </div>
          </div>

          <div className="bg-bg-2 rounded-lg p-4">
            {error ? (
              <div className="py-3">
                <div className="flex items-center gap-2 text-xs text-[var(--danger-text)] mb-2" role="alert">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => {
                    reload();
                  }}
                  className="text-xs text-[var(--primary)] font-medium hover:underline"
                >
                  Попробовать снова
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {loading ? (
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-bg-3 rounded animate-pulse w-3/4"></div>
                      <div className="h-4 bg-bg-3 rounded animate-pulse w-1/2"></div>
                    </div>
                  ) : vpnKey ? (
                    <VpnKeyCode value={vpnKey} />
                  ) : (
                    <div className="flex-1 text-xs text-fg-2">VPN ключ недоступен</div>
                  )}
                  <div className="flex items-center gap-2 shrink-0">
                    {!loading && vpnKey && (
                      <button
                        onClick={() => setShowQR(!showQR)}
                        className={`p-2 hover:bg-bg-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 ${showQR ? 'bg-bg-3' : ''}`}
                        aria-label={showQR ? 'Скрыть QR код' : 'Показать QR код'}
                        aria-pressed={showQR}
                        title={showQR ? 'Скрыть QR код' : 'Показать QR код'}
                      >
                        <QrCode size={16} className="text-fg-3" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                {showQR && vpnKey && (
                  <div className="mt-4 pt-4 border-t border-border flex justify-center" role="region" aria-label="QR код VPN ключа">
                    <div className="w-48 h-48 bg-[var(--background)] p-4 rounded-lg border border-border">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="QR код VPN ключа"
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-bg-2 rounded flex items-center justify-center text-xs text-fg-2">
                          {qrError || 'Генерация QR кода...'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
