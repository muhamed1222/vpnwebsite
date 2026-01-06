# ✅ Чеклист настройки проекта

## 📋 Текущий статус

- ✅ Новый проект `outlivion-miniapp` в корне
- ✅ Старый проект перемещен в папку `old/`
- ✅ Структура проекта корректна
- ✅ Нет ошибок линтера

## 🔧 Шаги настройки

### 1. Проверка переменных окружения

```bash
# Проверить наличие .env.example
ls -la .env.example

# Если .env.example есть, создать .env.local
cp .env.example .env.local

# Если .env.example нет, создать .env.local вручную:
```

Содержимое `.env.local`:
```env
# Telegram Bot Token (REQUIRED для initData validation)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# API Base URL (для client-side requests)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# Payment Redirect URL (для client-side payment flows)
NEXT_PUBLIC_PAYMENT_REDIRECT_URL=https://redirect.ultima.foundation

# Subscription Base URL (для client-side subscription links)
NEXT_PUBLIC_SUBSCRIPTION_BASE_URL=https://gate.ultima.foundation

# Support Telegram URL (для client-side support links)
NEXT_PUBLIC_SUPPORT_TELEGRAM_URL=https://t.me/outlivion_support

# Help Base URL (для client-side help links)
NEXT_PUBLIC_HELP_BASE_URL=https://help.outlivion.space
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Проверка сборки

```bash
npm run build
```

Если сборка успешна, проект готов к работе.

### 4. Запуск dev сервера

```bash
npm run dev
```

Откройте приложение в Telegram через ссылку от бота.

### 5. Удаление папки old

**⚠️ ВАЖНО:** Удаляйте папку `old/` только после того, как убедитесь, что:
- ✅ Проект собирается без ошибок (`npm run build`)
- ✅ Dev сервер запускается (`npm run dev`)
- ✅ Приложение работает в Telegram
- ✅ Все функции работают корректно

После проверки:

```bash
rm -rf old/
```

## 🎯 Итоговая структура

```
vpnwebsite/
├── app/                    # Next.js App Router
├── components/             # React компоненты
├── lib/                    # Утилиты и хелперы
├── store/                  # Zustand stores
├── types/                  # TypeScript типы
├── public/                 # Статические файлы
├── package.json            # Зависимости
├── next.config.ts          # Конфигурация Next.js
├── tsconfig.json           # TypeScript конфигурация
└── .env.local              # Переменные окружения (не в git)
```

## 📝 Примечания

- Папка `old/` содержит старый проект и будет удалена после финальной проверки
- Все переменные окружения с префиксом `NEXT_PUBLIC_` доступны на клиенте
- `TELEGRAM_BOT_TOKEN` используется только на сервере для валидации initData

