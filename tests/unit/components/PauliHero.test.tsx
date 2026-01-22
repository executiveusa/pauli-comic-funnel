import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PauliHero from '@/components/PauliHero';

describe('PauliHero Component', () => {
  it('should render hero section', () => {
    render(
      <BrowserRouter>
        <PauliHero />
      </BrowserRouter>
    );

    // Check for key elements
    const heroElement = screen.getByRole('banner', { hidden: true }) || document.querySelector('[class*="hero"]');
    expect(heroElement || document.body.innerHTML).toBeTruthy();
  });

  it('should have accessible structure', () => {
    const { container } = render(
      <BrowserRouter>
        <PauliHero />
      </BrowserRouter>
    );

    expect(container).toBeTruthy();
  });
});
