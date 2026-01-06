# Как проверить логи vpn_api на сервере

## Способ 1: Через journalctl (рекомендуется)

Сервис работает через systemd, поэтому логи находятся в journalctl:

```bash
# Смотреть логи в реальном времени
ssh root@72.56.93.135 "journalctl -u outlivion-api -f"

# Последние 100 строк
ssh root@72.56.93.135 "journalctl -u outlivion-api -n 100 --no-pager"

# Логи с фильтром по ключевым словам
ssh root@72.56.93.135 "journalctl -u outlivion-api -n 200 --no-pager | grep -E 'verifyAuth|initData|Unauthorized|Authorization|error|Error'"
```

## Способ 2: Через файл логов (если настроен)

Если файл логов создан:

```bash
# Смотреть в реальном времени
ssh root@72.56.93.135 "tail -f /var/log/outlivion-api.log"

# Последние 100 строк
ssh root@72.56.93.135 "tail -100 /var/log/outlivion-api.log"
```

## Проверка статуса сервиса

```bash
# Статус сервиса
ssh root@72.56.93.135 "systemctl status outlivion-api"

# Перезапуск сервиса
ssh root@72.56.93.135 "systemctl restart outlivion-api"
```

## Что искать в логах при проблемах с авторизацией

1. **Ошибки валидации initData:**
   - `[verifyAuth] initData validation failed`
   - `Hash verification failed`
   - `auth_date too old`

2. **Ошибки авторизации:**
   - `Unauthorized`
   - `Authentication required`
   - `No initData in Authorization header`
   - `No botToken provided`

3. **Успешные запросы:**
   - `request completed` со статусом 200
   - Запросы к `/v1/auth/me`

## Тестовый запрос для проверки

```bash
# Запрос без авторизации (должен вернуть 401)
curl -X GET "https://api.outlivion.space/v1/auth/me" \
  -H "Content-Type: application/json"

# Запрос с неправильным initData (должен вернуть 401)
curl -X GET "https://api.outlivion.space/v1/auth/me" \
  -H "Authorization: test_init_data" \
  -H "Content-Type: application/json"
```

