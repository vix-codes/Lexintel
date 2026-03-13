
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long.' }),
});

function FormSubmitButton({ children, isSubmitting, ...props }: ButtonProps & { isSubmitting: boolean }) {
  return (
    <Button {...props} type="submit" disabled={isSubmitting} className="w-full">
      {isSubmitting ? <Loader2 className="animate-spin" /> : children}
    </Button>
  );
}

type AuthFormProps = {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(authSchema),
  });

  const handleAuthAction = async (data: z.infer<typeof authSchema>) => {
    const { email, password } = data;

    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const payload = await res.json();

      if (!res.ok) {
        const description =
          payload?.message ??
          (mode === 'signup'
            ? 'Failed to create account. Please try again.'
            : 'Incorrect email or password. Please try again.');

        toast({
          variant: 'destructive',
          title: 'Authentication Failed',
          description,
        });
        return;
      }

      if (mode === 'signup') {
        toast({
          title: 'Account Created',
          description: "You've been successfully signed up!",
        });
      } else {
        toast({
          title: 'Signed In',
          description: 'Welcome back!',
        });
      }

      const isLawyer =
        payload?.user?.role === 'LAWYER' ||
        payload?.user?.email === 'lawyer@lexintel.com';

      if (isLawyer) {
        router.push('/lawyer-panel');
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: 'An unexpected error occurred.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleAuthAction)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          {...register('email')}
          required
          autoComplete="email"
          className="bg-background border-input text-foreground"
        />
        {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          required
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          className="bg-background border-input text-foreground"
        />
        {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
      </div>

      <FormSubmitButton isSubmitting={isSubmitting}>
        {mode === 'login' ? 'Log In' : 'Sign Up'}
      </FormSubmitButton>
    </form>
  );
}
