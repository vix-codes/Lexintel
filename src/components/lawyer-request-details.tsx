
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { approveRequest, addLawyerComment, rejectRequest } from '@/app/admin-actions';
import { ScrollArea } from './ui/scroll-area';
import { Loader2, User, Ban } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { documentTemplates } from '@/lib/data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';

type VerificationRequest = {
  id: string;
  userId: string;
  documentType: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt?: { seconds: number; nanoseconds: number };
  draftContent: string;
  formInputs: Record<string, unknown>;
  lawyerComments: { text: string; timestamp: { seconds: number, nanoseconds: number } }[];
  type?: 'document' | 'lawyer';
};

interface LawyerRequestDetailsProps {
  request: VerificationRequest;
  username: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onActionComplete: () => void;
}

function getDocumentLabel(docValue: string) {
    if (docValue === 'Lawyer Profile') return 'Lawyer Profile';
    const template = documentTemplates.find(t => t.value === docValue);
    return template ? template.label : docValue.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function LawyerRequestDetails({ request, username, isOpen, onOpenChange, onActionComplete }: LawyerRequestDetailsProps) {
  const { toast } = useToast();
  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (action: () => Promise<{success: boolean, error?: string | undefined}>, successTitle: string, successDesc: string) => {
    setIsSubmitting(true);
    try {
      const result = await action();
      if (result.success) {
        toast({ title: successTitle, description: successDesc });
        onActionComplete();
        handleClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleSendAdvice = () => {
    if (!comment.trim()) {
      toast({ variant: 'destructive', title: 'Comment cannot be empty.' });
      return;
    }
    handleAction(
      () => addLawyerComment(request.id, comment),
      'Advice Sent',
      "The user has been notified of your comments."
    );
    setComment('');
  };

  const handleApprove = () => {
     handleAction(
      () => approveRequest(request.id, {
        userId: request.userId,
        type: request.type || 'document',
        documentType: request.documentType,
        draftContent: request.draftContent,
        formInputs: request.formInputs,
      }),
      'Request Approved',
      "The user has been notified and relevant actions are taken."
    );
  };

  const handleReject = () => {
    handleAction(
      () => rejectRequest(request.id, rejectionReason),
      'Request Rejected',
      "The user has been notified."
    );
    setRejectionReason('');
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setComment('');
    setRejectionReason('');
    onOpenChange(false);
  }
  
  const isLawyerRequest = request.type === 'lawyer';
  const documentLabel = getDocumentLabel(request.documentType);
  const isActionable = request.status === 'pending' || request.status === 'reviewed';


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="font-headline">Review: {documentLabel}</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" /> 
            Submitted by {username} ({request.userId})
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-x-6 px-6 py-4 overflow-y-auto">
          {/* Left Column: Draft / Profile Details */}
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-foreground">{isLawyerRequest ? 'Submitted Profile Details' : 'Generated Draft'}</h3>
            <div className="rounded-md border border-border bg-muted/30 flex-1">
              <ScrollArea className="h-[calc(80vh_-_200px)]">
                <pre className="text-sm whitespace-pre-wrap font-body p-4">{request.draftContent}</pre>
              </ScrollArea>
            </div>
          </div>

          {/* Right Column: Inputs & History */}
          <div className="flex flex-col gap-4">
             {(isLawyerRequest || (request.formInputs && Object.keys(request.formInputs).length > 1)) && (
                 <div className="flex flex-col gap-2">
                    <h3 className="font-semibold text-foreground">User-Provided Inputs</h3>
                    <div className="rounded-md border border-border p-4 bg-muted/30">
                        <ScrollArea className="h-48">
                            <div className="space-y-2 text-sm">
                            {Object.entries(request.formInputs).filter(([key]) => key !== 'userId' && key !== 'documentType').map(([key, value]) => {
                                const formattedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                                return (
                                    <div key={key} className="grid grid-cols-2 gap-2">
                                        <strong className="font-medium capitalize truncate">{key.replace(/([A-Z])/g, ' $1')}:</strong>
                                        <span className="text-muted-foreground">{formattedValue}</span>
                                    </div>
                                );
                            })}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
             )}
            
            <div className="flex flex-col gap-2 flex-1">
                <h3 className="font-semibold text-foreground">Comments History</h3>
                <div className="rounded-md border border-border p-4 bg-muted/30 flex-1">
                  <ScrollArea className="h-full">
                      {request.lawyerComments && request.lawyerComments.length > 0 ? (
                          <div className="space-y-3">
                              {request.lawyerComments.slice().reverse().map((c, i) => (
                                <div key={i} className="p-3 rounded-md bg-background/50 border border-border">
                                    <p className="text-sm">{c.text}</p>
                                    {c.timestamp && (
                                      <p className="text-xs text-muted-foreground mt-2">
                                        {formatDistanceToNow(new Date(c.timestamp.seconds * 1000), { addSuffix: true })}
                                      </p>
                                    )}
                                </div>
                              ))}
                          </div>
                      ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-sm text-muted-foreground">No comments yet.</p>
                          </div>
                      )}
                  </ScrollArea>
                </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t border-border bg-background/95">
           <div className="w-full flex justify-end items-start gap-4">
                {!isLawyerRequest && isActionable && (
                    <Textarea
                        placeholder="Add a new comment or suggest changes here..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={2}
                        className="flex-1 bg-muted/50"
                        disabled={isSubmitting}
                    />
                )}
                <div className="flex flex-col gap-2">
                     {!isLawyerRequest && isActionable && (
                        <Button
                            onClick={handleSendAdvice}
                            disabled={isSubmitting || !comment.trim()}
                            className="w-[120px]"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Advice'}
                        </Button>
                     )}
                    <div className="flex gap-2">
                      {isActionable && isLawyerRequest && (
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="destructive" className="w-[120px]" disabled={isSubmitting}>
                                      <Ban className="mr-2 h-4 w-4" /> Reject
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure you want to reject this profile?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          This action cannot be undone. The user will be notified that their profile was rejected. You can provide an optional reason.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="py-2 space-y-2">
                                      <Label htmlFor="rejection-reason">Reason for Rejection (Optional)</Label>
                                      <Input 
                                        id="rejection-reason" 
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="e.g., Invalid Bar Council ID"
                                      />
                                  </div>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={handleReject}>Confirm Rejection</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      )}
                      {isActionable && (
                        <Button 
                            variant={isLawyerRequest ? "default" : "outline"}
                            onClick={handleApprove} 
                            disabled={isSubmitting} 
                            className="w-[120px]"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                        </Button>
                      )}
                    </div>
                </div>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
