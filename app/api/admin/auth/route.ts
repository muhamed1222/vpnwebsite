import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';

/**
 * POST /api/admin/auth
 * Авторизация админа по паролю
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Пароль не указан' },
        { status: 400 }
      );
    }

    // Проверяем пароль
    if (ADMIN_PASSWORD && password === ADMIN_PASSWORD) {
      // Создаем простую сессию (можно улучшить с JWT)
      const sessionToken = Buffer.from(`admin_${Date.now()}_${Math.random()}`).toString('base64');
      
      // Устанавливаем cookie с сессией (httpOnly для безопасности)
      const response = NextResponse.json({ success: true });
      
      // Сохраняем сессию в cookie
      response.cookies.set('admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 часа
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Неверный пароль' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/auth
 * Проверка существующей сессии
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');

    if (session && session.value) {
      return NextResponse.json({ success: true, authenticated: true });
    }

    return NextResponse.json({ success: false, authenticated: false });
  } catch (error) {
    return NextResponse.json({ success: false, authenticated: false });
  }
}
