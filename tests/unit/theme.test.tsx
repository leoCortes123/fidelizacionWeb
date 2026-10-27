import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, usePortalTheme, useTheme } from '@/components/theme/ThemeProvider';

function ThemeProbe() {
  const { theme, toggleTheme } = useTheme();
  usePortalTheme('admin');
  return (
    <button type="button" onClick={toggleTheme}>
      Tema: {theme}
    </button>
  );
}

describe('ThemeProvider', () => {
  it('inicia en claro, alterna a oscuro y persiste la preferencia', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByRole('button')).toHaveTextContent('Tema: light');
    expect(document.documentElement).not.toHaveClass('dark');
    expect(document.documentElement.dataset.portal).toBe('admin');

    await user.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveTextContent('Tema: dark');
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('loopoint:theme')).toBe('dark');
  });

  it('restaura el tema guardado', () => {
    localStorage.setItem('loopoint:theme', 'dark');
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByRole('button')).toHaveTextContent('Tema: dark');
    expect(document.documentElement).toHaveClass('dark');
  });

  it('quita el portal al desmontar el shell', () => {
    const { unmount } = render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );
    expect(document.documentElement.dataset.portal).toBe('admin');
    unmount();
    expect(document.documentElement.dataset.portal).toBeUndefined();
  });

  it('exige estar dentro del proveedor', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ThemeProbe />)).toThrow('useTheme debe usarse dentro de ThemeProvider');
    spy.mockRestore();
  });
});
