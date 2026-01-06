# Исправление ошибки "Invalid Telegram initData signature"

## Проблема
Ошибка "Invalid Telegram initData signature" появляется при попытке авторизации.

## Что исправлено

1. ✅ **Исправлена валидация initData на клиенте** - теперь используется оригинальное URL-encoded значение для `data_check_string`, как на сервере
2. ✅ **Исправлена валидация initData на сервере** - используется оригинальное URL-encoded значение

## Что нужно проверить

### 1. Проверить, что TELEGRAM_BOT_TOKEN установлен в Vercel

Токен на сервере: `7948235015:AAGX6npuaEhZwYXWPY72Xag-d5FxTf2r6lw`

Нужно убедиться, что такой же токен установлен в Vercel:

```bash
# Через Vercel CLI
vercel env ls

# Или через веб-интерфейс Vercel
# Settings → Environment Variables → TELEGRAM_BOT_TOKEN
```

### 2. Проверить логи на сервере

После исправления, когда пользователь попробует авторизоваться, проверьте логи:

```bash
ssh root@72.56.93.135 "journalctl -u outlivion-api -f"
```

Ищите сообщения:
- `[verifyAuth] initData validation failed` - ошибка валидации
- `Hash verification failed` - неверный хеш
- `No initData in Authorization header` - initData не передан

### 3. Если ошибка продолжается

Возможные причины:
1. **Разные botToken** - проверьте, что токен одинаковый на клиенте и сервере
2. **Старый initData** - попробуйте перезапустить приложение в Telegram
3. **Проблема с URL-encoding** - проверьте, что initData передается правильно

## Тестирование

После деплоя на Vercel:
1. Откройте приложение в Telegram
2. Попробуйте авторизоваться
3. Если ошибка сохраняется, проверьте логи на сервере

## Статус

✅ Клиентская валидация исправлена
✅ Серверная валидация исправлена
⏳ Ожидается деплой на Vercel

