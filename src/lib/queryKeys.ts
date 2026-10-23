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
  staffPurchases: (page: number, status: string) =>
    ['staff-purchases', page, status] as const,
  staffRedemptions: (status: string) => ['staff-redemptions', status] as const,
  adminSettings: ['admin-settings'] as const,
  adminRewards: ['admin-rewards'] as const,
  adminStaff: ['admin-staff'] as const,
  adminProfiles: (search: string) => ['admin-profiles', search] as const,
  auditLog: ['audit-log'] as const,
  configHistory: ['config-history'] as const,
};
