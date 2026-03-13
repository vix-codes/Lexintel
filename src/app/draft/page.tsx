
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useActionState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { documentTemplates, type DocumentTemplate, type TemplateField } from '@/lib/data';
import { generateDraft } from '@/app/actions';
import { Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentPreview } from '@/components/document-preview';
import { SubmitButton } from '@/components/submit-button';
import { useAuth } from '@/components/auth-provider';
import { VerificationButton } from '@/components/verification-button';

type DraftState = {
  draft?: string;
  error?: string;
};

export default function DraftPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedTemplateValue, setSelectedTemplateValue] = useState<string | null>(null);
  const [isDraftVisible, setIsDraftVisible] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const [state, formAction, pending] = useActionState(generateDraft, { draft: undefined, error: undefined });

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.error,
      });
    }
    if (state?.draft) {
      setIsDraftVisible(true);
    }
  }, [state, toast]);

  const handleTemplateChange = (value: string) => {
    setSelectedTemplateValue(value);
    setIsDraftVisible(false);
    setFormValues({});
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormValues(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleReset = () => {
    const form = document.querySelector('form');
    form?.reset();
    setSelectedTemplateValue(null);
    setIsDraftVisible(false);
    setFormValues({});
  };

  const handleClosePreview = () => {
    setIsDraftVisible(false);
  }

  const selectedTemplate = useMemo(() => {
    return documentTemplates.find(t => t.value === selectedTemplateValue) || null;
  }, [selectedTemplateValue]);

  const selectedTemplateLabel = useMemo(() => {
    return selectedTemplate?.label ?? 'Document';
  }, [selectedTemplate]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground p-4 lg:p-6 space-y-6">
      <form action={formAction}>
        {user && <input type="hidden" name="userId" value={user.id} />}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Lexora Drafts
            </CardTitle>
            <CardDescription>Select a document type and fill in the details to generate your draft.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <Select name="documentType" required onValueChange={handleTemplateChange} value={selectedTemplateValue || ''}>
                <SelectTrigger id="documentType">
                  <SelectValue placeholder="Choose a legal document..." />
                </SelectTrigger>
                <SelectContent>
                  {documentTemplates.map(template => (
                    <SelectItem key={template.value} value={template.value}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in-50">
                {selectedTemplate.fields.map((field: TemplateField) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.name}
                        name={field.name}
                        placeholder={field.placeholder}
                        required
                        className="col-span-full"
                        onChange={handleFormChange}
                      />
                    ) : (
                      <Input
                        id={field.name}
                        name={field.name}
                        type={field.type}
                        placeholder={field.placeholder}
                        required
                        onChange={handleFormChange}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={handleReset} disabled={pending}>
              Reset
            </Button>
            <SubmitButton disabled={!selectedTemplate || !user}>Generate Draft</SubmitButton>
          </CardFooter>
        </Card>
      </form>
      {(pending || (isDraftVisible && state?.draft)) && (
        <Card className="flex-1 flex flex-col bg-card border-border shadow-sm">
            <DocumentPreview 
              draft={state?.draft} 
              isLoading={pending} 
              documentTypeLabel={selectedTemplateLabel}
              onClose={handleClosePreview}
            />
            {user && state?.draft && !pending && (
                <CardFooter>
                    <VerificationButton 
                        userId={user.id}
                        documentType={selectedTemplateValue!}
                        draftContent={state.draft}
                        formInputs={formValues}
                    />
                </CardFooter>
            )}
        </Card>
      )}
    </div>
  );
}
