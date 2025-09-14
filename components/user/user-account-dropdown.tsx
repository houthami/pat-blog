"use client"

import { useState, useEffect } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Settings,
  BookmarkPlus,
  Bell,
  LogOut,
  Crown,
  ChefHat,
  Mail,
  Heart,
  MessageCircle,
  Calendar,
  CreditCard,
  Shield,
  UserPlus
} from "lucide-react"
import Link from "next/link"

interface UserStats {
  savedRecipes: number
  createdRecipes: number
  comments: number
  interactions: number
}

export function UserAccountDropdown() {
  const { data: session, status } = useSession()
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newRecipes: true,
    comments: true,
    weeklyDigest: false
  })

  useEffect(() => {
    if (session?.user) {
      // Fetch user statistics
      fetchUserStats()
      fetchNotificationSettings()
    }
  }, [session])

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats')
      if (response.ok) {
        const stats = await response.json()
        setUserStats(stats)
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
      // Set mock data for demo
      setUserStats({
        savedRecipes: 12,
        createdRecipes: session?.user?.role === 'ADMIN' || session?.user?.role === 'EDITOR' ? 5 : 0,
        comments: 8,
        interactions: 45
      })
    }
  }

  const fetchNotificationSettings = async () => {
    try {
      const response = await fetch('/api/user/notification-settings')
      if (response.ok) {
        const settings = await response.json()
        setNotificationSettings(settings)
      }
    } catch (error) {
      console.error('Failed to fetch notification settings:', error)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/recipes' })
  }

  const getRoleDisplay = (role?: string) => {
    const roleConfig = {
      ADMIN: { label: 'Admin', color: 'destructive' as const, icon: Shield },
      EDITOR: { label: 'Creator', color: 'default' as const, icon: ChefHat },
      MEMBER: { label: 'Premium', color: 'secondary' as const, icon: Crown },
      VIEWER: { label: 'Member', color: 'outline' as const, icon: User },
      VISITOR: { label: 'Visitor', color: 'outline' as const, icon: User }
    }

    return roleConfig[role as keyof typeof roleConfig] || roleConfig.VISITOR
  }

  // Not authenticated - show login button
  if (status === 'loading') {
    return (
      <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
    )
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={() => signIn()}
          size="sm"
          className="bg-primary hover:bg-primary/90"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Sign In
        </Button>
      </div>
    )
  }

  const user = session.user
  const roleInfo = getRoleDisplay(user.role)
  const RoleIcon = roleInfo.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
            <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80 p-0" align="end" forceMount>
        {/* User Info Header */}
        <div className="p-4 pb-2 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.name || 'User'}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={roleInfo.color} className="text-xs px-2 py-0">
                  <RoleIcon className="w-3 h-3 mr-1" />
                  {roleInfo.label}
                </Badge>
                {user.role === 'VISITOR' && (
                  <Button variant="ghost" size="sm" className="h-5 text-xs p-1">
                    <Link href="/visitor-welcome" className="text-blue-600">
                      Upgrade Free
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User Stats */}
        {userStats && (
          <div className="p-3 border-b bg-muted/30">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-sm font-medium">
                  <BookmarkPlus className="w-3 h-3" />
                  {userStats.savedRecipes}
                </div>
                <p className="text-xs text-muted-foreground">Saved</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-sm font-medium">
                  <Heart className="w-3 h-3 text-red-500" />
                  {userStats.interactions}
                </div>
                <p className="text-xs text-muted-foreground">Likes</p>
              </div>
              {userStats.createdRecipes > 0 && (
                <>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                      <ChefHat className="w-3 h-3" />
                      {userStats.createdRecipes}
                    </div>
                    <p className="text-xs text-muted-foreground">Created</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                      <MessageCircle className="w-3 h-3 text-blue-500" />
                      {userStats.comments}
                    </div>
                    <p className="text-xs text-muted-foreground">Comments</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Account Management */}
        <div className="p-1">
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-3">
            Account
          </DropdownMenuLabel>

          <DropdownMenuItem asChild>
            <Link href="/account/profile" className="cursor-pointer">
              <User className="mr-3 h-4 w-4" />
              <span>Edit Profile</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/account/saved-recipes" className="cursor-pointer">
              <BookmarkPlus className="mr-3 h-4 w-4" />
              <span>Saved Recipes ({userStats?.savedRecipes || 0})</span>
            </Link>
          </DropdownMenuItem>

          {/* Premium/Subscription Management */}
          {user.role !== 'ADMIN' && (
            <DropdownMenuItem asChild>
              <Link href="/account/subscription" className="cursor-pointer">
                <Crown className="mr-3 h-4 w-4 text-amber-500" />
                <span>{user.role === 'MEMBER' ? 'Manage Premium' : 'Upgrade to Premium'}</span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Settings */}
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-3">
            Settings
          </DropdownMenuLabel>

          <DropdownMenuItem asChild>
            <Link href="/account/notifications" className="cursor-pointer">
              <Bell className="mr-3 h-4 w-4" />
              <div className="flex-1 flex items-center justify-between">
                <span>Notifications</span>
                <div className="flex items-center gap-1">
                  {notificationSettings.emailNotifications && (
                    <Mail className="h-3 w-3 text-green-500" />
                  )}
                </div>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/account/preferences" className="cursor-pointer">
              <Settings className="mr-3 h-4 w-4" />
              <span>Preferences</span>
            </Link>
          </DropdownMenuItem>

          {/* Creator Tools (ADMIN/EDITOR only) */}
          {(user.role === 'ADMIN' || user.role === 'EDITOR') && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-3">
                Creator Tools
              </DropdownMenuLabel>

              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="cursor-pointer">
                  <ChefHat className="mr-3 h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/recipes/new" className="cursor-pointer">
                  <ChefHat className="mr-3 h-4 w-4" />
                  <span>Create Recipe</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />

          {/* Sign Out */}
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
            <LogOut className="mr-3 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </div>

        {/* Footer */}
        <div className="p-3 pt-2 border-t bg-muted/20">
          <p className="text-xs text-center text-muted-foreground">
            Member since {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric'
            })}
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}