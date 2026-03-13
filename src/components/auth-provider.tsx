
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, createContext, useContext, type ReactNode } from 'react';
import { Skeleton } from './ui/skeleton';
import { Logo } from './icons';

type AuthUser = {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'LAWYER' | 'ADMIN';
};

const AuthContext = createContext<{ user: AuthUser | null; isUserLoading: boolean }>({
  user: null,
  isUserLoading: true,
});

const authRequiredRoutes = ['/dashboard', '/lawyer-panel', '/my-requests'];
const lawyerOnlyRoutes = ['/lawyer-panel'];
const publicOnlyRoutes = ['/login', '/signup'];
const LAWYER_EMAIL = 'lawyer@lexintel.com';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
                <Logo className="h-8 w-8 text-primary animate-pulse" />
                <h1 className="font-headline text-2xl font-semibold tracking-tight">lexintel</h1>
            </div>
            <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-24" />
            </div>
        </div>
    </div>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      try {
        const res = await fetch('/api/auth/me', { method: 'GET' });
        if (!isMounted) return;

        if (!res.ok) {
          setUser(null);
          setIsUserLoading(false);
          return;
        }

        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to load current user:', error);
        setUser(null);
      } finally {
        if (isMounted) {
          setIsUserLoading(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isUserLoading) return;

    const isLawyer = user?.email === LAWYER_EMAIL || user?.role === 'LAWYER';
    const pathIsAuthRequired = authRequiredRoutes.some(route => pathname.startsWith(route));
    const pathIsLawyerOnly = lawyerOnlyRoutes.some(route => pathname.startsWith(route));
    const pathIsPublicOnly = publicOnlyRoutes.some(route => pathname.startsWith(route));

    // Handle authenticated users
    if (user) {
      if (isLawyer) {
        // If lawyer logs in, redirect from login/signup to the lawyer panel.
        if (pathIsPublicOnly) {
          router.push('/lawyer-panel');
        }
      } else { // Regular user
        // If a regular user tries to access a lawyer-only page, redirect them.
        if (pathIsLawyerOnly) {
          router.push('/');
        }
        // If a regular user is on a public-only page (e.g. /login), redirect to homepage.
        else if (pathIsPublicOnly) {
            router.push('/');
        }
      }
    }
    // Handle unauthenticated users
    else {
      // If the user is not logged in and tries to access a protected route, redirect to login.
      if (pathIsAuthRequired) {
        router.push('/login');
      }
    }
  }, [user, isUserLoading, router, pathname]);
  
  if (isUserLoading && authRequiredRoutes.some(route => pathname.startsWith(route))) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ user, isUserLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
