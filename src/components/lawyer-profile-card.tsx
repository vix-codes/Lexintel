
'use client';

import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { FilePlus, Loader2 } from 'lucide-react';
import { requestLawyerVerification } from '@/app/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { allStates, citiesByState } from '@/lib/data';
import { useState } from 'react';

const lawyerProfileSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  phone: z.string().min(10, 'A valid phone number is required.'),
  enrollmentNumber: z.string().regex(/^[A-Z]{2,}\/\d{3,5}\/\d{4}$/, 'Invalid enrollment ID format (e.g., TN/1234/2023).'),
  state: z.string().min(1, 'State is required.'),
  city: z.string().min(1, 'City is required.'),
  specializations: z.string().min(2, 'At least one specialization is required.'),
  experience: z.coerce.number().min(0, 'Experience cannot be negative.'),
  description: z.string().min(20, 'A brief description is required (min. 20 characters).'),
});

type LawyerFormData = z.infer<typeof lawyerProfileSchema>;

function LawyerProfileForm({ userId, userEmail }: { userId: string, userEmail: string }) {
  const { toast } = useToast();
  const [selectedState, setSelectedState] = useState('');

  const { register, handleSubmit, control, watch, formState: { errors, isSubmitting } } = useForm<LawyerFormData>({
    resolver: zodResolver(lawyerProfileSchema),
    defaultValues: {
        name: '',
        phone: '',
        enrollmentNumber: '',
        state: '',
        city: '',
        specializations: '',
        experience: 0,
        description: '',
    },
  });

  const onSubmit = async (data: LawyerFormData) => {
    try {
      const profileData = {
        name: data.name,
        email: userEmail,
        phone: data.phone,
        enrollmentNumber: data.enrollmentNumber,
        location: {
          state: data.state,
          city: data.city,
        },
        specializations: data.specializations.split(',').map(s => s.trim()),
        experience: data.experience,
        description: data.description,
      };

      const result = await requestLawyerVerification(userId, profileData);

      if (result.success) {
        toast({
            title: 'Request Submitted',
            description: 'Your profile has been sent for verification. You can check the status on the "My Requests" page.',
        });
      } else {
        throw new Error(result.error || 'An unknown error occurred');
      }

    } catch (error) {
      console.error('Error submitting verification request:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Could not submit your profile for verification. Please try again.',
      });
    }
  };
  
  const watchedState = watch('state');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" {...register('phone')} />
          {errors.phone && <p className="text-destructive text-sm">{errors.phone.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="enrollmentNumber">Bar Council Enrollment Number</Label>
          <Input id="enrollmentNumber" placeholder="e.g., TN/1234/2023" {...register('enrollmentNumber')} />
          {errors.enrollmentNumber && <p className="text-destructive text-sm">{errors.enrollmentNumber.message}</p>}
        </div>

        <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Controller
                name="state"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedState(value);
                    }} defaultValue={field.value}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select your state" />
                        </SelectTrigger>
                        <SelectContent>
                            {allStates.map(state => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />
            {errors.state && <p className="text-destructive text-sm">{errors.state.message}</p>}
        </div>

        <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Controller
                name="city"
                control={control}
                render={({ field }) => (
                     <Select onValueChange={field.onChange} value={field.value} disabled={!watchedState}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select your city" />
                        </SelectTrigger>
                        <SelectContent>
                            {watchedState && citiesByState[watchedState] ? (
                                citiesByState[watchedState].map(city => (
                                    <SelectItem key={city} value={city}>{city}</SelectItem>
                                ))
                            ) : (
                                <SelectItem value="-" disabled>Select a state first</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                )}
            />
            {errors.city && <p className="text-destructive text-sm">{errors.city.message}</p>}
        </div>
        
         <div className="space-y-2">
          <Label htmlFor="experience">Years of Experience</Label>
          <Input id="experience" type="number" {...register('experience')} />
          {errors.experience && <p className="text-destructive text-sm">{errors.experience.message}</p>}
        </div>
         <div className="space-y-2">
          <Label htmlFor="specializations">Specializations (comma-separated)</Label>
          <Input id="specializations" {...register('specializations')} />
          {errors.specializations && <p className="text-destructive text-sm">{errors.specializations.message}</p>}
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="description">Professional Bio</Label>
          <Textarea id="description" {...register('description')} rows={5}/>
          {errors.description && <p className="text-destructive text-sm">{errors.description.message}</p>}
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : 'Request Verification'}
        </Button>
      </div>
    </form>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-6 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2"> <Skeleton className="h-4 w-1/4" /> <Skeleton className="h-10 w-full" /> </div>
          <div className="space-y-2"> <Skeleton className="h-4 w-1/4" /> <Skeleton className="h-10 w-full" /> </div>
          <div className="space-y-2"> <Skeleton className="h-4 w-1/4" /> <Skeleton className="h-10 w-full" /> </div>
          <div className="space-y-2"> <Skeleton className="h-4 w-1/4" /> <Skeleton className="h-10 w-full" /> </div>
          <div className="space-y-2"> <Skeleton className="h-4 w-1/4" /> <Skeleton className="h-10 w-full" /> </div>
          <div className="space-y-2"> <Skeleton className="h-4 w-1/4" /> <Skeleton className="h-10 w-full" /> </div>
          <div className="md:col-span-2 space-y-2"> <Skeleton className="h-4 w-1/4" /> <Skeleton className="h-24 w-full" /> </div>
        </div>
        <div className="flex justify-end">
            <Skeleton className="h-10 w-32" />
        </div>
    </div>
  );
}


export function LawyerProfileCard() {
  const { user, isUserLoading } = useAuth();
  
  if (isUserLoading) {
      return (
        <Card className="col-span-1 bg-card border-border shadow-sm">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-sm" />
                    <Skeleton className="h-6 w-64" />
                </CardTitle>
                <CardDescription>
                    <Skeleton className="h-4 w-80" />
                </CardDescription>
            </CardHeader>
            <CardContent>
                <LoadingSkeleton />
            </CardContent>
        </Card>
      );
  }

  if (!user) {
    return null; // Or some other placeholder if you want to show a prompt to log in
  }

  const cardTitle = "Create Your Professional Profile";
  const cardDescription = "Fill out the form below to submit your profile for verification.";
  const cardIcon = <FilePlus className="h-6 w-6 text-primary" />;
  
  return (
    <Card className="col-span-1 bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
              {cardIcon}
              {cardTitle}
          </CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>
        <CardContent>
            {user && <LawyerProfileForm userId={user.id} userEmail={user.email} />}
        </CardContent>
    </Card>
  )
}
