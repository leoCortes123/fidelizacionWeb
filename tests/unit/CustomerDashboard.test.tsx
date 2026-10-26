import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '@/features/customer/DashboardPage';
import type { CatalogueReward } from '@/types';

const available: CatalogueReward = {
  id: 'reward-1',
  name: 'Taco individual',
  description: 'Un taco de guisado.',
  image_url: null,
  points_cost: 10,
  balance: 15,
  remaining: 0,
  can_redeem: true,
};

const locked: CatalogueReward = {
  id: 'reward-2',
  name: 'Combo grande',
  description: 'Tres tacos y agua fresca.',
  image_url: null,
  points_cost: 100,
  balance: 15,
  remaining: 85,
  can_redeem: false,
};

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    displayName: 'Carla Cliente',
    user: { email: 'carla@example.test' },
  }),
}));

vi.mock('@/features/points/hooks', () => ({
  useDashboard: () => ({
    data: {
      points_balance: 15,
      purchase_count: 1,
      total_spent_cop: 15500,
      ready_rewards: 1,
      pending_redemptions: 0,
      next_reward: null,
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useMyPurchases: () => ({
    data: [
      {
        id: 'purchase-1',
        amount_cop: 15500,
        points_awarded: 15,
        claimed_at: '2026-10-22T02:00:00.000Z',
        created_at: '2026-10-22T01:55:00.000Z',
        total_count: 1,
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useProgramSettings: () => ({
    data: { cop_per_point_unit: 1000 },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@/features/rewards/hooks', () => ({
  useRewards: () => ({
    data: [available, locked],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe('DashboardPage del cliente', () => {
  it('muestra correo, saldo grande y recompensas disponibles', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('carla@example.test')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText(/¡Hola, Carla!/i)).toBeInTheDocument();

    expect(screen.getByText('Taco individual')).toBeInTheDocument();
    expect(screen.getByText('Disponible')).toBeInTheDocument();
    expect(screen.getByText(/faltan 85/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^canjear$/i })).toBeNull();
  });

  it('muestra los loopoints ganados en compras recientes', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('+15 pts')).toBeInTheDocument();
  });
});
