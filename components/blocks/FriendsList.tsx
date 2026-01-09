'use client';

import React, { useMemo } from 'react';
import { ReferralFriend } from '@/types/contest';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface FriendsListProps {
  friends: ReferralFriend[];
}

/**
 * Компонент для отображения списка друзей в конкурсе
 */
export const FriendsList: React.FC<FriendsListProps> = ({ friends }) => {
  // Группируем друзей только если их больше 5
  const shouldGroup = friends.length > 5;
  
  const groupedFriends = useMemo(() => {
    if (!shouldGroup) return null;
    
    const grouped: Record<string, ReferralFriend[]> = {
      qualified: [],
      bound: [],
      not_qualified: [],
      blocked: [],
    };

    friends.forEach(friend => {
      if (friend.status in grouped) {
        grouped[friend.status].push(friend);
      }
    });

    return grouped;
  }, [friends, shouldGroup]);
  const getStatusIcon = (status: ReferralFriend['status']) => {
    switch (status) {
      case 'qualified':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'bound':
        return <ClockIcon className="w-6 h-6 text-yellow-500" />;
      case 'not_qualified':
      case 'blocked':
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      default:
        return <UserIcon className="w-6 h-6 text-white/40" />;
    }
  };

  const getStatusText = (friend: ReferralFriend) => {
    switch (friend.status) {
      case 'qualified':
        return 'Засчитан';
      case 'bound':
        return 'Ожидаем оплату';
      case 'not_qualified':
        if (friend.status_reason === 'ATTR_WINDOW_EXPIRED') {
          return 'Оплата вне срока';
        }
        if (friend.status_reason === 'EXISTING_PAYER') {
          return 'Уже был подписчиком';
        }
        return 'Не засчитан';
      case 'blocked':
        if (friend.status_reason === 'SELF_REF') {
          return 'Самоприглашение';
        }
        return 'Заблокирован';
      default:
        return 'Неизвестно';
    }
  };

  const getStatusColor = (status: ReferralFriend['status']) => {
    switch (status) {
      case 'qualified':
        return 'text-green-500';
      case 'bound':
        return 'text-yellow-500';
      case 'not_qualified':
      case 'blocked':
        return 'text-red-500';
      default:
        return 'text-white/40';
    }
  };

  if (friends.length === 0) {
    return (
      <div className="bg-[#121212] rounded-[16px] p-5 border border-white/5 mb-6">
        <h3 className="text-lg font-medium text-white mb-4">Друзья</h3>
        <div className="text-center py-8">
          <p className="text-white/60 text-sm">Пока нет приглашенных друзей</p>
          <p className="text-white/40 text-xs mt-2">
            Пригласите друзей, чтобы получить больше билетов
          </p>
        </div>
      </div>
    );
  }

  const renderFriendGroup = (title: string, friends: ReferralFriend[], status: ReferralFriend['status']) => {
    if (friends.length === 0) return null;

    return (
      <div className="mb-6 last:mb-0">
        <h4 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">
          {title} ({friends.length})
        </h4>
        <div className="space-y-2">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="bg-white/5 rounded-[10px] p-3 border border-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {getStatusIcon(status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-sm truncate">
                    {friend.name || friend.tg_username || 'Без имени'}
                  </div>
                  <div className={`text-xs mt-1 ${getStatusColor(status)}`}>
                    {getStatusText(friend)}
                  </div>
                </div>
              </div>
              {friend.tickets_from_friend_total > 0 && (
                <div className="flex-shrink-0 text-right">
                  <div className="text-[#F55128] font-bold text-base">
                    +{friend.tickets_from_friend_total}
                  </div>
                  <div className="text-white/40 text-xs">б.</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Если друзей мало, показываем простой список без группировки
  if (!shouldGroup && friends.length > 0) {
    return (
      <div className="bg-[#121212] rounded-[16px] p-5 border border-white/5 mb-6 relative z-10">
        <h3 className="text-lg font-medium text-white mb-4">Друзья</h3>
        <div className="space-y-2">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="bg-white/5 rounded-[10px] p-3 border border-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {getStatusIcon(friend.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-sm truncate">
                    {friend.name || friend.tg_username || 'Без имени'}
                  </div>
                  <div className={`text-xs mt-1 ${getStatusColor(friend.status)}`}>
                    {getStatusText(friend)}
                  </div>
                </div>
              </div>
              {friend.tickets_from_friend_total > 0 && (
                <div className="flex-shrink-0 text-right">
                  <div className="text-[#F55128] font-bold text-base">
                    +{friend.tickets_from_friend_total}
                  </div>
                  <div className="text-white/40 text-xs">б.</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121212] rounded-[16px] p-5 border border-white/5 mb-6 relative z-10">
      <h3 className="text-lg font-medium text-white mb-5">Друзья</h3>
      <div>
        {groupedFriends && renderFriendGroup('Засчитаны', groupedFriends.qualified, 'qualified')}
        {groupedFriends && renderFriendGroup('Ожидают оплату', groupedFriends.bound, 'bound')}
        {groupedFriends && renderFriendGroup('Не засчитаны', [...groupedFriends.not_qualified, ...groupedFriends.blocked], 'not_qualified')}
      </div>
    </div>
  );
};