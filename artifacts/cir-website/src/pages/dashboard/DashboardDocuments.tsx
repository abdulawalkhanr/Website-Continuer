import { useState, useRef } from "react";
import { useGetMe, useListCases, useListDocuments, useCreateDocument, useUpdateDocument, getGetMeQueryKey, getListCasesQueryKey, getListDocumentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Upload, CheckCircle, Clock, XCircle, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DOC_TYPES = ["PAN", "AADHAAR", "CREDIT_REPORT", "NOC", "CLOSURE_LETTER", "OTHER"];

function getStatusBadge(status: string) {
  if (status === "VERIFIED") return <Badge className="bg-green-100 text-green-700 border-green-200 gap-1"><CheckCircle size={11} />Verified</Badge>;
  if (status === "REJECTED") return <Badge variant="destructive" className="gap-1"><XCircle size={11} />Rejected</Badge>;
  if (status === "UPLOADED") return <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1"><Upload size={11} />Uploaded</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 gap-1"><Clock size={11} />Pending</Badge>;
}

export default function DashboardDocuments() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: cases } = useListCases(user ? { customerId: user.id } : {}, { query: { enabled: !!user, queryKey: getListCasesQueryKey(user ? { customerId: user.id } : {}) } });
  const activeCase = cases?.[0];
  const { data: documents, isLoading } = useListDocuments({ caseId: activeCase?.id ?? 0 }, { query: { enabled: !!activeCase, queryKey: getListDocumentsQueryKey({ caseId: activeCase?.id ?? 0 }) } });
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refreshDocs = () => queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey({ caseId: activeCase?.id ?? 0 }) });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large. Maximum 10MB allowed.", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    if (!docName) setDocName(file.name.replace(/\.[^.]+$/, ""));
  };

  const handleUpload = async () => {
    if (!activeCase || !docName || !docType) {
      toast({ title: "Please fill document name and type", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      let fileData: string | undefined;
      let fileName: string | undefined;
      if (selectedFile) {
        fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
        fileName = selectedFile.name;
      }
      await createDocument.mutateAsync({
        data: {
          caseId: activeCase.id,
          name: docName,
          type: docType as "PAN" | "AADHAAR" | "CREDIT_REPORT" | "NOC" | "CLOSURE_LETTER" | "OTHER",
          ...(fileData && { fileData, fileName }),
        }
      });
      refreshDocs();
      setDocName(""); setDocType(""); setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      toast({ title: selectedFile ? "Document uploaded successfully" : "Document record added" });
    } catch {
      toast({ title: "Failed to upload document", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Documents</h2>
        <p className="text-muted-foreground text-sm mt-1">Upload and track your case documents</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Submit a Document</h3>
        {!activeCase ? (
          <div className="text-center text-muted-foreground py-6 bg-muted/30 rounded-xl">
            No active case found. Contact us to register your case first.
          </div>
        ) : (
          <div className="space-y-4">
            {/* File drop zone */}
            <div
              className="border-2 border-dashed border-primary/20 rounded-xl p-6 text-center bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={28} className="text-primary/50 mx-auto mb-2" />
              {selectedFile ? (
                <div>
                  <p className="text-sm font-medium text-primary">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB — Click to change</p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground mb-0.5">Click to choose a file</p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to 10MB</p>
                </>
              )}
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Document Name *</Label>
                <Input value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. PAN Card - Rahul Sharma" />
              </div>
              <div className="space-y-2">
                <Label>Document Type *</Label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button className="btn-gradient border-0 text-white gap-2" onClick={handleUpload} disabled={!docName || !docType || uploading}>
              <Upload size={16} />
              {uploading ? "Uploading..." : selectedFile ? `Upload ${selectedFile.name}` : "Add Document Record"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Or share documents directly via WhatsApp: <a href="https://wa.me/919864920810" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">+91 9864920810</a>
            </p>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Document Checklist {activeCase && <span className="text-sm text-muted-foreground font-normal ml-1">— {activeCase.caseNumber}</span>}</h3>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-6">Loading...</div>
        ) : !activeCase ? (
          <div className="text-center text-muted-foreground py-6">Register your case to manage documents</div>
        ) : documents && documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center gap-4 p-4 border border-border rounded-xl hover:bg-muted/20 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{doc.name}</div>
                  <div className="text-xs text-muted-foreground">{doc.type.replace(/_/g, " ")} · {new Date(doc.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(doc.status)}
                  {doc.fileUrl && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="View document">
                      <Eye size={13} className="text-primary" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <FileText size={36} className="mx-auto mb-2 text-primary/30" />
            <p className="font-medium">No documents uploaded yet</p>
            <p className="text-sm mt-1">Upload your first document above to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
