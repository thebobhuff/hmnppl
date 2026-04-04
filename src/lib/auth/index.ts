/**
 * Auth module barrel export.
 *
 * Import everything auth-related from `@/lib/auth`:
 * ```ts
 * import { requireAuth, requireRole, withAuth, validateTenantOwnership } from "@/lib/auth";
 * ```
 */
export {
  getCurrentUser,
  requireAuth,
  requireRole,
  getSessionTimeouts,
  isAdminRole,
  type UserProfile,
  type UserRole,
  type SessionTimeouts,
} from "./session";

export {
  withAuth,
  validateTenantOwnership,
  validateTenantOwnershipBatch,
  roleGuards,
  type AuthContext,
  type AuthenticatedHandler,
  type WithAuthOptions,
} from "./require-role";

export {
  ROLE_HIERARCHY,
  ROUTE_PERMISSIONS,
  API_PERMISSIONS,
  roleRank,
  hasMinimumRole,
  isRoleAllowed,
  getRequiredRolesForRoute,
  getRequiredRolesForApi,
  checkRoutePermission,
  checkApiPermission,
  type PermissionCheckResult,
} from "./permissions";
