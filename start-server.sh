#!/bin/bash
cd "/Users/kelemetovmuhamed/Documents/vpnwebsite"

echo "=== ЗАПУСК СЕРВЕРА ==="
echo ""

# Проверка зависимостей
if [ ! -d "node_modules" ]; then
    echo "📦 Устанавливаю зависимости..."
    npm install
    echo ""
fi

# Остановка старого процесса
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "🛑 Останавливаю процесс на порту 3000..."
    kill $(lsof -ti:3000)
    sleep 2
    echo ""
fi

# Запуск сервера
echo "🚀 Запускаю dev сервер..."
echo "   Сайт будет доступен на: http://localhost:3000"
echo ""
npm run dev

