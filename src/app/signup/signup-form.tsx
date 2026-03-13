
'use client';

import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons';

export default function SignupForm() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background text-foreground">
        <div className="absolute top-6 left-6 flex items-center gap-3">
            <Logo className="h-8 w-8 text-primary" />
            <h1 className="font-headline text-2xl font-semibold tracking-tight">lexintel</h1>
        </div>
        <Card className="w-full max-w-sm border-border bg-card shadow-sm">
            <CardHeader className="text-center">
                <CardTitle>Create an Account</CardTitle>
                <CardDescription>Fill out the form below to get started.</CardDescription>
            </CardHeader>
            <CardContent>
            <AuthForm mode="signup" />
            </CardContent>
            <CardFooter className="flex-col justify-center text-sm gap-4">
                <p>
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                    Log in
                    </Link>
                </p>
            </CardFooter>
        </Card>
      </div>
  );
}
