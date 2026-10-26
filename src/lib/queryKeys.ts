export const queryKeys = {
  roles: ['my-roles'] as const,
  profile: ['my-profile'] as const,
  settings: ['program-settings'] as const,
  dashboard: ['my-dashboard'] as const,
  myPurchases: (limit: number, offset: number) =>
    ['my-purchases', limit, offset] as const,
  rewards: ['rewards'] as const,
  myRedemptions: ['my-redemptions'] as const,
  staffCustomers: (
    search: string,
    page: number,
    sort: string,
    direction: string,
  ) => ['staff-customers', search, page, sort, direction] as const,
  staffCustomer: (id: string) => ['staff-customer', id] as const,
  staffRedemptions: (status: string) => ['staff-redemptions', status] as const,
  adminSettings: ['admin-settings'] as const,
  adminRewards: ['admin-rewards'] as const,
  adminStaff: ['admin-staff'] as const,
  adminProfiles: (search: string) => ['admin-profiles', search] as const,
  auditLog: ['audit-log'] as const,
  configHistory: ['config-history'] as const,

  // Negocio y membresías
  businesses: ['businesses'] as const,
  business: (id: string) => ['business', id] as const,
  businessPublic: (slug: string) => ['business-public', slug] as const,
  businessMemberships: (businessId: string) =>
    ['business-memberships', businessId] as const,
  profileSearch: (businessId: string, query: string) =>
    ['profile-search', businessId, query] as const,

  // Programa y recompensas
  loyaltyProgram: (businessId: string) => ['loyalty-program', businessId] as const,  products: (businessId: string, onlyActive: boolean) =>
    ['products', businessId, onlyActive] as const,
  loyaltyRewards: (businessId: string, onlyActive: boolean) =>
    ['loyalty-rewards', businessId, onlyActive] as const,
  loyaltyRewardsAvailable: (businessId: string, customerId: string) =>
    ['loyalty-rewards-available', businessId, customerId] as const,

  // Loopoints y redenciones
  loyaltyPointAccount: (businessId: string, customerId: string) =>
    ['loyalty-point-account', businessId, customerId] as const,
  loyaltyPointTransactions: (businessId: string, customerId: string) =>
    ['loyalty-point-transactions', businessId, customerId] as const,
  loyaltyRedemptions: (businessId: string, status: string) =>
    ['loyalty-redemptions', businessId, status] as const,
  myLoyaltyRedemptions: ['my-loyalty-redemptions'] as const,

  // Ventas con QR por negocio
  purchaseQrPreview: (token: string) => ['purchase-qr-preview', token] as const,
  businessPurchases: (businessId: string, page: number, status: string) =>
    ['business-purchases', businessId, page, status] as const,

  // Económico y auditoría
  businessEconomicProfile: (businessId: string) =>
    ['business-economic-profile', businessId] as const,
  businessEconomicDashboard: (businessId: string) =>
    ['business-economic-dashboard', businessId] as const,
  businessAuditLog: (
    businessId: string,
    operation = '',
    limit = 50,
    offset = 0,
  ) => ['business-audit-log', businessId, operation, limit, offset] as const,
  businessAuditLogPrefix: (businessId: string) =>
    ['business-audit-log', businessId] as const,
  loyaltyCampaigns: (businessId: string, onlyActive: boolean) =>
    ['loyalty-campaigns', businessId, onlyActive] as const,
  budgetSnapshots: (businessId: string, limit: number) =>
    ['budget-snapshots', businessId, limit] as const,
};
