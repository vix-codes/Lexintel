
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "./ui/badge";
import { formatDistanceToNow } from "date-fns";
import { documentTemplates } from "@/lib/data";
import { cn } from "@/lib/utils";

type VerificationRequest = {
  id: string;
  userId?: string;
  documentType: string;
  status: 'approved' | 'rejected';
  updatedAt: { seconds: number; nanoseconds: number; };
  type?: 'document' | 'lawyer';
};

interface PreviouslyApprovedRequestsProps {
  requests: VerificationRequest[];
  profiles?: Record<string, string> | null;
}

function getDocumentLabel(docValue: string) {
    if (docValue === 'Lawyer Profile') return 'Lawyer Profile';
    const template = documentTemplates.find(t => t.value === docValue);
    return template ? template.label : docValue.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function PreviouslyApprovedRequests({ requests, profiles }: PreviouslyApprovedRequestsProps) {
  const sortedRequests = requests.sort((a, b) => b.updatedAt.seconds - a.updatedAt.seconds);
  const title = profiles ? `Previously Completed (${requests.length})` : `My Past Submissions (${requests.length})`;

  return (
    <div className="pt-6">
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1" className="border-b-0">
          <AccordionTrigger>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              {sortedRequests.map((request) => {
                const documentLabel = getDocumentLabel(request.documentType);
                const username = profiles && request.userId ? profiles[request.userId] : 'A user';
                const isApproved = request.status === 'approved';
                return (
                    <div key={request.id} className="border border-border p-4 rounded-lg bg-muted/50">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">{documentLabel}</p>
                                {profiles ? (
                                    <p className="text-sm text-muted-foreground">{`Submitted by: ${username}`}</p>
                                ) : (
                                   request.type === 'lawyer' && <p className="text-sm text-muted-foreground">{isApproved ? 'Your professional profile is now active.' : 'Your profile was rejected.'}</p>
                                )}
                            </div>
                            <Badge variant={isApproved ? "default" : "destructive"} className={cn(isApproved ? "bg-primary text-primary-foreground" : "")}>
                                {isApproved ? 'Approved' : 'Rejected'}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {isApproved ? 'Approved' : 'Rejected'} {formatDistanceToNow(new Date(request.updatedAt.seconds * 1000), { addSuffix: true })}
                        </p>
                    </div>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
