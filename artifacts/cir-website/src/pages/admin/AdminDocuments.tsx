import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Eye, CheckCircle, XCircle, RefreshCw, Download, FileQuestion, Search } from "lucide-react";

interface AdminDocument {
  id: number;
  caseId: number;
  name: string;
  type: string;
  fileUrl: string | null;
  status: string;
  verifiedAt: string | null;
  createdAt: string;
  caseNumber: string | null;
  customerName: string | null;
  customerMobile: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  UPLOADED: "bg-blue-50 text-blue-700 border-blue-200",
  VERIFIED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

function DocumentViewer({ doc }: { doc: AdminDocument }) {
  const { fileUrl, name } = doc;
  if (!fileUrl) return <p className="text-muted-foreground text-center py-8">No file uploaded yet.</p>;

  if (fileUrl.startsWith("data:image/")) {
    return <img src={fileUrl} alt={name} className="max-w-full max-h-[65vh] object-contain mx-auto rounded-lg border" />;
  }
  if (fileUrl.startsWith("data:application/pdf")) {
    return (
      <div className="flex flex-col gap-3">
        <iframe src={fileUrl} title={name} className="w-full h-[60vh] rounded-lg border" />
        <a href={fileUrl} download={name} className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium">
          <Download size={14} /> Download PDF
        </a>
      </div>
    );
  }
  if (fileUrl.startsWith("data:")) {
    const ext = name.split(".").pop()?.toUpperCase() || "FILE";
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <FileText size={48} className="text-muted-foreground" />
        <p className="text-muted-foreground">Preview not available for {ext} files.</p>
        <a href={fileUrl} download={name}>
          <Button className="gap-2"><Download size={14} /> Download {ext} File</Button>
        </a>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <FileQuestion size={48} className="text-muted-foreground" />
      <p className="text-muted-foreground text-sm text-center">
        File preview unavailable. This document was uploaded before file storage was enabled.
      </p>
    </div>
  );
}

export default function AdminDocuments() {
  const { toast } = useToast();
  const [docs, setDocs] = useState<AdminDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewDoc, setViewDoc] = useState<AdminDocument | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents/admin-all", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load documents");
      setDocs(await res.json() as AdminDocument[]);
    } catch {
      toast({ title: "Failed to load documents", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void fetchDocs(); }, [fetchDocs]);

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, verifiedAt: status === "VERIFIED" ? new Date().toISOString() : null }),
      });
      if (!res.ok) throw new Error("Update failed");
      setDocs(prev => prev.map(d => d.id === id ? { ...d, status } : d));
      if (viewDoc?.id === id) setViewDoc(v => v ? { ...v, status } : v);
      toast({ title: `Document marked as ${status.toLowerCase()}` });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = docs.filter(d => {
    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q || d.name.toLowerCase().includes(q)
      || (d.customerName || "").toLowerCase().includes(q)
      || (d.caseNumber || "").toLowerCase().includes(q)
      || d.type.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const counts = { ALL: docs.length, PENDING: 0, UPLOADED: 0, VERIFIED: 0, REJECTED: 0 };
  docs.forEach(d => { if (d.status in counts) counts[d.status as keyof typeof counts]++; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText size={22} /> Documents</h1>
          <p className="text-muted-foreground mt-1">View and verify documents uploaded by customers</p>
        </div>
        <Button variant="outline" onClick={fetchDocs} disabled={loading} className="gap-2">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["ALL", "PENDING", "UPLOADED", "VERIFIED", "REJECTED"] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`stat-card text-center rounded-xl p-3 border transition-all ${statusFilter === s ? "border-primary ring-1 ring-primary" : "border-border"}`}
          >
            <div className="text-xl font-bold">{counts[s]}</div>
            <div className="text-xs text-muted-foreground capitalize">{s === "ALL" ? "All Docs" : s.toLowerCase()}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, customer, case number…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="UPLOADED">Uploaded</SelectItem>
            <SelectItem value="VERIFIED">Verified</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Customer</TableHead>
              <TableHead>Case</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Loading documents…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No documents found</TableCell></TableRow>
            ) : filtered.map(doc => (
              <TableRow key={doc.id} className="hover:bg-slate-50">
                <TableCell>
                  <div className="font-medium text-sm">{doc.customerName || "—"}</div>
                  {doc.customerMobile && <div className="text-xs text-muted-foreground">{doc.customerMobile}</div>}
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{doc.caseNumber || `#${doc.caseId}`}</span>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{doc.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {doc.fileUrl?.startsWith("data:") ? "File available" : "No file"}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">{doc.type.replace(/_/g, " ")}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_COLORS[doc.status] || ""}>{doc.status}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(doc.createdAt).toLocaleDateString("en-IN")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs" onClick={() => setViewDoc(doc)}>
                      <Eye size={12} /> View
                    </Button>
                    {doc.status !== "VERIFIED" && (
                      <Button
                        variant="ghost" size="sm"
                        className="gap-1 h-7 text-xs text-green-700 hover:text-green-800 hover:bg-green-50"
                        disabled={updatingId === doc.id}
                        onClick={() => updateStatus(doc.id, "VERIFIED")}
                      >
                        <CheckCircle size={12} /> Verify
                      </Button>
                    )}
                    {doc.status !== "REJECTED" && (
                      <Button
                        variant="ghost" size="sm"
                        className="gap-1 h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={updatingId === doc.id}
                        onClick={() => updateStatus(doc.id, "REJECTED")}
                      >
                        <XCircle size={12} /> Reject
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Document View Modal */}
      <Dialog open={!!viewDoc} onOpenChange={open => !open && setViewDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText size={18} />
              {viewDoc?.name}
              {viewDoc && <Badge variant="outline" className={`ml-2 ${STATUS_COLORS[viewDoc.status] || ""}`}>{viewDoc.status}</Badge>}
            </DialogTitle>
            {viewDoc && (
              <div className="text-sm text-muted-foreground space-y-0.5">
                <div>Customer: <strong>{viewDoc.customerName}</strong> {viewDoc.customerMobile && `· ${viewDoc.customerMobile}`}</div>
                <div>Case: <strong>{viewDoc.caseNumber || `#${viewDoc.caseId}`}</strong> · Type: <strong>{viewDoc.type.replace(/_/g, " ")}</strong></div>
                <div>Uploaded: {new Date(viewDoc.createdAt).toLocaleString("en-IN")}</div>
              </div>
            )}
          </DialogHeader>

          {viewDoc && (
            <div className="mt-2">
              <DocumentViewer doc={viewDoc} />
              <div className="flex gap-2 mt-4 pt-4 border-t">
                {viewDoc.status !== "VERIFIED" && (
                  <Button
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                    disabled={updatingId === viewDoc.id}
                    onClick={() => updateStatus(viewDoc.id, "VERIFIED")}
                  >
                    <CheckCircle size={14} /> Mark as Verified
                  </Button>
                )}
                {viewDoc.status !== "REJECTED" && (
                  <Button
                    variant="outline"
                    className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    disabled={updatingId === viewDoc.id}
                    onClick={() => updateStatus(viewDoc.id, "REJECTED")}
                  >
                    <XCircle size={14} /> Reject Document
                  </Button>
                )}
                {viewDoc.status !== "UPLOADED" && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={updatingId === viewDoc.id}
                    onClick={() => updateStatus(viewDoc.id, "UPLOADED")}
                  >
                    Reset to Uploaded
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
