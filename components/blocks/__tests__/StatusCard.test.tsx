import { describe, it, expect } from 'vitest';
import { render, screen } from '@/lib/test-utils';
import { StatusCard } from '../StatusCard';

describe('StatusCard', () => {
  it('должен отображаться', () => {
    render(<StatusCard status="active" expiresAt="2025-02-27T00:00:00Z" />);
    expect(screen.getByTestId('status-card')).toBeInTheDocument();
  });

  it('должен отображать статус "active"', () => {
    render(<StatusCard status="active" expiresAt="2025-02-27T00:00:00Z" />);
    expect(screen.getByText(/подключено/i)).toBeInTheDocument();
    expect(screen.getByText(/подключиться/i)).toBeInTheDocument();
  });

  it('должен отображать статус "expired"', () => {
    render(<StatusCard status="expired" />);
    expect(screen.getByText(/подписка истекла/i)).toBeInTheDocument();
    expect(screen.getByText(/купить подписку/i)).toBeInTheDocument();
  });

  it('должен отображать статус "none"', () => {
    render(<StatusCard status="none" />);
    expect(screen.getByText(/нет подписки/i)).toBeInTheDocument();
    expect(screen.getByText(/начать/i)).toBeInTheDocument();
  });

  it('должен отображать статус "loading"', () => {
    render(<StatusCard status="loading" />);
    expect(screen.getByText(/загрузка/i)).toBeInTheDocument();
    // При loading не должно быть кнопки
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('должен отображать дату истечения для активной подписки', () => {
    const expiresAt = '2025-02-27T00:00:00Z';
    render(<StatusCard status="active" expiresAt={expiresAt} />);
    expect(screen.getByText(new RegExp(expiresAt.split('T')[0]))).toBeInTheDocument();
  });
});
