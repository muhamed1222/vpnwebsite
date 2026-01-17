import { describe, it, expect } from 'vitest';
import { render, screen } from '@/lib/test-utils';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('должен отображаться', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status', { name: /загрузка/i });
    expect(spinner).toBeInTheDocument();
  });

  it('должен отображать текст, если передан', () => {
    render(<LoadingSpinner text="Загрузка данных..." />);
    expect(screen.getByText('Загрузка данных...')).toBeInTheDocument();
  });

  it('не должен отображать текст, если не передан', () => {
    render(<LoadingSpinner />);
    const textElements = screen.queryByText(/загрузка/i);
    // Текст может быть только в aria-label, не в видимом тексте
    expect(textElements).not.toBeInTheDocument();
  });

  it('должен применять размер sm', () => {
    render(<LoadingSpinner size="sm" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('w-4', 'h-4');
  });

  it('должен применять размер md по умолчанию', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('должен применять размер lg', () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('w-12', 'h-12');
  });

  it('должен применять дополнительные классы', () => {
    render(<LoadingSpinner className="custom-class" />);
    const container = screen.getByRole('status').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('должен иметь правильный aria-label', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status', { name: /загрузка/i });
    expect(spinner).toHaveAttribute('aria-label', 'Загрузка');
  });
});
