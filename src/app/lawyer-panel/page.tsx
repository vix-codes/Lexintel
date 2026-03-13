
'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import Header from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { LawyerRequestDetails } from '@/components/lawyer-request-details';
import { Button } from '@/components/ui/button';
import { Briefcase, User } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { PreviouslyApprovedRequests } from '@/components/previously-approved-requests';
import { documentTemplates } from '@/lib/data';
import { cn } from '@/lib/utils';
import { getUserProfiles } from '../admin-actions';

type TimestampLike = { seconds: number; nanoseconds: number };

type VerificationRequest = {
  id: string;
  userId: string;
  documentType: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  draftContent: string;
  formInputs: Record<string, any>;
  lawyerComments: { text: string; timestamp: TimestampLike }[];
  type?: 'document' | 'lawyer';
};

type CompletedVerificationRequest = VerificationRequest & {
  status: 'approved' | 'rejected';
};

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-secondary text-secondary-foreground hover:bg-secondary/80' },
  reviewed: { label: 'Reviewed', className: 'bg-muted text-muted-foreground border-border' },
  approved: { label: 'Approved', className: 'bg-primary text-primary-foreground hover:bg-primary/90' },
  rejected: { label: 'Rejected', className: 'bg-destructive text-destructive-foreground' },
};

function getDocumentLabel(docValue: string) {
    if (docValue === 'Lawyer Profile') return 'Lawyer Profile';
    const template = documentTemplates.find(t => t.value === docValue);
    return template ? template.label : docValue.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function VerificationRequestCard({
  request,
  username,
  onActionComplete,
}: {
  request: VerificationRequest;
  username: string;
  onActionComplete: () => void;
}) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const statusInfo = statusConfig[request.status as keyof typeof statusConfig];
    const documentLabel = getDocumentLabel(request.documentType);

    return (
        <>
            <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="font-headline">{documentLabel}</CardTitle>
                            <CardDescription className="flex items-center gap-1 pt-1">
                                <User className="h-3 w-3" />
                                {username}
                            </CardDescription>
                        </div>
                        <Badge className={cn("border-transparent", statusInfo.className)}>{statusInfo.label}</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {request.createdAt ? formatDistanceToNow(new Date(request.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now'}
                    </p>
                    <div className="mt-4 flex justify-end">
                        <Button onClick={() => setIsDetailsOpen(true)}>View Details</Button>
                    </div>
                </CardContent>
            </Card>
            <LawyerRequestDetails 
                request={request}
                username={username}
                isOpen={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onActionComplete={onActionComplete}
            />
        </>
    );
}

export default function LawyerPanelPage() {
  const { user, isUserLoading } = useAuth();
  const [userProfiles, setUserProfiles] = useState<Record<string, string>>({});
  const [allRequestsData, setAllRequestsData] = useState<VerificationRequest[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchRequests = useCallback(async () => {
    if (!user || user.email !== 'lawyer@lexintel.com') {
      setAllRequestsData([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/verification-requests', { method: 'GET' });
      if (!res.ok) {
        console.error('Failed to load verification requests');
        setAllRequestsData([]);
      } else {
        const data = await res.json();
        setAllRequestsData(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to load verification requests', err);
      setAllRequestsData([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleActionComplete = useCallback(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    async function fetchProfiles() {
        if (!allRequestsData || allRequestsData.length === 0) {
            return;
        }

        const userIds = [...new Set(allRequestsData.map(req => req.userId))];
        const existingProfileIds = Object.keys(userProfiles);
        const newUserIds = userIds.filter(id => !existingProfileIds.includes(id));

        if (newUserIds.length > 0) {
            const newProfiles = await getUserProfiles(newUserIds);
            setUserProfiles(prev => ({...prev, ...newProfiles}));
        }
    }
    fetchProfiles();
  }, [allRequestsData, userProfiles]);

  const activeRequests = useMemo(() => {
    if (!allRequestsData) return [];
    return allRequestsData
      .filter(r => r.status === 'pending' || r.status === 'reviewed')
      .sort((a, b) => {
        if (a.status === 'reviewed' && b.status !== 'reviewed') return -1;
        if (a.status !== 'reviewed' && b.status === 'reviewed') return 1;
        return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
      });
  }, [allRequestsData]);

  const completedRequests = useMemo(() => {
    if (!allRequestsData) return [];
    return allRequestsData.filter(
      (r): r is CompletedVerificationRequest =>
        r.status === 'approved' || r.status === 'rejected'
    );
  }, [allRequestsData]);

  
  if (isUserLoading) {
      return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Header />
            <main className="flex-1 p-4 lg:p-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </main>
        </div>
      )
  }
  
  if (!user || user.email !== 'lawyer@lexintel.com') {
      return (
          <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Header />
            <main className="flex-1 p-4 lg:p-6">
                <div className="text-center py-12 text-destructive">
                    <p className="font-semibold text-lg">Access Denied</p>
                    <p>You do not have permission to view this page.</p>
                </div>
            </main>
          </div>
      );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 p-4 lg:p-6">
        <Card className="bg-card border-border shadow-sm">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Briefcase className="h-6 w-6 text-primary" />
                    Lawyer Verification Panel
                </CardTitle>
                <CardDescription>Review and manage all user-submitted draft verification requests.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                 )}

                 {!isLoading && activeRequests && activeRequests.length > 0 && (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeRequests.map(request => (
                            <VerificationRequestCard key={request.id} request={request} username={userProfiles[request.userId] || 'Loading...'} onActionComplete={handleActionComplete} />
                        ))}
                     </div>
                 )}
                 {!isLoading && (!activeRequests || activeRequests.length === 0) && (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/50">
                        <p className="font-semibold">No Active Requests</p>
                        <p>There are currently no pending or reviewed requests.</p>
                    </div>
                 )}

                {!isLoading && completedRequests && completedRequests.length > 0 && (
                    <PreviouslyApprovedRequests requests={completedRequests} profiles={userProfiles} />
                )}

            </CardContent>
        </Card>
      </main>
    </div>
  );
}
