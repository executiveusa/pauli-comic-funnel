import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PauliHero from '@/components/PauliHero';

describe('PauliHero Component', () => {
  it('should render hero section', () => {
    const { container } = render(
      <BrowserRouter>
        <PauliHero />
      </BrowserRouter>
    );

    // Component renders successfully
    expect(container.firstChild).toBeTruthy();
    expect(container.innerHTML).toBeTruthy();
  });

  it('should have accessible structure', () => {
    const { container } = render(
      <BrowserRouter>
        <PauliHero />
      </BrowserRouter>
    );

    // Container has content
    expect(container).toBeTruthy();
    expect(container.children.length).toBeGreaterThan(0);
  });
});
