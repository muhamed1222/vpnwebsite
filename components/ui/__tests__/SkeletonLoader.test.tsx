import { describe, it, expect } from 'vitest';
import { render, screen } from '@/lib/test-utils';
import { SkeletonLoader } from '../SkeletonLoader';

describe('SkeletonLoader', () => {
  it('должен отображаться', () => {
    render(<SkeletonLoader />);
    const skeleton = screen.getByTestId('skeleton-loader');
    expect(skeleton).toBeInTheDocument();
  });

  it('должен применять дополнительные классы', () => {
    render(<SkeletonLoader className="custom-class" />);
    const skeleton = screen.getByTestId('skeleton-loader');
    expect(skeleton).toHaveClass('custom-class');
  });

  it('должен иметь правильную структуру', () => {
    render(<SkeletonLoader />);
    const skeleton = screen.getByTestId('skeleton-loader');
    expect(skeleton).toHaveClass('animate-pulse');
  });
});
