# Реализация тестирования React компонентов

## Дата реализации
2025-01-27

## Проблема
Нет тестов для React-компонентов.

## Решение

### 1. Настроена инфраструктура тестирования

**Файл:** `lib/test-utils.tsx`

**Содержание:**
- ✅ Кастомная функция `render` с провайдерами
- ✅ Моки для Telegram WebApp
- ✅ Утилиты для мокирования:
  - `setupTelegramMock()` - установка мока Telegram
  - `cleanupTelegramMock()` - очистка мока
  - `mockOnlineStatus()` - мок для navigator.onLine
  - `createLocalStorageMock()` - мок для localStorage
  - `waitForNextTick()` - ожидание следующего тика

**Файл:** `vitest.setup.ts`

**Обновления:**
- ✅ Использование `setupTelegramMock()` из test-utils
- ✅ Мок для `matchMedia` (нужно для некоторых компонентов)
- ✅ Мок для `IntersectionObserver`

---

### 2. Созданы тесты для UI компонентов

#### 2.1. LoadingSpinner

**Файл:** `components/ui/__tests__/LoadingSpinner.test.tsx`

**Тесты:**
- ✅ Должен отображаться
- ✅ Должен отображать текст, если передан
- ✅ Не должен отображать текст, если не передан
- ✅ Должен применять размер sm
- ✅ Должен применять размер md по умолчанию
- ✅ Должен применять размер lg
- ✅ Должен применять дополнительные классы
- ✅ Должен иметь правильный aria-label

**Всего тестов:** 8 ✅

---

#### 2.2. SkeletonLoader

**Файл:** `components/ui/__tests__/SkeletonLoader.test.tsx`

**Тесты:**
- ✅ Должен отображаться
- ✅ Должен применять дополнительные классы
- ✅ Должен иметь правильную структуру

**Файл:** `components/ui/__tests__/SkeletonLoader.variants.test.tsx`

**Тесты:**
- ✅ Должен отображать текстовый вариант с несколькими строками
- ✅ Должен отображать круговой вариант
- ✅ Должен отображать прямоугольный вариант по умолчанию
- ✅ Должен применять кастомные размеры

**Всего тестов:** 7 ✅

---

### 3. Созданы тесты для блоков компонентов

#### 3.1. StatusCard

**Файл:** `components/blocks/__tests__/StatusCard.test.tsx`

**Тесты:**
- ✅ Должен отображаться
- ✅ Должен отображать статус "active"
- ✅ Должен отображать статус "expired"
- ✅ Должен отображать статус "none"
- ✅ Должен отображать статус "loading"
- ✅ Должен отображать дату истечения для активной подписки

**Всего тестов:** 6 ✅

---

#### 3.2. OfflineIndicator

**Файл:** `components/__tests__/OfflineIndicator.test.tsx`

**Тесты:**
- ✅ Не должен отображаться, когда онлайн и не было перехода в офлайн
- ✅ Должен рендериться без ошибок
- ✅ Должен иметь правильную структуру DOM

**Всего тестов:** 3 ✅

**Примечание:** Полное тестирование OfflineIndicator требует сложной настройки событий, поэтому оставлены базовые тесты.

---

#### 3.3. CountdownTimer

**Файл:** `components/blocks/__tests__/CountdownTimer.test.tsx`

**Тесты:**
- ✅ Должен отображаться
- ✅ Должен отображать оставшееся время
- ✅ Должен обрабатывать истекшее время

**Всего тестов:** 3 ✅

---

### 4. Добавлены data-testid для тестирования

**Обновленные компоненты:**
- ✅ `SkeletonLoader` - добавлен `data-testid="skeleton-loader"`
- ✅ `StatusCard` - добавлен `data-testid="status-card"`

---

## Статистика тестов

### Созданные тесты:

| Компонент | Файл | Тестов | Статус |
|-----------|------|--------|--------|
| LoadingSpinner | `components/ui/__tests__/LoadingSpinner.test.tsx` | 8 | ✅ |
| SkeletonLoader | `components/ui/__tests__/SkeletonLoader.test.tsx` | 3 | ✅ |
| SkeletonLoader variants | `components/ui/__tests__/SkeletonLoader.variants.test.tsx` | 4 | ✅ |
| StatusCard | `components/blocks/__tests__/StatusCard.test.tsx` | 6 | ✅ |
| OfflineIndicator | `components/__tests__/OfflineIndicator.test.tsx` | 3 | ✅ |
| CountdownTimer | `components/blocks/__tests__/CountdownTimer.test.tsx` | 3 | ✅ |

**Всего тестов для компонентов:** 27 ✅

---

## Использование

### Запуск всех тестов

```bash
npm test
```

### Запуск тестов в watch режиме

```bash
npm test -- --watch
```

### Запуск тестов с покрытием

```bash
npm run test:coverage
```

### Запуск тестов с UI

```bash
npm run test:ui
```

### Запуск конкретного теста

```bash
npm test -- LoadingSpinner.test.tsx
```

---

## Примеры тестов

### Базовый тест компонента

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/lib/test-utils';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('должен отображаться', () => {
    render(<MyComponent />);
    expect(screen.getByTestId('my-component')).toBeInTheDocument();
  });
});
```

### Тест с пропсами

```typescript
it('должен отображать текст', () => {
  render(<MyComponent text="Hello" />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Тест с событиями

```typescript
import userEvent from '@testing-library/user-event';

it('должен обрабатывать клик', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);
  const button = screen.getByRole('button');
  await user.click(button);
  expect(screen.getByText('Clicked')).toBeInTheDocument();
});
```

---

## Рекомендации

### Для будущих компонентов

1. ✅ **Добавлять `data-testid` для важных элементов**
   - Упрощает поиск элементов в тестах
   - Не влияет на производительность

2. ✅ **Использовать `@/lib/test-utils` для тестирования**
   - Единый подход к тестированию
   - Встроенные моки и утилиты

3. ✅ **Покрывать основные сценарии**
   - Отображение компонента
   - Обработка пропсов
   - Обработка событий
   - Граничные случаи

4. ✅ **Использовать `screen` для поиска элементов**
   - Предпочтительные методы: `getByRole`, `getByText`, `getByTestId`
   - Избегать `querySelector`

---

## Заключение

✅ **Проблема решена частично**

Создана инфраструктура тестирования и тесты для ключевых компонентов:
- ✅ Настроена инфраструктура тестирования
- ✅ Созданы тесты для UI компонентов (LoadingSpinner, SkeletonLoader)
- ✅ Созданы тесты для блоков компонентов (StatusCard, OfflineIndicator, CountdownTimer)
- ✅ Добавлены data-testid для тестирования
- ✅ Всего создано 27 тестов для компонентов

**Рекомендации для дальнейшего развития:**
- Добавить тесты для остальных компонентов
- Добавить тесты для интерактивных компонентов (модалки, формы)
- Добавить тесты для интеграции компонентов
- Настроить покрытие кода

---

*Документ создан автоматически при реализации тестирования компонентов*
