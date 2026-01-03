import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { apiService, ApiUserStatus } from '../services/apiService';
import { toast } from 'react-hot-toast';

// Форматирование байтов
const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const UsageChartCard: React.FC = () => {
  const { subscription } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ApiUserStatus | null>(null);

  const loadBillingData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);

    try {
      const data = await apiService.getUserStatus();
      if (data.ok) {
        setStats(data);
        if (isRefresh) {
          toast.success('Данные обновлены', {
            style: {
              background: 'var(--fg-4)',
              color: 'var(--background)',
              borderRadius: '12px',
            }
          });
        }
      } else {
        setError('Не удалось загрузить данные.');
      }
    } catch (err) {
      console.error('Ошибка при загрузке данных биллинга:', err);
      setError('Не удалось загрузить данные.');
      if (isRefresh) toast.error('Ошибка при обновлении');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, [subscription]);

  const handleRefresh = () => loadBillingData(true);

  return (
    <div className="card-ref p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-medium text-fg-4 mb-1">Использование трафика</h3>
          <p className="text-sm text-fg-2">Актуальные данные вашего потребления</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="p-2 hover:bg-bg-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Обновить данные"
        >
          <RefreshCw 
            size={16} 
            className={`text-fg-3 ${refreshing ? 'animate-spin' : ''}`} 
          />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[var(--warning-bg)] border border-[var(--warning-border)] rounded-lg flex items-start gap-2" role="alert">
          <AlertCircle size={16} className="text-[var(--warning-text)] mt-0.5 shrink-0" />
          <p className="text-xs text-[var(--warning-text)]">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <div className="h-12 bg-bg-2 rounded-lg animate-pulse" />
          <div className="h-12 bg-bg-2 rounded-lg animate-pulse" />
        </div>
      ) : stats ? (
        <div className="space-y-2">
          <UsageItem 
            label="Использовано" 
            value={formatBytes(stats.usedTraffic)} 
            color="var(--accent)" 
          />
          <UsageItem 
            label="Лимит" 
            value={stats.dataLimit > 0 ? formatBytes(stats.dataLimit) : 'Безлимитно'} 
          />
        </div>
      ) : (
        <div className="p-4 bg-bg-2 rounded-lg text-center text-sm text-fg-2">
          Нет данных об использовании
        </div>
      )}
    </div>
  );
};

const UsageItem = ({ label, value, color }: { label: string, value: string, color?: string }) => (
  <div className="flex items-center justify-between p-4 rounded-lg bg-bg-2 text-sm font-medium transition-colors hover:bg-bg-3">
    <div className="flex items-center gap-3 text-fg-3">
      {color && (
        <div 
          className="w-2.5 h-2.5 rounded-full shrink-0" 
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </div>
    <span className="text-fg-4 font-semibold">{value}</span>
  </div>
);
