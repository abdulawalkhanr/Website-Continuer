import { useState, useRef } from "react";
import { useRoute, Link } from "wouter";
import { 
  useListAdminCustomerCreditReports, getListAdminCustomerCreditReportsQueryKey,
  useCreateCreditReportUploadUrl, useFinalizeCreditReportUpload,
  useReprocessCreditReport, useApproveCreditReport, useUpdateAdminCreditReport
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, CheckCircle, RefreshCcw, ShieldCheck, ChevronLeft, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminCustomerReports() {
  const [, params] = useRoute("/admin/customers/:id/reports");
  const customerId = params?.id ? parseInt(params.id, 10) : 0;
  
  const { data: reports, isLoading } = useListAdminCustomerCreditReports(customerId, {
    query: { enabled: !!customerId, queryKey: getListAdminCustomerCreditReportsQueryKey(customerId) }
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const uploadUrlMut = useCreateCreditReportUploadUrl();
  const finalizeMut = useFinalizeCreditReportUpload();
  const reprocessMut = useReprocessCreditReport();
  const approveMut = useApproveCreditReport();
  const updateMut = useUpdateAdminCreditReport();

  const fileRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [approveId, setApproveId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editVersion, setEditVersion] = useState<"ORIGINAL" | "UPDATED" | "RECTIFIED">("ORIGINAL");

  const refreshList = () => queryClient.invalidateQueries({ queryKey: getListAdminCustomerCreditReportsQueryKey(customerId) });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "Max size 15MB", variant: "destructive" });
      return;
    }
    
    setIsUploading(true);
    try {
      const contentType = file.type as any;
      const { uploadURL, objectPath, headers } = await uploadUrlMut.mutateAsync({
        data: { contentType, size: file.size, customerId }
      });
      const putRes = await fetch(uploadURL, { method: "PUT", headers: headers as Record<string, string>, body: file });
      if (!putRes.ok) throw new Error("Storage upload failed");
      
      await finalizeMut.mutateAsync({
        data: { objectPath, originalFilename: file.name, contentType, size: file.size, customerId, version: "ORIGINAL" }
      });
      refreshList();
      toast({ title: "Report uploaded successfully" });
    } catch (err) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleReprocess = async (id: number) => {
    try {
      await reprocessMut.mutateAsync({ id });
      refreshList();
      toast({ title: "Reprocessing started" });
    } catch (e) {
      toast({ title: "Reprocessing failed", variant: "destructive" });
    }
  };

  const handleApprove = async () => {
    if (!approveId) return;
    try {
      await approveMut.mutateAsync({ id: approveId, data: { notes: approvalNotes } });
      refreshList();
      setApproveId(null);
      setApprovalNotes("");
      toast({ title: "Report approved" });
    } catch (e) {
      toast({ title: "Approval failed", variant: "destructive" });
    }
  };

  const handleUpdateVersion = async () => {
    if (!editId) return;
    try {
      await updateMut.mutateAsync({ id: editId, data: { version: editVersion } });
      refreshList();
      setEditId(null);
      toast({ title: "Version updated" });
    } catch (e) {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/customers">
          <Button variant="ghost" size="icon" className="shrink-0"><ChevronLeft size={20} /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Customer Credit Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage, reprocess, and approve credit reports</p>
        </div>
        <div className="ml-auto">
          <Button className="btn-gradient text-white gap-2" disabled={isUploading} onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> {isUploading ? "Uploading..." : "Upload Report"}
          </Button>
          <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleUpload} />
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center p-8 text-muted-foreground">Loading...</div>
        ) : !reports?.length ? (
          <div className="glass-card p-12 text-center rounded-2xl">
            <FileText size={48} className="mx-auto mb-4 text-primary/40" />
            <p className="text-muted-foreground">No credit reports found for this customer.</p>
          </div>
        ) : reports.map(r => (
          <div key={r.id} className="glass-card rounded-2xl p-6 flex flex-col md:flex-row gap-6 justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-lg">{r.originalFilename}</span>
                <Badge className="bg-primary/10 text-primary border-primary/20">{r.version}</Badge>
                {r.isCurrent && <Badge className="bg-green-100 text-green-700">CURRENT</Badge>}
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditId(r.id); setEditVersion(r.version); }}><Pencil size={12}/></Button>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Uploaded: {new Date(r.createdAt).toLocaleString()}</div>
                <div>Bureau: {r.bureau || "Unknown"} | Score: {r.score || "N/A"}</div>
                <div>Status: <span className="font-semibold text-foreground">{r.processingStatus.replace(/_/g, " ")}</span></div>
              </div>
              
              {r.manualReviewReason && (
                <div className="mt-3 p-3 bg-red-50 border border-red-100 text-red-800 text-sm rounded-lg">
                  <span className="font-semibold">Review Reason:</span> {r.manualReviewReason}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              {r.processingStatus === "NEEDS_MANUAL_REVIEW" && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-2" onClick={() => setApproveId(r.id)}>
                  <ShieldCheck size={14} /> Approve
                </Button>
              )}
              {["FAILED", "NEEDS_MANUAL_REVIEW", "PROCESSED"].includes(r.processingStatus) && (
                <Button size="sm" variant="outline" className="gap-2" onClick={() => handleReprocess(r.id)}>
                  <RefreshCcw size={14} /> Reprocess
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={approveId !== null} onOpenChange={o => !o && setApproveId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CheckCircle className="text-green-600" /> Approve Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Approval Notes</Label>
              <Textarea placeholder="Add any notes about this manual approval..." value={approvalNotes} onChange={e => setApprovalNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveId(null)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleApprove} disabled={approveMut.isPending}>
              {approveMut.isPending ? "Approving..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editId !== null} onOpenChange={o => !o && setEditId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Report Version</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Version Label</Label>
              <Select value={editVersion} onValueChange={(v: any) => setEditVersion(v)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORIGINAL">ORIGINAL</SelectItem>
                  <SelectItem value="UPDATED">UPDATED</SelectItem>
                  <SelectItem value="RECTIFIED">RECTIFIED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
            <Button className="btn-gradient text-white" onClick={handleUpdateVersion} disabled={updateMut.isPending}>
              Save Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}