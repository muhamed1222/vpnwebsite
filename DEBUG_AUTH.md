# Отладка авторизации

## Проблема
Сайт не подключается к проекту - авторизация не работает.

## Что проверить

### 1. Проверить, что initData передается из Telegram WebApp

В браузере (DevTools Console):
```javascript
// Проверить, что Telegram WebApp инициализирован
console.log('Telegram WebApp:', window.Telegram?.WebApp);
console.log('initData:', window.Telegram?.WebApp?.initData);
console.log('initData length:', window.Telegram?.WebApp?.initData?.length);
```

### 2. Проверить запросы к API

В Network tab DevTools:
- Найти запрос к `/api/me`
- Проверить заголовок `Authorization` - должен содержать initData
- Проверить статус ответа (401 = ошибка авторизации)

### 3. Проверить логи на сервере

```bash
# В реальном времени
ssh root@72.56.93.135 "tail -f /var/log/outlivion-api.log"

# Или последние 100 строк
ssh root@72.56.93.135 "tail -100 /var/log/outlivion-api.log | grep -E 'verifyAuth|initData|Unauthorized|Authorization'"
```

### 4. Проверить переменные окружения

```bash
# На сервере
ssh root@72.56.93.135 "cd /opt/outlivion-api && grep TELEGRAM_BOT_TOKEN .env"

# В Vercel (через веб-интерфейс или CLI)
vercel env ls
```

## Возможные проблемы и решения

### Проблема 1: initData не передается
**Причина:** Приложение открыто не через Telegram
**Решение:** Открыть приложение через Telegram бота

### Проблема 2: Валидация не работает
**Причина:** Неправильный botToken или различия в алгоритме валидации
**Решение:** 
- Проверить, что botToken правильный на сервере
- Убедиться, что алгоритм валидации одинаковый на клиенте и сервере

### Проблема 3: Роут не найден
**Причина:** Сервис не обновлен или не запущен
**Решение:**
```bash
ssh root@72.56.93.135 "cd /opt/outlivion-api && git pull && npm run build && pkill -f 'node.*server.js' && nohup node dist/server.js > /var/log/outlivion-api.log 2>&1 &"
```

## Тестовый запрос

```bash
# Тест без авторизации (должен вернуть 401)
curl -X GET "https://api.outlivion.space/v1/auth/me" \
  -H "Content-Type: application/json"

# Тест с неправильным initData (должен вернуть 401)
curl -X GET "https://api.outlivion.space/v1/auth/me" \
  -H "Authorization: test_init_data" \
  -H "Content-Type: application/json"
```

## Следующие шаги

1. Открыть приложение в Telegram
2. Открыть DevTools (если возможно)
3. Проверить логи на сервере
4. Проверить запросы в Network tab
5. Сравнить botToken на клиенте и сервере

