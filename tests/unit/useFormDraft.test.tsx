import { act, renderHook } from '@testing-library/react';
import { useFormDraft } from '@/lib/useFormDraft';

interface Draft {
  amount: string;
  note: string;
}

describe('useFormDraft', () => {
  it('guarda y recupera un borrador', () => {
    const { result } = renderHook(() =>
      useFormDraft<Draft>({ key: 'test-form', version: 1 }),
    );

    act(() => result.current.save({ amount: '15000', note: 'hola' }));

    expect(result.current.hasDraft).toBe(true);

    const { result: restored } = renderHook(() =>
      useFormDraft<Draft>({ key: 'test-form', version: 1 }),
    );

    expect(restored.current.read()).toEqual({ amount: '15000', note: 'hola' });
  });

  it('descarta borradores de otra versión', () => {
    const { result } = renderHook(() =>
      useFormDraft<Draft>({ key: 'versioned', version: 1 }),
    );
    act(() => result.current.save({ amount: '1', note: '' }));

    const { result: nextVersion } = renderHook(() =>
      useFormDraft<Draft>({ key: 'versioned', version: 2 }),
    );

    expect(nextVersion.current.read()).toBeNull();
    expect(localStorage.getItem('loopoint:draft:versioned')).toBeNull();
  });

  it('limpia el borrador al guardar el formulario', () => {
    const { result } = renderHook(() => useFormDraft<Draft>({ key: 'clear-me' }));
    act(() => result.current.save({ amount: '10', note: '' }));
    act(() => result.current.clear());

    expect(result.current.hasDraft).toBe(false);
    expect(result.current.read()).toBeNull();
  });

  it('puede usar sessionStorage para datos de caja', () => {
    const { result } = renderHook(() =>
      useFormDraft<Draft>({ key: 'session-form', storage: 'session' }),
    );
    act(() => result.current.save({ amount: '20', note: '' }));

    expect(sessionStorage.getItem('loopoint:draft:session-form')).toContain('20');
    expect(localStorage.getItem('loopoint:draft:session-form')).toBeNull();
  });
});
