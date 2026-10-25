import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  BusinessProvider,
  businessStorageKey,
  useBusinessContext,
} from '@/features/loyalty/businessContext';
import type { Business, BusinessRole } from '@/types';

function business(id: string, role: BusinessRole): Business {
  return {
    id,
    name: `Negocio ${id}`,
    slug: `negocio-${id}`,
    timezone: 'America/Bogota',
    operating_days: [1, 2, 3, 4, 5, 6],
    is_active: true,
    created_by: 'user-1',
    created_at: '2026-01-01T12:00:00.000Z',
    updated_at: '2026-01-01T12:00:00.000Z',
    role,
    can_approve_redemptions: false,
  };
}

const first = business('a', 'admin');
const second = business('b', 'cliente');

function wrapperFor(userId: string, businesses: Business[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <BusinessProvider userId={userId} businesses={businesses}>
        {children}
      </BusinessProvider>
    );
  };
}

describe('BusinessProvider', () => {
  it('selecciona el primer negocio y guarda la elección por usuario', () => {
    const { result } = renderHook(() => useBusinessContext(), {
      wrapper: wrapperFor('user-1', [first, second]),
    });

    expect(result.current.selectedBusiness?.id).toBe('a');
    expect(result.current.selectedRole).toBe('admin');

    act(() => result.current.setSelectedBusiness(second));

    expect(result.current.selectedBusiness?.id).toBe('b');
    expect(result.current.selectedRole).toBe('cliente');
    expect(localStorage.getItem(businessStorageKey('user-1'))).toBe('b');
    expect(localStorage.getItem(businessStorageKey('user-2'))).toBeNull();
  });

  it('restaura la última selección del usuario', () => {
    localStorage.setItem(businessStorageKey('user-1'), 'b');

    const { result } = renderHook(() => useBusinessContext(), {
      wrapper: wrapperFor('user-1', [first, second]),
    });

    expect(result.current.selectedBusiness?.id).toBe('b');
  });

  it('permite volver al selector de negocio', () => {
    const { result } = renderHook(() => useBusinessContext(), {
      wrapper: wrapperFor('user-1', [first, second]),
    });

    act(() => result.current.setSelectedBusiness(null));

    expect(result.current.selectedBusiness).toBeNull();
    expect(result.current.selectedRole).toBeNull();
    expect(localStorage.getItem(businessStorageKey('user-1'))).toBeNull();
  });
});
