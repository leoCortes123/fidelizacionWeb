import { describe, expect, it } from 'vitest';
import {
  AUDIT_LABELS,
  LEGACY_AUDIT_LABELS,
  auditSubject,
  auditOperationsByCategory,
  describeAudit,
  getAuditCategory,
  getAuditEntityLabel,
  getAuditLabel,
} from '@/features/admin/auditLabels';

/**
 * Operaciones que la base de datos inserta en `business_audit_logs`. Si la
 * base añade una operación nueva, esta lista obliga a darle etiqueta.
 */
const BUSINESS_OPERATIONS = [
  'business.created',
  'business.logo_removed',
  'business.logo_updated',
  'business.profile_updated',
  'business.updated',
  'budget.snapshot',
  'campaign.created',
  'campaign.deleted',
  'campaign.updated',
  'economic_profile.updated',
  'loyalty_program.configured',
  'loyalty_program.frequent_updated',
  'membership.admin',
  'membership.created',
  'membership.joined',
  'membership.permission_updated',
  'points.expired',
  'product.combo_updated',
  'purchase.qr_cancelled',
  'purchase.qr_claimed',
  'purchase.qr_created',
  'purchase.registered',
  'purchase.reverted',
  'redemption.approved',
  'redemption.cancelled',
  'redemption.delivered',
  'redemption.requested',
  'redemption.scanned',
  'redemption.token_reissued',
  'reward.created',
  'reward.updated',
];

describe('auditLabels', () => {
  it('tiene etiqueta para todas las operaciones auditadas del negocio', () => {
    for (const operation of BUSINESS_OPERATIONS) {
      const label = AUDIT_LABELS[operation];
      expect(label, `falta etiqueta para ${operation}`).toBeDefined();
      expect(label.label.length).toBeGreaterThan(0);
      expect(label.description.length).toBeGreaterThan(0);
    }
  });

  it('traduce las operaciones conocidas y deja una etiqueta legible para las nuevas', () => {
    expect(getAuditLabel('purchase.registered').label).toBe('Compra registrada');
    expect(getAuditLabel('redemption.delivered').label).toBe('Recompensa entregada');

    const fallback = getAuditLabel('foo.new_operation');
    expect(fallback.label).toBe('Foo · new operation');
    expect(fallback.severity).toBe('neutral');
  });

  it('traduce también las operaciones de la auditoría legada de plataforma', () => {
    expect(getAuditLabel('purchase.claimed').label).toBe('Compra reclamada');
    expect(getAuditLabel('settings.updated').label).toBe(
      'Configuración global actualizada',
    );
    expect(getAuditLabel('role.revoked').label).toBe('Rol revocado');
    expect(LEGACY_AUDIT_LABELS['role.granted'].category).toBe('team');
  });

  it('no ofrece en el filtro operaciones que solo existen en la auditoría legada', () => {
    const offered = [
      ...auditOperationsByCategory('purchase'),
      ...auditOperationsByCategory('team'),
      ...auditOperationsByCategory('configuration'),
    ];
    expect(offered).not.toContain('purchase.claimed');
    expect(offered).not.toContain('role.granted');
    expect(offered).not.toContain('settings.updated');
  });

  it('clasifica por categoría y traduce la entidad', () => {
    expect(getAuditCategory('purchase.qr_created').label).toBe('Compras');
    expect(getAuditCategory('business.profile_updated').label).toBe('Configuración');
    expect(getAuditEntityLabel('loyalty_redemption')).toBe('Canje');
    expect(getAuditEntityLabel('custom_entity')).toBe('Custom entity');
  });

  it('resume compras con importe y loopoints', () => {
    const subject = auditSubject({
      operation: 'purchase.registered',
      metadata: { amount_cop: 15500, points_earned: 15 },
    });
    expect(subject).toContain('Compra por');
    expect(subject).toContain('15.500');
    expect(subject).toContain('15 loopoints');
  });

  it('resume canjes y membresías', () => {
    expect(
      auditSubject({
        operation: 'redemption.delivered',
        metadata: { reward_name: 'Taco individual', points_spent: 40 },
      }),
    ).toBe('Taco individual · 40 loopoints');

    expect(
      auditSubject({
        operation: 'membership.created',
        metadata: { role: 'encargado' },
      }),
    ).toBe('Encargado');
  });

  it('formatea el detalle de una compra sin exponer IDs técnicos', () => {
    const description = describeAudit({
      operation: 'purchase.registered',
      metadata: {
        customer_id: '11111111-1111-4111-8111-111111111111',
        amount_cop: 15500,
        eligible_amount_cop: 15000,
        points_earned: 15,
      },
    });

    const labels = description.fields.map((field) => field.label);
    expect(labels).toEqual([
      'Valor de la compra',
      'Valor elegible',
      'Loopoints sumados',
    ]);
    expect(labels).not.toContain('Customer id');
    expect(description.fields[0].value).toMatch(/15\.500/);
    expect(description.fields[2].value).toBe('15 loopoints');
  });

  it('muestra solo los campos que cambiaron en before/after', () => {
    const description = describeAudit({
      operation: 'business.profile_updated',
      metadata: {
        before: { name: 'Taquería El Fogón', city: null, phone: '300 111 1111' },
        after: {
          name: 'Taquería El Fogón Centro',
          city: 'Bogotá',
          phone: '300 111 1111',
        },
      },
    });

    expect(description.changes).toEqual([
      {
        label: 'Nombre',
        before: 'Taquería El Fogón',
        after: 'Taquería El Fogón Centro',
      },
      {
        label: 'Ciudad',
        before: 'Sin definir',
        after: 'Bogotá',
      },
    ]);
  });

  it('presenta la primera configuración del programa como campos legibles', () => {
    const description = describeAudit({
      operation: 'loyalty_program.configured',
      metadata: {
        before: null,
        after: {
          id: '11111111-1111-4111-8111-111111111111',
          business_id: '22222222-2222-4222-8222-222222222222',
          cop_per_point_unit: 1000,
          points_expiry_days: 365,
          budget_rate: 0.01,
          operating_days: [1, 2, 3],
        },
      },
    });

    const byLabel = new Map(
      description.fields.map((field) => [field.label, field.value]),
    );
    expect(byLabel.get('COP por loopoint')).toBe('1.000');
    expect(byLabel.get('Días de vencimiento')).toBe('365');
    expect(byLabel.get('Tasa de presupuesto')).toBe('1.00 %');
    expect(byLabel.get('Días de operación')).toBe('Lun · Mar · Mié');
    expect(byLabel.has('Id')).toBe(false);
    expect(byLabel.has('Business id')).toBe(false);
  });

  it('traduce los estados de los datos económicos', () => {
    const description = describeAudit({
      operation: 'economic_profile.updated',
      metadata: {
        data_status: {
          daily_avg_sales: 'confirmed',
          monthly_operation_days: 'estimated',
        },
      },
    });

    expect(description.fields).toEqual([
      { label: 'Ventas diarias promedio', value: 'Confirmado' },
      { label: 'Días de operación al mes', value: 'Estimado' },
    ]);
  });

  it('resume los componentes de un combo sin mostrar sus IDs', () => {
    const description = describeAudit({
      operation: 'product.combo_updated',
      metadata: {
        items: [
          { product_id: '11111111-1111-4111-8111-111111111111', quantity: 2 },
          { product_id: '22222222-2222-4222-8222-222222222222', quantity: 1 },
        ],
      },
    });

    expect(description.fields).toEqual([
      { label: 'Componentes del combo', value: '2 productos del combo' },
    ]);
  });

  it('resumen las operaciones legadas con importes y loopoints', () => {
    const purchase = auditSubject({
      operation: 'purchase.claimed',
      metadata: { amount_cop: 15500, points_awarded: 15 },
    });
    expect(purchase).toContain('Compra por');
    expect(purchase).toContain('15.500');
    expect(purchase).toContain('15 loopoints');

    expect(
      auditSubject({
        operation: 'redemption.cancelled_by_admin',
        metadata: { reward_name: 'Taco individual', points_refunded: 40 },
      }),
    ).toBe('Taco individual · 40 loopoints');
  });
});
