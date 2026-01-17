# 🎯 Финальный анализ системы начисления билетов

**Дата анализа:** 2026-01-17  
**Статус:** ✅ Анализ завершен, обнаружены критические проблемы

---

## 📋 Как работает система сейчас

### 1. Создание билетов за покупки друзей (INVITEE_PAYMENT)

**Файл:** `/root/vpn_bot/src/services/contestService.ts` → `awardTickets()`

**Процесс:**
1. Вызывается из `orderProcessingService.ts` при обработке платежа
2. Проверяется квалификация через `checkQualification()`
3. Если квалифицирован → создается билет в `ticket_ledger` с `reason = 'INVITEE_PAYMENT'`

**Проблемы:**
- ❌ Нет проверки `order.created_at >= contest.starts_at`
- ❌ Нет проверки `order.created_at <= contest.ends_at`
- ⚠️ Окно атрибуции проверяется в `checkQualification()`, но не в `awardTickets()`

---

### 2. Создание билетов за собственные покупки (SELF_PURCHASE)

**Статус:** ❓ **НЕ НАЙДЕНО в коде бота**

**Гипотеза:**
- Билеты SELF_PURCHASE создаются где-то еще (возможно, в другом сервисе или при квалификации)
- Или создаются массово при первом обращении к API конкурса

**Проблемы:**
- ❌ Непонятно, где создаются билеты SELF_PURCHASE
- ❌ Нет контроля над их созданием
- ❌ Нет проверки дат конкурса

---

## 🚨 КРИТИЧЕСКИЕ ПРОБЛЕМЫ

### ❌ ПРОБЛЕМА 1: Нет проверки даты начала конкурса

**Где:** `awardTickets()` в `contestService.ts`

**Код:**
```typescript
awardTickets: (
  contestId: string,
  referrerId: number,
  referredId: number,
  orderId: string,
  planId: string
  // ❌ НЕТ ПАРАМЕТРА: orderCreatedAt
): boolean => {
  // ❌ НЕТ ПРОВЕРКИ: order.created_at >= contest.starts_at
  // Сразу создает билет
}
```

**Последствия:**
- Билеты начисляются за покупки ДО запуска конкурса
- Это уже произошло с пользователем 782245481

**Решение:**
```typescript
awardTickets: (
  contestId: string,
  referrerId: number,
  referredId: number,
  orderId: string,
  planId: string,
  orderCreatedAt: number  // ← ДОБАВИТЬ
): boolean => {
  const contest = ContestService.getActiveContest();
  if (!contest || contest.id !== contestId) return false;

  // Проверка даты начала
  const contestStartTime = new Date(contest.starts_at).getTime();
  if (orderCreatedAt < contestStartTime) {
    console.log(`Order ${orderId} was before contest start`);
    return false;
  }

  // Проверка даты окончания
  const contestEndTime = new Date(contest.ends_at).getTime();
  if (orderCreatedAt > contestEndTime) {
    console.log(`Order ${orderId} was after contest end`);
    return false;
  }

  // ... остальной код
}
```

---

### ❌ ПРОБЛЕМА 2: Нет функции для SELF_PURCHASE

**Проблема:**
- В коде нет функции для создания билетов за собственные покупки
- Билеты SELF_PURCHASE создаются где-то еще (не найдено)

**Решение:**
- Создать функцию `awardSelfPurchaseTicket()`
- С теми же проверками дат

---

### ⚠️ ПРОБЛЕМА 3: Окно атрибуции проверяется отдельно

**Текущая логика:**
- `checkQualification()` проверяет окно атрибуции
- `awardTickets()` не проверяет окно атрибуции

**Риск:**
- Если `checkQualification()` пропустит проверку, билет все равно создастся

**Решение:**
- Добавить проверку окна атрибуции в `awardTickets()`

---

## ✅ Что работает правильно

1. ✅ **Окно атрибуции:** Проверяется в `checkQualification()`
2. ✅ **Саморефералы:** Блокируются
3. ✅ **Существующие плательщики:** Отсеиваются
4. ✅ **Чтение билетов:** API правильно читает из ticket_ledger
5. ✅ **Подсчет билетов:** Суммирование delta работает

---

## 🔧 План исправления

### Шаг 1: Исправить `awardTickets()`

**Файл:** `/root/vpn_bot/src/services/contestService.ts`

```typescript
awardTickets: (
  contestId: string,
  referrerId: number,
  referredId: number,
  orderId: string,
  planId: string,
  orderCreatedAt: number  // ← ДОБАВИТЬ
): boolean => {
  // 1. Проверить активность конкурса
  const contest = ContestService.getActiveContest();
  if (!contest || contest.id !== contestId) {
    return false;
  }

  // 2. Проверить дату начала конкурса
  const contestStartTime = new Date(contest.starts_at).getTime();
  if (orderCreatedAt < contestStartTime) {
    console.log(`[ContestService] Order ${orderId} was before contest start`);
    return false;
  }

  // 3. Проверить дату окончания конкурса
  const contestEndTime = new Date(contest.ends_at).getTime();
  if (orderCreatedAt > contestEndTime) {
    console.log(`[ContestService] Order ${orderId} was after contest end`);
    return false;
  }

  // 4. Проверить окно атрибуции
  const refEvent = ContestService.getRefEventByUsers(contestId, referrerId, referredId);
  if (!refEvent) {
    return false;
  }

  const boundAt = new Date(refEvent.bound_at).getTime();
  const attributionWindowMs = contest.attribution_window_days * 24 * 60 * 60 * 1000;
  const timeSinceBound = orderCreatedAt - boundAt;

  if (timeSinceBound > attributionWindowMs) {
    console.log(`[ContestService] Order ${orderId} outside attribution window`);
    return false;
  }

  // 5. Создать билет
  // ... остальной код
}
```

### Шаг 2: Создать функцию для SELF_PURCHASE

```typescript
awardSelfPurchaseTicket: (
  contestId: string,
  userId: number,
  orderId: string,
  planId: string,
  orderCreatedAt: number
): boolean => {
  // Те же проверки, что и в awardTickets()
  // Но reason = 'SELF_PURCHASE'
  // И referrer_id = referred_id = userId
}
```

### Шаг 3: Обновить вызовы функций

**Файл:** `/root/vpn_bot/src/services/orderProcessingService.ts`

- Передавать `orderCreatedAt` в `awardTickets()`
- Вызывать `awardSelfPurchaseTicket()` для собственных покупок

---

## 📝 Итоговый вердикт

### ❌ Система настроена НЕПРАВИЛЬНО

**Основные проблемы:**
1. ❌ Нет проверки даты начала конкурса
2. ❌ Нет проверки даты окончания конкурса
3. ❌ Нет функции для SELF_PURCHASE билетов
4. ❌ Билеты могут начисляться за покупки до/после конкурса

**Требуется:**
- ✅ Срочное исправление логики создания билетов
- ✅ Добавление проверок дат конкурса
- ✅ Создание функции для SELF_PURCHASE билетов

---

**Статус:** ❌ Требуется срочное исправление
