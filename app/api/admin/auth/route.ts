import { NextRequest, NextResponse } from 'next/server';
import { withApiErrorHandling } from '@/lib/utils/api-handler';
import { 
  createAdminSessionToken, 
  setAdminSessionCookie,
  isAdminSessionValid 
} from '@/lib/utils/admin-session';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';

/**
 * POST /api/admin/auth
 * Авторизация админа по паролю
 */
export async function POST(request: NextRequest) {
  return withApiErrorHandling(async (req) => {
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Пароль не указан' },
        { status: 400 }
      );
    }

    // Проверяем пароль
    if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Неверный пароль' },
        { status: 401 }
      );
    }

    // Создаем сессию
    const sessionToken = createAdminSessionToken();
    const response = NextResponse.json({ success: true });
    setAdminSessionCookie(response, sessionToken);

    return response;
  }, request, {
    page: 'api',
    action: 'adminAuth',
    endpoint: '/api/admin/auth',
  });
}

/**
 * GET /api/admin/auth
 * Проверка существующей сессии
 */
export async function GET() {
  try {
    const isValid = await isAdminSessionValid();
    return NextResponse.json({ 
      success: isValid, 
      authenticated: isValid 
    });
  } catch {
    return NextResponse.json({ 
      success: false, 
      authenticated: false 
    });
  }
}
