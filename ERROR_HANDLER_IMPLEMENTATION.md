# Централизованная обработка ошибок

## Проблема

До внедрения централизованного обработчика ошибок:
- Обработка ошибок была разбросана по компонентам
- `logError` использовался не везде
- Не было единого подхода к обработке ошибок
- Пользователь видел технические сообщения (например, "Failed to fetch", "NetworkError")
- Нет глобального обработчика ошибок API

## Решение

Создан централизованный обработчик ошибок (`lib/utils/errorHandler.ts`), который:

1. **Автоматически определяет тип ошибки** (сеть, авторизация, сервер и т.д.)
2. **Преобразует технические ошибки в понятные пользовательские сообщения**
3. **Логирует техническую информацию** для разработчиков
4. **Показывает ошибки пользователю** через Telegram WebApp или alert
5. **Интегрирован с существующей системой логирования**

## Структура

### Основные функции

#### `handleError(error, context?, options?)`
Главная функция для обработки ошибок:
- Определяет тип ошибки
- Получает понятное сообщение для пользователя
- Логирует техническую информацию
- Показывает ошибку пользователю (опционально)

#### `handleApiError(error, context?, options?)`
Специализированная функция для API ошибок:
- Автоматически добавляет контекст `api_request`
- Используется в `api.ts` для обработки всех API запросов

#### `handleComponentError(error, componentName, action?)`
Функция для обработки ошибок в React компонентах:
- Автоматически добавляет контекст компонента
- Используется в catch блоках компонентов

#### `createErrorHandler(context)`
Создает обработчик ошибок для конкретного контекста:
- Полезно для создания переиспользуемых обработчиков
- Возвращает объект с методами `handle`, `handleApi`, `handleComponent`

### Типы ошибок

```typescript
enum ErrorType {
  NETWORK = 'network',        // Проблемы с сетью
  AUTH = 'auth',              // Ошибки авторизации
  PERMISSION = 'permission',  // Недостаточно прав
  NOT_FOUND = 'not_found',    // Ресурс не найден
  SERVER = 'server',          // Ошибки сервера
  VALIDATION = 'validation',  // Ошибки валидации
  UNKNOWN = 'unknown',        // Неизвестная ошибка
}
```

### Пользовательские сообщения

Каждый тип ошибки имеет понятное сообщение на русском языке:

- **NETWORK**: "Проблема с подключением к интернету. Проверьте соединение и попробуйте снова."
- **AUTH**: "Ошибка авторизации. Пожалуйста, перезапустите приложение."
- **PERMISSION**: "Недостаточно прав для выполнения этого действия."
- **NOT_FOUND**: "Запрашиваемый ресурс не найден."
- **SERVER**: "Ошибка сервера. Попробуйте позже."
- **VALIDATION**: "Проверьте правильность введенных данных."
- **UNKNOWN**: "Что-то пошло не так. Попробуйте перезагрузить приложение."

## Интеграция

### 1. API слой (`lib/api.ts`)

```typescript
import { handleApiError } from './utils/errorHandler';

// В catch блоке apiFetch
const userMessage = handleApiError(error, {
  action: 'apiFetch',
  endpoint,
}, {
  showToUser: false, // Не показываем здесь, компонент сам решит
  logError: true,
});
```

### 2. Компоненты

```typescript
import { handleComponentError } from '@/lib/utils/errorHandler';

try {
  // код
} catch (error) {
  const errorMessage = handleComponentError(error, 'componentName', 'action');
  setError(errorMessage);
}
```

### 3. Error Boundary

```typescript
import { handleError } from '@/lib/utils/errorHandler';

componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  handleError(error, {
    page: 'ErrorBoundary',
    action: 'componentDidCatch',
  }, {
    showToUser: false, // Показываем fallback UI
    logError: true,
  });
}
```

## Обновленные файлы

### Созданные
- `lib/utils/errorHandler.ts` - централизованный обработчик ошибок

### Обновленные
- `lib/api.ts` - интеграция обработчика в API слой
- `lib/auth.ts` - использование обработчика в авторизации
- `components/ErrorBoundary.tsx` - использование обработчика
- `hooks/useMinPrice.ts` - использование обработчика
- `app/(auth)/purchase/page.tsx` - использование обработчика
- `app/(auth)/profile/page.tsx` - использование обработчика
- `app/(auth)/contest/page.tsx` - использование обработчика

## Преимущества

1. **Единый подход**: Все ошибки обрабатываются одинаково
2. **Понятные сообщения**: Пользователь видит понятные сообщения, а не технические
3. **Автоматическое логирование**: Все ошибки логируются с контекстом
4. **Гибкость**: Можно настроить показ ошибок и логирование
5. **Типобезопасность**: TypeScript типы для всех функций
6. **Интеграция**: Работает с существующей системой логирования и аналитики

## Примеры использования

### В компоненте

```typescript
try {
  const data = await api.getTariffs();
} catch (error) {
  const errorMessage = handleComponentError(error, 'purchase', 'loadTariffs');
  setError(errorMessage);
}
```

### В API функции

```typescript
try {
  return await apiFetch<T>(endpoint, options);
} catch (error) {
  if (error instanceof ApiException) {
    throw error; // Уже обработано
  }
  
  const userMessage = handleApiError(error, { endpoint });
  throw new ApiException(userMessage, 500, error);
}
```

### Создание обработчика для контекста

```typescript
const errorHandler = createErrorHandler({
  page: 'purchase',
  userId: user.id,
});

try {
  // код
} catch (error) {
  errorHandler.handleComponent(error, 'loadTariffs');
}
```

## Тестирование

✅ Сборка проекта успешна
✅ TypeScript компиляция без ошибок
✅ Нет ошибок линтера
✅ Все компоненты обновлены
✅ Error Boundary использует обработчик
✅ API слой интегрирован

## Статус реализации

✅ **Полностью реализовано:**
- Все клиентские компоненты (`app/(auth)/*`) используют централизованный обработчик
- API слой (`lib/api.ts`) интегрирован с обработчиком
- Error Boundary использует обработчик
- Все хуки используют обработчик
- Admin панель использует обработчик

⚠️ **API роуты (Next.js routes):**
- API роуты (`app/api/*`) используют `logError` напрямую - это нормально, так как это серверная часть
- На сервере логирование технических ошибок необходимо для отладки
- Пользователь не видит эти ошибки напрямую

## Следующие шаги (опционально)

1. Интегрировать с Sentry для production мониторинга
2. Добавить метрики ошибок в аналитику
3. Расширить обработку специфичных типов ошибок
