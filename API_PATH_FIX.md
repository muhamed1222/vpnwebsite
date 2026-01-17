# 🔧 Исправление пути к Backend API

**Проблема:** Frontend использовал неправильный путь `/api/contest/active` вместо `/v1/contest/active`

---

## ✅ Исправления

### 1. Файл: `app/api/contest/active/route.ts`

**Было:**
```typescript
const backendResponse = await fetch(`${BACKEND_API_URL}/api/contest/active`, {
```

**Стало:**
```typescript
const backendResponse = await fetch(`${BACKEND_API_URL}/v1/contest/active`, {
```

### 2. Файл: `app/api/admin/contest/participants/route.ts`

**Было:**
```typescript
const backendResponse = await fetch(
  `${BACKEND_API_URL}/api/admin/contest/participants?contest_id=${contestId}`,
```

**Стало:**
```typescript
const backendResponse = await fetch(
  `${BACKEND_API_URL}/v1/admin/contest/participants?contest_id=${contestId}`,
```

---

## 📋 Структура Backend API

Backend API использует префикс `/v1/` для всех роутов:

- ✅ `/v1/contest/active` - активный конкурс
- ✅ `/v1/referral/summary` - статистика рефералов
- ✅ `/v1/referral/friends` - список друзей
- ✅ `/v1/referral/tickets` - история билетов
- ✅ `/v1/admin/contest/participants` - участники конкурса (админ)

---

## ⚠️ Важно

После исправления нужно:
1. Пересобрать проект на Vercel
2. Проверить, что админ-панель теперь загружает конкурс

---

**Исправлено:** ✅ Путь обновлен на `/v1/contest/active`
