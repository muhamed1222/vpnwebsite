import { describe, it, expect } from 'vitest';
import { render, screen } from '@/lib/test-utils';
import { SkeletonLoader } from '../SkeletonLoader';

describe('SkeletonLoader variants', () => {
  it('должен отображать текстовый вариант с несколькими строками', () => {
    render(<SkeletonLoader variant="text" lines={3} />);
    const skeleton = screen.getByTestId('skeleton-loader');
    expect(skeleton).toBeInTheDocument();
    // Проверяем, что есть 3 дочерних элемента (строки)
    expect(skeleton.children.length).toBe(3);
  });

  it('должен отображать круговой вариант', () => {
    render(<SkeletonLoader variant="circular" />);
    const skeleton = screen.getByTestId('skeleton-loader');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveStyle({ borderRadius: '50%' });
  });

  it('должен отображать прямоугольный вариант по умолчанию', () => {
    render(<SkeletonLoader />);
    const skeleton = screen.getByTestId('skeleton-loader');
    expect(skeleton).toBeInTheDocument();
  });

  it('должен применять кастомные размеры', () => {
    render(<SkeletonLoader width="200px" height="50px" />);
    const skeleton = screen.getByTestId('skeleton-loader');
    expect(skeleton).toHaveStyle({ width: '200px', height: '50px' });
  });
});
