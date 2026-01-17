# Реализация централизованной валидации Telegram initData

## Проблема

Валидация Telegram initData была разбросана по API routes, что создавало:
- Риск подмены пользователя, если валидация пропущена
- Дублирование кода
- Несогласованность в обработке ошибок
- Условную валидацию (только если токен установлен)

## Решение

Создана централизованная утилита `lib/utils/api-validation.ts` для единообразной валидации во всех API routes.

## Структура решения

### 1. Централизованная утилита (`lib/utils/api-validation.ts`)

#### Функции:

**`validateRequestInitData(request, requireAuth?)`**
- Валидирует Telegram initData из запроса
- Возвращает результат валидации с деталями
- Поддерживает опциональную авторизацию

**`validateApiRequest(request, requireAuth?)`**
- Middleware для валидации в API routes
- Возвращает `NextResponse` с ошибкой или `null` при успехе
- Упрощает использование в routes

**`getValidatedInitData(request)`**
- Извлекает initData из запроса (после валидации)
- Используется для получения валидированного initData

### 2. Особенности валидации

#### Обязательная валидация в production
- В production токен должен быть установлен
- Если токен не установлен, возвращается ошибка 500
- Предотвращает подмену пользователя

#### Dev режим
- Пропускает валидацию для STUB initData
- Пропускает валидацию, если токен не установлен (с предупреждением)
- Позволяет разработку без настройки токена

#### Проверка возраста данных
- Данные не должны быть старше 24 часов
- Предотвращает использование устаревших данных

## Обновленные файлы

### Используют централизованную валидацию (14 файлов):

1. ✅ `app/api/payments/history/route.ts`
2. ✅ `app/api/tariffs/route.ts`
3. ✅ `app/api/referral/friends/route.ts`
4. ✅ `app/api/referral/tickets/route.ts`
5. ✅ `app/api/referral/summary/route.ts`
6. ✅ `app/api/user/referrals/history/route.ts`
7. ✅ `app/api/user/autorenewal/route.ts` (GET и POST)
8. ✅ `app/api/user/billing/route.ts`
9. ✅ `app/api/orders/create/route.ts`
10. ✅ `app/api/user/config/route.ts`
11. ✅ `app/api/user/referrals/route.ts`
12. ✅ `app/api/user/status/route.ts`
13. ✅ `app/api/me/route.ts`
14. ✅ `app/api/tg/auth/route.ts`

### Используют централизованную валидацию с админской сессией (2 файла):

15. ✅ `app/api/contest/active/route.ts` - валидация только если нет админской сессии
16. ✅ `app/api/admin/contest/participants/route.ts` - валидация только если нет админской сессии

### Не требуют валидации initData (2 файла):

17. ⚠️ `app/api/admin/auth/route.ts` - использует пароль для авторизации
18. ⚠️ `app/api/sentry-example-api/route.ts` - тестовый роут для Sentry

## Преимущества

1. **Единообразие:** Все routes используют один и тот же подход к валидации
2. **Безопасность:** Обязательная валидация в production предотвращает подмену пользователя
3. **Упрощение кода:** Меньше дублирования, проще поддержка
4. **Централизованная логика:** Изменения в валидации применяются ко всем routes
5. **Лучшая обработка ошибок:** Единые сообщения об ошибках

## Пример использования

### До:
```typescript
const initData = request.headers.get('X-Telegram-Init-Data') || 
                 request.headers.get('Authorization');

if (!initData) {
  return NextResponse.json(
    { error: 'Missing Telegram initData' },
    { status: 401 }
  );
}

if (serverConfig.telegram.botToken) {
  const isValid = validateTelegramInitData(
    initData,
    serverConfig.telegram.botToken
  );

  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid Telegram initData signature' },
      { status: 401 }
    );
  }
}
```

### После:
```typescript
// Валидируем запрос с помощью централизованной утилиты
const validationError = validateApiRequest(request, true);
if (validationError) {
  return validationError;
}

// Получаем валидированный initData
const initData = getValidatedInitData(request);
```

## Статистика

- **Routes с валидацией:** 16/18 (89%)
- **Routes без валидации (нормально):** 2/18 (11%)
- **Используют централизованную утилиту:** 16/16 (100%)
- **Ошибок компиляции:** 0
- **Ошибок сборки:** 0

## Безопасность

### ✅ Улучшения:

1. **Обязательная валидация в production:** Токен должен быть установлен
2. **Проверка возраста данных:** Данные не старше 24 часов
3. **Единообразная обработка:** Все routes используют один подход
4. **Централизованное логирование:** Все невалидные попытки логируются

### ⚠️ Ограничения:

1. **Dev режим:** Валидация может быть пропущена для удобства разработки
2. **Админские routes:** Используют альтернативную авторизацию (сессия/API key)

## Тестирование

✅ TypeScript компиляция: успешно
✅ Сборка проекта: успешно
✅ Линтер: без ошибок
✅ Все routes обновлены: 16/16

## Статус

✅ **ПРОБЛЕМА РЕШЕНА**

Все API routes теперь используют централизованную валидацию initData. Валидация обязательна в production, что предотвращает подмену пользователя.
