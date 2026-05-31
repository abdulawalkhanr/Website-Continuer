import { useState } from "react";
import { useGetMe, useListCases, useListDocuments, useCreateDocument, getGetMeQueryKey, getListCasesQueryKey, getListDocumentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Upload, CheckCircle, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DOC_TYPES = ["PAN", "AADHAAR", "CREDIT_REPORT", "NOC", "CLOSURE_LETTER", "OTHER"];

function getStatusBadge(status: string) {
  if (status === "VERIFIED") return <Badge className="bg-green-100 text-green-700 border-green-200">Verified</Badge>;
  if (status === "REJECTED") return <Badge variant="destructive">Rejected</Badge>;
  if (status === "UPLOADED") return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Uploaded</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>;
}

export default function DashboardDocuments() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: cases } = useListCases(user ? { customerId: user.id } : {}, { query: { enabled: !!user, queryKey: getListCasesQueryKey(user ? { customerId: user.id } : {}) } });
  const activeCase = cases?.[0];
  const { data: documents, isLoading } = useListDocuments({ caseId: activeCase?.id ?? 0 }, { query: { enabled: !!activeCase, queryKey: getListDocumentsQueryKey({ caseId: activeCase?.id ?? 0 }) } });
  const createDocument = useCreateDocument();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("");

  const handleAdd = () => {
    if (!activeCase || !docName || !docType) return;
    createDocument.mutate({ data: { caseId: activeCase.id, name: docName, type: docType as "PAN" | "AADHAAR" | "CREDIT_REPORT" | "NOC" | "CLOSURE_LETTER" | "OTHER" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey({ caseId: activeCase.id }) });
        setDocName(""); setDocType("");
        toast({ title: "Document added successfully" });
      },
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Documents</h2>
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Upload a Document</h3>
        <div className="border-2 border-dashed border-primary/20 rounded-xl p-6 text-center mb-4 bg-primary/5">
          <Upload size={32} className="text-primary/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-1">Upload documents via our team on WhatsApp or email</p>
          <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to 10MB</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label>Document Name</Label>
            <Input data-testid="doc-name" value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. PAN Card - Rahul Sharma" />
          </div>
          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger data-testid="doc-type"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <Button className="mt-4 btn-gradient border-0 text-white" onClick={handleAdd} disabled={!docName || !docType || createDocument.isPending || !activeCase} data-testid="doc-submit">
          {createDocument.isPending ? "Adding..." : "Add Document Record"}
        </Button>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Document Checklist</h3>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-6">Loading...</div>
        ) : !activeCase ? (
          <div className="text-center text-muted-foreground py-6">Register your case to manage documents</div>
        ) : documents && documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center gap-4 p-4 border border-border rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{doc.name}</div>
                  <div className="text-xs text-muted-foreground">{doc.type.replace(/_/g, " ")}</div>
                </div>
                {getStatusBadge(doc.status)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-6">
            <FileText size={32} className="mx-auto mb-2 text-primary/30" />
            <p>No documents uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
