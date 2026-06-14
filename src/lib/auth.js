export const isAdmin = (role) => role === 'admin'
export const isWarehouse = (role) => role === 'warehouse'
export const isSales = (role) => role === 'sales'
export const canViewDashboard = (role) => isAdmin(role)
export const canEditProducts = (role) => isAdmin(role) || isWarehouse(role)
export const canViewPurchases = (role) => isAdmin(role) || isWarehouse(role)
export const canViewSales = (role) => isAdmin(role) || isSales(role)
export const canViewCustomers = (role) => isAdmin(role) || isSales(role)
export const canViewEmployees = (role) => isAdmin(role)
export const canViewLedger = (role) => isAdmin(role)
