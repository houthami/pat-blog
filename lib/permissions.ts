// Role-based permissions system for Pastry Blog

export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER'
export type RecipeStatus = 'DRAFT' | 'PUBLISHED' | 'SUSPENDED'

interface User {
  id: string
  role: UserRole
  email: string
}

interface Recipe {
  id: string
  authorId: string
  status: RecipeStatus
  suspendedBy?: string | null
}

export class Permissions {
  /**
   * ADMIN (Pastry Blog Owner) Permissions:
   * - Create, edit, delete, publish recipes
   * - See all analytics and manage users
   * - Suspend/reactivate accounts
   * - Full system control
   */
  static canCreateRecipe(user: User): boolean {
    return ['ADMIN', 'EDITOR'].includes(user.role)
  }

  static canEditRecipe(user: User, recipe: Recipe): boolean {
    // Admin can edit any recipe
    if (user.role === 'ADMIN') return true

    // Editor can edit their own recipes or any draft
    if (user.role === 'EDITOR') {
      return recipe.authorId === user.id || recipe.status === 'DRAFT'
    }

    return false
  }

  static canDeleteRecipe(user: User): boolean {
    // Only Admin can delete recipes
    return user.role === 'ADMIN'
  }

  static canPublishRecipe(user: User): boolean {
    // Only Admin can publish recipes (make them live)
    return user.role === 'ADMIN'
  }

  static canSuspendRecipe(user: User): boolean {
    // Admin and Editor can suspend recipes (quality control)
    return ['ADMIN', 'EDITOR'].includes(user.role)
  }

  static canUnsuspendRecipe(user: User): boolean {
    // Only Admin can unsuspend recipes
    return user.role === 'ADMIN'
  }

  /**
   * Analytics Access
   */
  static canViewAnalytics(user: User): boolean {
    // Admin and Editor can see analytics
    return ['ADMIN', 'EDITOR'].includes(user.role)
  }

  static canViewAllAnalytics(user: User): boolean {
    // Only Admin can see all analytics
    return user.role === 'ADMIN'
  }

  /**
   * User Management
   */
  static canManageUsers(user: User): boolean {
    // Only Admin can manage users
    return user.role === 'ADMIN'
  }

  static canSuspendUser(user: User): boolean {
    // Only Admin can suspend users
    return user.role === 'ADMIN'
  }

  /**
   * Content Visibility
   */
  static canViewRecipe(user: User | null, recipe: Recipe): boolean {
    // Public can see published recipes
    if (recipe.status === 'PUBLISHED') return true

    // Must be logged in for other statuses
    if (!user) return false

    // Admin can see all recipes
    if (user.role === 'ADMIN') return true

    // Editor can see their own drafts
    if (user.role === 'EDITOR' && recipe.status === 'DRAFT' && recipe.authorId === user.id) {
      return true
    }

    // Suspended recipes only visible to admin
    if (recipe.status === 'SUSPENDED') {
      return user.role === 'ADMIN'
    }

    return false
  }

  /**
   * Interaction Permissions
   */
  static canInteractWithRecipe(user: User | null): boolean {
    // Must be logged in to interact (like, comment, save)
    return user !== null
  }

  /**
   * Dashboard Access
   */
  static canAccessAdminDashboard(user: User): boolean {
    return user.role === 'ADMIN'
  }

  static canAccessEditorDashboard(user: User): boolean {
    return ['ADMIN', 'EDITOR'].includes(user.role)
  }

  /**
   * Get default recipe status for role
   */
  static getDefaultRecipeStatus(user: User): RecipeStatus {
    // Admin can create published recipes directly
    if (user.role === 'ADMIN') return 'PUBLISHED'

    // Editor creates drafts that need admin approval
    if (user.role === 'EDITOR') return 'DRAFT'

    // This shouldn't happen for VIEWER
    return 'DRAFT'
  }

  /**
   * Get available recipe statuses for user
   */
  static getAvailableRecipeStatuses(user: User): RecipeStatus[] {
    if (user.role === 'ADMIN') {
      return ['DRAFT', 'PUBLISHED', 'SUSPENDED']
    }

    if (user.role === 'EDITOR') {
      return ['DRAFT', 'SUSPENDED'] // Can't publish directly
    }

    return [] // Viewers can't create recipes
  }
}

// Utility functions for easy use
export const {
  canCreateRecipe,
  canEditRecipe,
  canDeleteRecipe,
  canPublishRecipe,
  canSuspendRecipe,
  canUnsuspendRecipe,
  canViewAnalytics,
  canViewAllAnalytics,
  canManageUsers,
  canSuspendUser,
  canViewRecipe,
  canInteractWithRecipe,
  canAccessAdminDashboard,
  canAccessEditorDashboard,
  getDefaultRecipeStatus,
  getAvailableRecipeStatuses
} = Permissions