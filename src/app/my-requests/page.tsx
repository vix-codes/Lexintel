
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Header from "@/components/header";
import { ShieldQuestion, Edit, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PreviouslyApprovedRequests } from "@/components/previously-approved-requests";
import { documentTemplates } from "@/lib/data";
import { cn } from "@/lib/utils";

type TimestampLike = { seconds: number; nanoseconds: number };

type VerificationRequest = {
  id: string;
  userId: string;
  documentType: string;
  status: "pending" | "reviewed" | "approved" | "rejected";
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  draftContent: string;
  formInputs: Record<string, any>;
  lawyerComments: { text: string; timestamp: TimestampLike }[];
  lawyerNotification: string;
  type?: "document" | "lawyer";
};

type ApprovedVerificationRequest = VerificationRequest & {
  status: "approved";
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

function RequestCard({ request, onResubmit }: { request: VerificationRequest; onResubmit: () => void }) {
  const { toast } = useToast();
  const [editingContent, setEditingContent] = useState(request.draftContent);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusInfo = statusConfig[request.status as keyof typeof statusConfig];
  const documentLabel = getDocumentLabel(request.documentType);

  const handleResubmit = async () => {
    if (!editingContent.trim()) {
      toast({ variant: "destructive", title: "Draft cannot be empty." });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/verification-requests/resubmit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: request.id, draftContent: editingContent }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const description =
          payload?.message || 'An unexpected error occurred while resubmitting.';
        toast({ variant: "destructive", title: "Resubmission Failed", description });
        setIsSubmitting(false);
        return;
      }

      toast({ title: "Resubmitted Successfully", description: "Your updated draft has been sent for review." });
      setIsEditing(false);
      onResubmit(); // This will trigger a forceRefetch in the parent
    } catch (error: any) {
      console.error("Resubmission error:", error);
      toast({ variant: "destructive", title: "Resubmission Failed", description: error.message || 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Keep card in sync with external data changes
  useEffect(() => {
    setEditingContent(request.draftContent);
  }, [request.draftContent]);

  return (
    <div className="border border-border rounded-lg p-4 space-y-3 bg-card hover:border-secondary/50 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-foreground">{documentLabel}</h3>
          <p className="text-sm text-muted-foreground">
            Submitted{" "}
            {request.createdAt
              ? formatDistanceToNow(new Date(request.createdAt.seconds * 1000), { addSuffix: true })
              : "recently"}
          </p>
        </div>
        {statusInfo && <Badge className={cn("border-transparent", statusInfo.className)}>{statusInfo.label}</Badge>}
      </div>

      {request.lawyerNotification && (
        <div className={cn(
          "border-l-4 p-3 rounded-r-md",
          request.status === 'rejected' ? "border-destructive bg-destructive/10" : "border-accent bg-accent/10"
        )}>
          <p className={cn(
            "font-semibold text-sm",
             request.status === 'rejected' ? "text-destructive" : "text-accent-foreground/90"
          )}>
            {request.lawyerNotification}
          </p>
        </div>
      )}

      {request.lawyerComments?.length > 0 && (
        <div className="mt-3 space-y-2">
          <h4 className="font-medium text-sm">Lawyer’s Feedback:</h4>
          {request.lawyerComments
            .slice()
            .reverse()
            .map((c, i) => (
              <blockquote
                key={i}
                className="text-sm text-muted-foreground border-l-2 pl-3 italic"
              >
                "{c.text}"
              </blockquote>
            ))}
        </div>
      )}

      {isEditing ? (
        <div className="space-y-3 pt-2">
          <Textarea 
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            rows={10}
            className="bg-background"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleResubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Resubmit for Verification
            </Button>
          </div>
        </div>
      ) : (
        !isEditing && (request.status === 'reviewed' || request.status === 'rejected') && request.type === 'document' && (
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit & Resubmit
            </Button>
          </div>
        )
      )}
    </div>
  );
}

export default function MyRequestsPage() {
  const { user, isUserLoading } = useAuth();
  const [allRequests, setAllRequests] = useState<VerificationRequest[] | null>(null);
  const [isRequestsLoading, setIsRequestsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeRequests = useMemo(() => {
    if (!allRequests) return [];
    return allRequests?.filter(r => r.status === 'pending' || r.status === 'reviewed' || r.status === 'rejected') ?? [];
  }, [allRequests]);
  
  const approvedRequests = useMemo(() => {
    if (!allRequests) return [];
    return allRequests.filter(
      (r): r is ApprovedVerificationRequest => r.status === 'approved'
    );
  }, [allRequests]);

  const fetchRequests = useCallback(async () => {
    setIsRequestsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/verification-requests', { method: 'GET' });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(payload?.message || 'Failed to load requests.');
        setAllRequests([]);
      } else {
        const data = await res.json();
        setAllRequests(data.requests || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch verification requests:', err);
      setError('Failed to load requests.');
      setAllRequests([]);
    } finally {
      setIsRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setAllRequests([]);
      setIsRequestsLoading(false);
      return;
    }
    fetchRequests();
  }, [user, fetchRequests]);

  const handleResubmitSuccess = useCallback(() => {
    fetchRequests();
  }, [fetchRequests]);


  const showLoading = isUserLoading || (user && isRequestsLoading);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 p-4 lg:p-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <ShieldQuestion className="h-6 w-6 text-primary" />
              My Verification Requests
            </CardTitle>
            <CardDescription>
              Track your document and profile submissions and lawyer feedback in real time.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {showLoading && (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            )}
            
            {!showLoading && activeRequests.length > 0 && (
                <div className="space-y-4">
                    {activeRequests.map((req) => (
                        <RequestCard key={req.id} request={req} onResubmit={handleResubmitSuccess} />
                    ))}
                </div>
            )}
            
            {!showLoading && activeRequests.length === 0 && approvedRequests.length === 0 && (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg bg-muted/50">
                <p className="font-semibold">No Active Requests</p>
                <p className="text-sm">
                  You have not submitted any pending verification requests yet.
                </p>
              </div>
            )}

            {!showLoading && approvedRequests.length > 0 && (
                <PreviouslyApprovedRequests requests={approvedRequests} />
            )}

          </CardContent>
        </Card>
      </main>
    </div>
  );
}
