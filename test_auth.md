# Тестирование авторизации

## Проблема
Сайт не подключается к проекту, возможно авторизация не работает.

## Что нужно проверить

1. **Проверить, что initData передается из Telegram WebApp**
   - Открыть DevTools в браузере
   - Проверить, что `window.Telegram.WebApp.initData` существует
   - Проверить, что initData не пустой

2. **Проверить запросы к API**
   - Открыть Network tab в DevTools
   - Проверить запрос к `/api/me`
   - Проверить заголовок `Authorization` - должен содержать initData
   - Проверить статус ответа

3. **Проверить логи на сервере**
   - Проверить логи vpn_api на сервере
   - Искать сообщения об ошибках валидации initData

4. **Проверить переменные окружения**
   - `TELEGRAM_BOT_TOKEN` должен быть установлен на сервере
   - `NEXT_PUBLIC_API_BASE_URL` должен быть правильным

## Команды для проверки

```bash
# Проверить логи на сервере
ssh root@72.56.93.135 "tail -100 /var/log/outlivion-api.log | grep -E 'verifyAuth|initData|Unauthorized'"

# Проверить переменные окружения на сервере
ssh root@72.56.93.135 "cd /opt/outlivion-api && grep TELEGRAM_BOT_TOKEN .env"

# Тестовый запрос к API
curl -X GET "https://api.outlivion.space/v1/auth/me" \
  -H "Authorization: test_init_data" \
  -H "Content-Type: application/json"
```

## Возможные проблемы

1. **initData не передается** - проверьте, что приложение открыто через Telegram
2. **Валидация не работает** - проверьте, что botToken правильный
3. **Роут не найден** - проверьте, что сервис запущен и обновлен

