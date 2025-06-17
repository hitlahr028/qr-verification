'use client'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/reset-password']
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/verify/')

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      router.push('/login')
    }
  }, [user, loading, router, isPublicRoute])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to dashboard if user is already logged in and trying to access auth pages
  if (user && (pathname === '/login' || pathname === '/register')) {
    router.push('/dashboard')
    return null
  }

  // Don't render protected content if user is not authenticated
  if (!user && !isPublicRoute) {
    return null
  }

  return <>{children}</>
}