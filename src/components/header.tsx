
'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Logo } from './icons';
import { Button } from './ui/button';
import { useAuth } from './auth-provider';
import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (!res.ok) {
        console.error('Error signing out');
      }
    } catch (error) {
      console.error('Error signing out: ', error);
    } finally {
      router.push('/');
      router.refresh();
    }
  };
  
  const getUsername = () => {
      if (!user) return '';
      if (user.username) return user.username;
      return user.email?.split('@')[0] || 'User';
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 text-foreground backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3">
          <Logo className="h-7 w-7 text-primary" />
          <h1 className="font-headline text-xl font-semibold tracking-tight">lexintel</h1>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {user ? (
            <>
                <span className="text-sm text-muted-foreground">Hi, {getUsername()}</span>
                <ThemeToggle />
                <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-foreground hover:bg-muted hover:text-foreground">
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Sign Out</span>
                </Button>
            </>
        ) : (
           <ThemeToggle />
        )}
      </div>
    </header>
  );
}
