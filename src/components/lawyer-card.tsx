
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star, Phone, Mail, ShieldCheck } from 'lucide-react';

export type LawyerProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: { city?: string; state?: string };
  specializations: string[];
  experience?: number;
  description?: string;
  rating: number;
  isVerified: boolean;
  enrollmentNumber?: string;
  stateBarCouncil?: string;
  source?: 'internal' | 'google';
};

// This type is no longer needed but kept for compatibility just in case.
export type ExternalLawyerProfile = {
  name: string;
  vicinity: string;
  rating: number;
  user_ratings_total: number;
  url: string;
  source: 'google';
};

type LawyerCardProps = {
  lawyer: LawyerProfile;
};

const renderStars = (rating: number) => {
  // Guard against invalid rating values that cause crashes.
  if (typeof rating !== 'number' || isNaN(rating) || rating < 0) {
    return null; // Return nothing if the rating is invalid
  }

  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} className="h-4 w-4 fill-accent text-accent" />)}
      {halfStar && <Star key="half" className="h-4 w-4 fill-accent text-accent" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }} />}
      {[...Array(emptyStars)].map((_ , i) => <Star key={`empty-${i}`} className="h-4 w-4 fill-muted text-muted-foreground" />)}
    </div>
  );
};

export function LawyerCard({ lawyer }: LawyerCardProps) {
  // We only render internal lawyers now
  return (
    <Card className="flex flex-col bg-card border-border shadow-sm">
      <CardContent className="p-6 flex flex-col flex-1">
        <div className="flex items-start gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={`https://picsum.photos/seed/${lawyer.id}/200`} data-ai-hint="person professional" />
            <AvatarFallback>{lawyer.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
              {lawyer.name}
              {lawyer.isVerified && <ShieldCheck className="h-5 w-5 text-accent fill-current" />}
            </h3>
            {lawyer.specializations && lawyer.specializations.length > 0 && (
              <p className="text-secondary text-sm font-medium">{lawyer.specializations[0]}</p>
            )}
            <p className="text-muted-foreground text-sm">
              {lawyer?.location?.city && lawyer?.location?.state
                ? `${lawyer.location.city}, ${lawyer.location.state}`
                : "Location not available"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
            {renderStars(lawyer.rating)}
            <span className="text-xs text-muted-foreground">({lawyer.rating?.toFixed(1) || 'N/A'})</span>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{lawyer.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{lawyer.phone || 'Not provided'}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border flex-1 flex flex-col justify-end">
          <Button className="w-full">Message Now</Button>
        </div>
      </CardContent>
    </Card>
  );
}
