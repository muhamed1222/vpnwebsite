# Исправление отображения скидки в мини-приложении

## Проблема

Промокод применялся в боте и скидка сохранялась в базе данных, но в мини-приложении:
- Не отображалась информация о скидке
- Цены не обновлялись с учетом скидки
- Пользователь не видел, что у него есть скидка

## Решение

Добавлено отображение скидки в UI мини-приложения.

### Изменения

#### 1. API endpoint `/api/me` - возвращает скидку
**Файл:** `vpn_bot/src/routes/api.ts`

Добавлена проверка и возврат скидки пользователя:
```typescript
let discountPercent = user?.discountPercent || 0;
const discountExpiresAt = user?.discountExpiresAt;
if (discountPercent && discountExpiresAt && discountExpiresAt <= Date.now()) {
    await DB.clearUserDiscount(tgUser.id);
    discountPercent = 0;
}

res.json({
    id: user.id,
    firstName: user.firstName,
    subscription: user.subscription,
    discount: discountPercent > 0 ? {
        percent: discountPercent,
        expiresAt: discountExpiresAt
    } : null
});
```

#### 2. API клиент - получает скидку
**Файл:** `vpnwebsite/lib/api.ts`

Обновлен тип ответа и возврат скидки:
```typescript
return {
    user: { ... },
    subscription: { ... },
    discount: data.discount || null,
};
```

#### 3. Стор подписки - хранит скидку
**Файл:** `vpnwebsite/store/subscription.store.ts`

Добавлено поле `discount` в стор:
```typescript
interface SubscriptionState {
    // ...
    discount: {
        percent: number;
        expiresAt?: number;
    } | null;
    setDiscount: (discount: { percent: number; expiresAt?: number } | null) => void;
}
```

#### 4. Функция login - сохраняет скидку
**Файл:** `vpnwebsite/lib/auth.ts`

При авторизации сохраняется скидка:
```typescript
if (data.discount) {
    subStore.setDiscount(data.discount);
} else {
    subStore.setDiscount(null);
}
```

#### 5. Страница покупки - применяет скидку к ценам
**Файл:** `vpnwebsite/app/(auth)/purchase/page.tsx`

- Добавлена функция `applyDiscount` для расчета цены со скидкой
- При преобразовании тарифов применяется скидка к ценам
- Сохраняется оригинальная цена для отображения

```typescript
const discountPercent = discount?.percent || 0;
const totalPrice = discountPercent > 0 
    ? applyDiscount(originalPrice, discountPercent)
    : originalPrice;
```

#### 6. UI - отображение скидки
**Файл:** `vpnwebsite/app/(auth)/purchase/page.tsx`

- Показывается цена со скидкой
- Оригинальная цена показывается зачеркнутой
- Отображается процент скидки

```typescript
{plan.originalPrice && plan.originalPrice > plan.totalPrice ? (
    <>
        <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">
                {plan.totalPrice} ₽
            </span>
            <span className="text-sm text-white/40 line-through">
                {plan.originalPrice} ₽
            </span>
        </div>
        {discount && discount.percent > 0 && (
            <div className="text-[10px] font-bold text-green-500 mt-0.5">
                -{discount.percent}%
            </div>
        )}
    </>
) : (
    <span className="text-xl font-bold text-white">
        {plan.totalPrice} ₽
    </span>
)}
```

## Как это работает

1. **Пользователь активирует промокод в боте:**
   - Отправляет промокод боту (например, `MEGA99`)
   - Бот применяет скидку 99%
   - Скидка сохраняется в `users.discount_percent`

2. **Пользователь открывает мини-приложение:**
   - При авторизации вызывается `/api/me`
   - API возвращает информацию о скидке
   - Скидка сохраняется в стор

3. **Пользователь переходит на страницу покупки:**
   - Загружаются тарифы с бэкенда
   - К каждой цене применяется скидка
   - В UI показывается:
     - Цена со скидкой (крупным шрифтом)
     - Оригинальная цена (зачеркнутая)
     - Процент скидки (зеленым цветом)

4. **При создании заказа:**
   - Скидка уже применена к цене в `vpn_api`
   - Пользователь платит цену со скидкой

## Пример отображения

**Без скидки:**
```
99 ₽
```

**Со скидкой 99%:**
```
1 ₽    99 ₽
-99%
```

## Важно

- Скидка применяется автоматически при загрузке тарифов
- Минимальная цена: 1 рубль (защита от нуля)
- Скидка показывается только если она активна (не истекла)
- После покупки скидка сбрасывается автоматически
