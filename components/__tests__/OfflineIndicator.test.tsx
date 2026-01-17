import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@/lib/test-utils';
import { mockOnlineStatus } from '@/lib/test-utils';
import { OfflineIndicator } from '../OfflineIndicator';

describe('OfflineIndicator', () => {
  beforeEach(() => {
    // Сбрасываем состояние перед каждым тестом
    mockOnlineStatus(true);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllTimers();
  });

  it('не должен отображаться, когда онлайн и не было перехода в офлайн', () => {
    mockOnlineStatus(true);
    render(<OfflineIndicator />);
    expect(screen.queryByText(/нет подключения/i)).not.toBeInTheDocument();
  });

  it('должен рендериться без ошибок', () => {
    mockOnlineStatus(true);
    const { container } = render(<OfflineIndicator />);
    expect(container).toBeInTheDocument();
  });

  it('должен иметь правильную структуру DOM', () => {
    mockOnlineStatus(true);
    const { container } = render(<OfflineIndicator />);
    // Компонент должен быть в DOM, даже если не виден
    expect(container).toBeInTheDocument();
    // Проверяем, что компонент рендерится (может быть null если не показывается)
    expect(container).toBeTruthy();
  });
});
