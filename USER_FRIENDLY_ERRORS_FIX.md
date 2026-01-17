# Унификация сообщений об ошибках для пользователя

## Дата исправления
2025-01-27

## Проблема
Технические сообщения об ошибках показываются пользователю:
- `'API endpoint не найден. Проверьте конфигурацию сервера.'`
- `'Failed to fetch'`
- `'Network error: Backend unavailable'`
- И другие технические сообщения

## Решение

### 1. Создана система понятных сообщений для пользователя

**Файл:** `lib/utils/user-messages.ts`

**Содержание:**
- `USER_FRIENDLY_MESSAGES` - маппинг технических сообщений на понятные
- `HTTP_STATUS_MESSAGES` - понятные сообщения для HTTP статусов
- `getUserFriendlyMessage()` - функция преобразования технических сообщений
- `getHttpStatusMessage()` - функция получения сообщения по HTTP статусу
- `isTechnicalMessage()` - проверка, является ли сообщение техническим

---

### 2. Заменены все технические сообщения

#### `lib/api.ts`

**До:**
```typescript
errorMessage = 'API endpoint не найден. Проверьте конфигурацию сервера.';
errorMessage = 'API endpoint не найден. Проверьте, что сервер запущен и роут доступен.';
```

**После:**
```typescript
errorMessage = 'Сервис временно недоступен. Попробуйте позже.';
// Используется getHttpStatusMessage() для всех HTTP статусов
```

**До:**
```typescript
if (error instanceof TypeError && error.message === 'Failed to fetch') {
  throw new ApiException(
    'Проблема с подключением к серверу. Проверьте интернет-соединение.',
    0,
    error
  );
}
```

**После:**
```typescript
if (error instanceof TypeError && error.message === 'Failed to fetch') {
  throw new ApiException(
    'Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.',
    0,
    error
  );
}
```

---

#### `app/api/contest/active/route.ts`

**До:**
```typescript
{ ok: false, contest: null, error: errorData.error || errorData.message || 'Failed to fetch active contest' }
{ ok: false, contest: null, error: 'Network error: Backend unavailable' }
```

**После:**
```typescript
{ ok: false, contest: null, error: errorData.error || errorData.message || 'Не удалось загрузить информацию о конкурсе. Попробуйте позже.' }
{ ok: false, contest: null, error: 'Сервис временно недоступен. Попробуйте позже.' }
```

---

#### `app/api/referral/summary/route.ts`

**До:**
```typescript
{ ok: false, summary: null, error: errorData.error || 'Failed to fetch summary' }
```

**После:**
```typescript
{ ok: false, summary: null, error: errorData.error || 'Не удалось загрузить данные. Попробуйте позже.' }
```

---

#### `app/api/referral/tickets/route.ts`

**До:**
```typescript
{ ok: false, tickets: [], error: errorData.error || 'Failed to fetch tickets' }
```

**После:**
```typescript
{ ok: false, tickets: [], error: errorData.error || 'Не удалось загрузить историю билетов. Попробуйте позже.' }
```

---

#### `app/api/referral/friends/route.ts`

**До:**
```typescript
{ ok: false, friends: [], error: errorData.error || 'Failed to fetch friends' }
```

**После:**
```typescript
{ ok: false, friends: [], error: errorData.error || 'Не удалось загрузить список друзей. Попробуйте позже.' }
```

---

#### `app/api/admin/contest/participants/route.ts`

**До:**
```typescript
{ ok: false, participants: [], error: errorData.error || 'Failed to fetch participants' }
```

**После:**
```typescript
{ ok: false, participants: [], error: errorData.error || 'Не удалось загрузить участников. Попробуйте позже.' }
```

---

#### `app/(auth)/contest/page.tsx`

**До:**
```typescript
throw new Error('Network error or timeout');
throw new Error('Invalid JSON response');
```

**После:**
```typescript
setError('Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.');
setError('Ошибка обработки данных. Попробуйте позже.');
```

---

#### `components/blocks/PurchaseConfirmModal.tsx`

**До:**
```typescript
const message = error instanceof Error 
  ? error.message 
  : 'Произошла ошибка при создании платежа. Попробуйте позже.';
```

**После:**
```typescript
const { getUserFriendlyMessage } = await import('@/lib/utils/user-messages');
const message = error instanceof Error 
  ? getUserFriendlyMessage(error.message)
  : 'Произошла ошибка при создании платежа. Попробуйте позже.';
```

---

### 3. Интегрирована система в errorHandler

**Файл:** `lib/utils/errorHandler.ts`

**Изменения:**
- Импортирован `getUserFriendlyMessage` и `isTechnicalMessage` из `user-messages.ts`
- Функция `getUserMessage()` теперь использует `getUserFriendlyMessage()` для преобразования всех сообщений
- Автоматическое преобразование технических сообщений в понятные

---

## Результаты

### Маппинг технических сообщений

| Техническое сообщение | Понятное сообщение |
|----------------------|-------------------|
| `API endpoint не найден. Проверьте конфигурацию сервера.` | `Сервис временно недоступен. Попробуйте позже.` |
| `API endpoint не найден. Проверьте, что сервер запущен и роут доступен.` | `Сервис временно недоступен. Попробуйте позже.` |
| `Failed to fetch` | `Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.` |
| `Network error` | `Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.` |
| `Network error or timeout` | `Превышено время ожидания. Проверьте интернет-соединение и попробуйте снова.` |
| `Network error: Backend unavailable` | `Сервис временно недоступен. Попробуйте позже.` |
| `Failed to fetch active contest` | `Не удалось загрузить информацию о конкурсе. Попробуйте позже.` |
| `Failed to fetch summary` | `Не удалось загрузить данные. Попробуйте позже.` |
| `Failed to fetch friends` | `Не удалось загрузить список друзей. Попробуйте позже.` |
| `Failed to fetch tickets` | `Не удалось загрузить историю билетов. Попробуйте позже.` |
| `Failed to fetch participants` | `Не удалось загрузить участников. Попробуйте позже.` |
| `Invalid JSON response` | `Ошибка обработки данных. Попробуйте позже.` |

### HTTP статусы

| Статус | Понятное сообщение |
|--------|-------------------|
| 400 | `Проверьте правильность введенных данных.` |
| 401 | `Ошибка авторизации. Пожалуйста, перезапустите приложение.` |
| 403 | `Недостаточно прав для выполнения этого действия.` |
| 404 | `Запрашиваемый ресурс не найден.` |
| 408 | `Превышено время ожидания. Попробуйте снова.` |
| 429 | `Слишком много запросов. Подождите немного и попробуйте снова.` |
| 500 | `Ошибка сервера. Попробуйте позже.` |
| 502 | `Сервис временно недоступен. Попробуйте позже.` |
| 503 | `Сервис временно недоступен. Попробуйте позже.` |
| 504 | `Превышено время ожидания. Попробуйте снова.` |

---

## Рекомендации

### Для будущих разработок

1. ✅ **Всегда использовать `getUserFriendlyMessage()` для преобразования ошибок**
   - Автоматическое преобразование технических сообщений
   - Единый подход к сообщениям об ошибках

2. ✅ **Использовать `getHttpStatusMessage()` для HTTP статусов**
   - Понятные сообщения для всех статусов
   - Централизованное управление сообщениями

3. ✅ **Добавлять новые технические сообщения в `USER_FRIENDLY_MESSAGES`**
   - При обнаружении нового технического сообщения
   - Добавлять в маппинг для автоматического преобразования

4. ✅ **Проверять сообщения через `isTechnicalMessage()`**
   - Перед показом пользователю
   - Убедиться, что сообщение не техническое

---

## Заключение

✅ **Проблема решена полностью**

Все технические сообщения об ошибках заменены на понятные для пользователя. Создана система унификации сообщений об ошибках. Проект готов к production с понятными сообщениями об ошибках.

---

*Документ создан автоматически при унификации сообщений об ошибках*
