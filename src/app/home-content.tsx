
'use client';

import MainContent from '@/app/main-content';
import { Lawbot } from '@/components/lawbot';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, ShieldQuestion, HelpCircle, Briefcase, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';

const FIND_LAWYER_URL = '/find-lawyer';
const MY_REQUESTS_URL = '/my-requests';
const FAQ_URL = '/faq';

function LawyerDashboardLinkCard() {
  const { user } = useAuth();

  // Render this card only if the user is logged in.
  // It gives any user the option to become a lawyer.
  if (!user) {
    return null;
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Are you a lawyer?
        </CardTitle>
        <CardDescription>Join here to create your professional profile.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href="/dashboard">
            Create Profile
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function HomeContent() {
  const { user } = useAuth();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 p-4 lg:p-6">
      <MainContent />
      <Lawbot />
       {user && (
        <Card className="bg-card">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <ShieldQuestion className="h-5 w-5 text-primary" />
                    My Verification Requests
                </CardTitle>
                <CardDescription>Check the status of your submitted document verifications.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full">
                    <Link href={MY_REQUESTS_URL}>View My Requests</Link>
                </Button>
            </CardContent>
        </Card>
      )}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Find a Lawyer
          </CardTitle>
          <CardDescription>Search for legal professionals in your area.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href={FIND_LAWYER_URL}>
              <Search className="mr-2 h-4 w-4" />
              Search Lawyers
            </Link>
          </Button>
        </CardContent>
      </Card>
      <Card className="bg-card">
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Legal FAQs
            </CardTitle>
            <CardDescription>Short answers to India’s most common legal questions.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild className="w-full">
                <Link href={FAQ_URL}>
                    Check Now
                    <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </CardContent>
      </Card>
      <LawyerDashboardLinkCard />
    </div>
  );
}
