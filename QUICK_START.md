# 🚀 Быстрый старт для разработчиков

## Outlivion VPN Mini App

---

## ⚡ Быстрая установка

```bash
# Клонировать репозиторий
git clone <repository-url>
cd vpnwebsite

# Установить зависимости
npm install

# Запустить в режиме разработки
npm run dev
```

Приложение будет доступно на `http://localhost:3000`

---

## 🔧 Основные команды

```bash
# Разработка
npm run dev              # Запуск dev сервера

# Тестирование
npm test                 # Запуск тестов
npm test -- --ui         # Запуск тестов с UI
npm test -- --coverage   # Запуск с покрытием

# Сборка
npm run build            # Сборка для продакшена
npm start                # Запуск продакшен сборки

# Линтинг
npm run lint             # Проверка кода
```

---

## 📁 Структура проекта

```
vpnwebsite/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Защищенные страницы
│   ├── api/            # API routes
│   └── admin/          # Админ панель
├── components/         # React компоненты
│   ├── blocks/         # Блоки компонентов
│   └── ui/             # UI компоненты
├── lib/                # Утилиты и хелперы
│   ├── utils/          # Утилиты
│   └── __tests__/      # Тесты утилит
├── hooks/              # React хуки
├── store/              # Zustand stores
└── types/              # TypeScript типы
```

---

## 🔑 Ключевые утилиты

### API Проксирование

```typescript
import { proxyGet, proxyPost } from '@/lib/utils/api-proxy';

// GET запрос
const response = await proxyGet(request, '/v1/tariffs', {
  requireAuth: false,
  revalidate: 3600,
});

// POST запрос
const response = await proxyPost(request, '/v1/orders/create', body, {
  requireAuth: true,
});
```

### Обработка ошибок

```typescript
import { handleComponentError } from '@/lib/utils/errorHandler';

try {
  // код
} catch (error) {
  const message = handleComponentError(error, 'page', 'action');
  setError(message);
}
```

### Валидация API

```typescript
import { validateApiRequest } from '@/lib/utils/api-validation';

export async function GET(request: NextRequest) {
  const validationError = validateApiRequest(request, true);
  if (validationError) {
    return validationError;
  }
  // код
}
```

---

## 🧪 Тестирование

### Запуск тестов

```bash
# Все тесты
npm test

# Конкретный файл
npm test LoadingSpinner.test.tsx

# С покрытием
npm test -- --coverage
```

### Написание тестов

```typescript
import { render, screen } from '@/lib/test-utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('должен отображаться', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

---

## 🔐 Переменные окружения

Создайте `.env.local`:

```env
# API
NEXT_PUBLIC_API_BASE_URL=https://api.outlivion.space

# Telegram Bot Token (для валидации initData)
TELEGRAM_BOT_TOKEN=your_bot_token

# Sentry (опционально)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

---

## 📚 Документация

- **README.md** - основная документация
- **API_DOCUMENTATION.md** - документация API
- **COMPLETE_PROJECT_STATUS.md** - статус проекта
- **FINAL_SUMMARY.md** - финальное резюме

---

## 🐛 Отладка

### Проверка Telegram WebApp

```typescript
import { getTelegramWebApp } from '@/lib/telegram';

const tg = getTelegramWebApp();
console.log('InitData:', tg?.initData);
console.log('User:', tg?.initDataUnsafe?.user);
```

### Логирование

```typescript
import { logError, logWarn } from '@/lib/utils/logging';

logError('Error message', error, { context: 'data' });
logWarn('Warning message', { context: 'data' });
```

---

## ✅ Чеклист перед коммитом

- [ ] Тесты проходят (`npm test`)
- [ ] Линтер не показывает ошибок (`npm run lint`)
- [ ] Сборка успешна (`npm run build`)
- [ ] TypeScript компилируется (`npx tsc --noEmit`)
- [ ] Код соответствует стилю проекта

---

## 🚨 Частые проблемы

### Проблема: Тесты не проходят

**Решение:**
```bash
# Очистить кэш
rm -rf node_modules/.vite
npm test
```

### Проблема: Ошибки TypeScript

**Решение:**
```bash
# Проверить типы
npx tsc --noEmit

# Переустановить зависимости
rm -rf node_modules package-lock.json
npm install
```

### Проблема: Сборка падает

**Решение:**
```bash
# Очистить Next.js кэш
rm -rf .next
npm run build
```

---

## 📞 Полезные ссылки

- [Next.js документация](https://nextjs.org/docs)
- [React документация](https://react.dev)
- [TypeScript документация](https://www.typescriptlang.org/docs)
- [Vitest документация](https://vitest.dev)
- [Testing Library](https://testing-library.com)

---

## 🎯 Следующие шаги

1. Прочитайте **README.md** для полной документации
2. Изучите **API_DOCUMENTATION.md** для работы с API
3. Посмотрите примеры в `components/` и `app/`
4. Начните разработку!

---

*Документ создан для быстрого старта разработки*
