#!/bin/bash
cd "/Users/kelemetovmuhamed/Documents/vpnwebsite"

echo "=== ДИАГНОСТИКА ПРОЕКТА ==="
echo ""

echo "1. Проверка Node.js и npm:"
node --version 2>&1 || echo "  ❌ Node.js не установлен"
npm --version 2>&1 || echo "  ❌ npm не установлен"
echo ""

echo "2. Проверка файлов проекта:"
test -f "package.json" && echo "  ✅ package.json" || echo "  ❌ package.json не найден"
test -f "next.config.ts" && echo "  ✅ next.config.ts" || echo "  ❌ next.config.ts не найден"
test -d "app" && echo "  ✅ app/" || echo "  ❌ app/ не найдена"
test -d "lib" && echo "  ✅ lib/" || echo "  ❌ lib/ не найдена"
echo ""

echo "3. Проверка зависимостей:"
if [ -d "node_modules" ]; then
    echo "  ✅ node_modules существует"
    test -d "node_modules/next" && echo "  ✅ Next.js установлен" || echo "  ❌ Next.js не установлен"
else
    echo "  ❌ node_modules не существует - нужно запустить npm install"
fi
echo ""

echo "4. Проверка порта 3000:"
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "  ⚠️  Порт 3000 занят процессом: $(lsof -ti:3000)"
else
    echo "  ✅ Порт 3000 свободен"
fi
echo ""

echo "5. Попытка запуска dev сервера:"
echo "   Выполняю: npm run dev"
echo ""

