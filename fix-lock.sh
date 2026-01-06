#!/bin/bash
# Скрипт для исправления проблемы с блокировкой Next.js

cd "/Users/kelemetovmuhamed/Documents/vpnwebsite"

echo "=== Исправление проблемы с блокировкой ==="
echo ""

# 1. Остановка всех процессов Next.js
echo "1. Останавливаю процессы Next.js..."
pkill -f "next dev" 2>/dev/null
sleep 2
echo "   ✅ Процессы остановлены"
echo ""

# 2. Удаление файла блокировки
echo "2. Удаляю файл блокировки..."
rm -rf .next/dev/lock .next/dev/*.pid 2>/dev/null
echo "   ✅ Файл блокировки удален"
echo ""

# 3. Очистка папки .next (опционально, раскомментируйте если нужно)
# echo "3. Очищаю папку .next..."
# rm -rf .next
# echo "   ✅ Папка .next очищена"
# echo ""

# 4. Освобождение портов
echo "3. Освобождаю порты 3000, 3001, 3002..."
lsof -ti:3000,3001,3002 2>/dev/null | xargs kill -9 2>/dev/null || true
echo "   ✅ Порты освобождены"
echo ""

echo "=== Готово! Теперь можно запустить: npm run dev ==="

