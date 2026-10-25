import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuditPage } from '@/features/admin/AuditPage';
import type { Business, BusinessAuditLog } from '@/types';

const calls = vi.hoisted(() => [] as unknown[][]);

const fixture = vi.hoisted(() => ({
  business: {
    id: 'biz-1',
    name: 'Taquería El Fogón',
    slug: 'taqueria-el-fogon',
    timezone: 'America/Bogota',
    operating_days: [1, 2, 3, 4, 5, 6],
    is_active: true,
    created_by: 'user-admin',
    created_at: '2026-01-01T12:00:00.000Z',
    updated_at: '2026-01-01T12:00:00.000Z',
    role: 'admin' as const,
    can_approve_redemptions: false,
  },
  rows: [
    {
      id: 'log-1',
      business_id: 'biz-1',
      actor_email: 'admin@example.test',
      operation: 'purchase.registered',
      entity_type: 'loyalty_purchase_event',
      entity_id: 'event-1234567890',
      metadata: { amount_cop: 15500, points_earned: 15 },
      created_at: '2026-10-25T12:00:00.000Z',
      total_count: 30,
    },
    {
      id: 'log-2',
      business_id: 'biz-1',
      actor_email: 'admin@example.test',
      operation: 'redemption.delivered',
      entity_type: 'loyalty_redemption',
      entity_id: 'redemption-9876543210',
      metadata: { points_spent: 10 },
      created_at: '2026-10-24T12:00:00.000Z',
      total_count: 30,
    },
  ] as BusinessAuditLog[],
}));

vi.mock('@/features/loyalty/hooks', () => ({
  useBusinesses: () => ({
    data: [fixture.business],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useBusinessAuditLog: (...args: unknown[]) => {
    calls.push(args);
    return {
      data: fixture.rows,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
  },
}));

vi.mock('@/features/loyalty/businessContext', () => ({
  useBusinessContext: () => ({
    selectedBusiness: fixture.business as Business,
    businesses: [fixture.business],
    selectedRole: 'admin',
    canApproveRedemptions: false,
    setSelectedBusiness: vi.fn(),
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AuditPage />
    </MemoryRouter>,
  );
}

describe('AuditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calls.length = 0;
  });

  it('lista las operaciones auditadas', () => {
    renderPage();

    expect(screen.getByText('purchase.registered')).toBeInTheDocument();
    expect(screen.getByText('redemption.delivered')).toBeInTheDocument();
    expect(screen.getAllByText('admin@example.test')).toHaveLength(2);
    expect(screen.getByText(/30 operaciones · página 1 de 2/i)).toBeInTheDocument();
  });

  it('abre el detalle con la metadata de la operación', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole('button', { name: 'Ver detalle de purchase.registered' }),
    );

    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText(/amount_cop/i)).toBeInTheDocument();
    expect(dialog.getByText(/15500/)).toBeInTheDocument();
  });

  it('filtra por operación y reinicia la página', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Filtrar por operación'), 'purchase');
    await user.click(screen.getByRole('button', { name: 'Filtrar' }));

    await waitFor(() => {
      const last = calls[calls.length - 1];
      expect(last).toEqual(['biz-1', 'purchase', 25, 0]);
    });
  });

  it('pagina los resultados en el servidor', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Siguiente/i }));

    await waitFor(() => {
      const last = calls[calls.length - 1];
      expect(last).toEqual(['biz-1', '', 25, 25]);
    });
  });
});
