import { useState } from "react";
import {
  useListCases, useCreateCase, useUpdateCase, useDeleteCase, useGetCaseStats, useListCustomers, useListExecutives,
  getListCasesQueryKey, getGetCaseStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Phone, Plus, Trash2, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUSES = ["DOCUMENTS_SUBMITTED", "CASE_REVIEW", "DOCUMENTATION_VERIFIED", "DISPUTE_SUBMITTED", "BUREAU_LENDER_REVIEW", "FOLLOW_UP", "COMPLETED"];
const STATUS_PCT: Record<string, number> = { DOCUMENTS_SUBMITTED: 10, CASE_REVIEW: 25, DOCUMENTATION_VERIFIED: 40, DISPUTE_SUBMITTED: 60, BUREAU_LENDER_REVIEW: 75, FOLLOW_UP: 88, COMPLETED: 100 };
const SERVICE_TYPES = ["CIBIL Score Improvement", "Credit Report Dispute", "Loan Settlement Dispute", "Credit Card Dispute", "EMI Default Rectification", "Written-off Account Recovery", "Bank NOC & Closure Letter", "Multiple Account Issues"];

const STATUS_COLORS: Record<string, string> = {
  DOCUMENTS_SUBMITTED: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CASE_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
  DOCUMENTATION_VERIFIED: "bg-purple-50 text-purple-700 border-purple-200",
  DISPUTE_SUBMITTED: "bg-primary/10 text-primary border-primary/20",
  BUREAU_LENDER_REVIEW: "bg-orange-50 text-orange-700 border-orange-200",
  FOLLOW_UP: "bg-teal-50 text-teal-700 border-teal-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
};

type CaseItem = {
  id: number; caseNumber: string; customerId: number; status: string; serviceType: string;
  progressPercentage: number; notes?: string | null; expectedCompletionDate?: string | null;
  customerName?: string | null; customerMobile?: string | null; assignedToId?: number | null;
  assignedToName?: string | null; createdAt: string | Date; updatedAt: string | Date;
};

export default function AdminCases() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [editCase, setEditCase] = useState<CaseItem | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editExpected, setEditExpected] = useState("");
  const [editAssigned, setEditAssigned] = useState("NONE");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Create form state
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newService, setNewService] = useState("");
  const [newAssigned, setNewAssigned] = useState("NONE");
  const [newNotes, setNewNotes] = useState("");
  const [newExpected, setNewExpected] = useState("");

  const activeStatus = statusFilter !== "ALL" ? statusFilter as "DOCUMENTS_SUBMITTED" | "CASE_REVIEW" | "DOCUMENTATION_VERIFIED" | "DISPUTE_SUBMITTED" | "BUREAU_LENDER_REVIEW" | "FOLLOW_UP" | "COMPLETED" : undefined;
  const { data: cases, isLoading } = useListCases(
    activeStatus ? { status: activeStatus } : {},
    { query: { queryKey: getListCasesQueryKey(activeStatus ? { status: activeStatus } : {}) } }
  );
  const { data: stats } = useGetCaseStats({ query: { queryKey: getGetCaseStatsQueryKey() } });
  const { data: customers } = useListCustomers({});
  const { data: executives } = useListExecutives({});

  const createCase = useCreateCase();
  const updateCase = useUpdateCase();
  const deleteCase = useDeleteCase();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListCasesQueryKey({}) });
    queryClient.invalidateQueries({ queryKey: getGetCaseStatsQueryKey() });
  };

  const openEdit = (c: CaseItem) => {
    setEditCase(c);
    setEditStatus(c.status);
    setEditNotes(c.notes || "");
    setEditExpected(c.expectedCompletionDate || "");
    setEditAssigned(c.assignedToId ? String(c.assignedToId) : "NONE");
  };

  const handleCreate = () => {
    if (!newCustomerId || !newService) { toast({ title: "Customer and service type are required", variant: "destructive" }); return; }
    createCase.mutate({
      data: {
        customerId: parseInt(newCustomerId),
        serviceType: newService,
        assignedToId: (newAssigned && newAssigned !== "NONE") ? parseInt(newAssigned) : undefined,
        notes: newNotes || undefined,
        expectedCompletionDate: newExpected || undefined,
      }
    }, {
      onSuccess: () => {
        invalidate();
        setShowCreate(false);
        setNewCustomerId(""); setNewService(""); setNewAssigned(""); setNewNotes(""); setNewExpected("");
        toast({ title: "Case created successfully" });
      },
      onError: () => toast({ title: "Failed to create case", variant: "destructive" }),
    });
  };

  const handleSave = () => {
    if (!editCase) return;
    const pct = STATUS_PCT[editStatus];
    updateCase.mutate({
      id: editCase.id,
      data: {
        status: editStatus as "DOCUMENTS_SUBMITTED",
        notes: editNotes,
        progressPercentage: pct,
        expectedCompletionDate: editExpected,
        assignedToId: (editAssigned && editAssigned !== "NONE") ? parseInt(editAssigned) : undefined,
      }
    }, {
      onSuccess: () => { invalidate(); setEditCase(null); toast({ title: "Case updated" }); },
      onError: () => toast({ title: "Failed to update case", variant: "destructive" }),
    });
  };

  const handleDelete = () => {
    if (deleteId === null) return;
    deleteCase.mutate({ id: deleteId }, {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Case deleted" }); },
      onError: () => toast({ title: "Failed to delete case", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Case Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Create, manage, and update all customer cases</p>
        </div>
        <Button className="btn-gradient border-0 text-white gap-2" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Case
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat-card rounded-xl p-4 text-center"><div className="text-2xl font-bold">{stats.total}</div><div className="text-xs text-muted-foreground">Total</div></div>
          <div className="rounded-xl p-4 text-center bg-blue-50 border border-blue-200"><div className="text-2xl font-bold text-blue-700">{stats.active}</div><div className="text-xs text-muted-foreground">Active</div></div>
          <div className="rounded-xl p-4 text-center bg-green-50 border border-green-200"><div className="text-2xl font-bold text-green-700">{stats.completed}</div><div className="text-xs text-muted-foreground">Completed</div></div>
          <div className="rounded-xl p-4 text-center bg-yellow-50 border border-yellow-200"><div className="text-2xl font-bold text-yellow-700">{stats.documentsSubmitted}</div><div className="text-xs text-muted-foreground">Pending Review</div></div>
        </div>
      )}

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !cases?.length ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No cases found</TableCell></TableRow>
            ) : cases.map(c => (
              <TableRow key={c.id} className="hover:bg-muted/30">
                <TableCell className="font-mono font-medium text-xs">{c.caseNumber}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-sm">{(c as unknown as CaseItem).customerName || "—"}</div>
                    {!!(c as unknown as CaseItem).customerMobile && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <a href={`tel:${(c as unknown as CaseItem).customerMobile}`}><Phone size={11} className="text-primary" /></a>
                        {(c as unknown as CaseItem).customerMobile}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm max-w-[120px] truncate">{c.serviceType}</TableCell>
                <TableCell><Badge className={`text-xs ${STATUS_COLORS[c.status]}`}>{c.status.replace(/_/g, " ")}</Badge></TableCell>
                <TableCell>
                  <div className="w-24">
                    <Progress value={c.progressPercentage} className="h-1.5 mb-0.5" />
                    <span className="text-xs text-muted-foreground">{c.progressPercentage}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{c.expectedCompletionDate || "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(c.updatedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 justify-end">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(c as CaseItem)} title="Edit">
                      <Edit size={14} className="text-primary" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setDeleteId(c.id)} title="Delete">
                      <Trash2 size={13} className="text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Case Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Briefcase size={20} className="text-primary" /> Create New Case</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={newCustomerId} onValueChange={setNewCustomerId}>
                <SelectTrigger><SelectValue placeholder="Select customer..." /></SelectTrigger>
                <SelectContent>
                  {customers?.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name} — {c.mobile || c.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Service Type *</Label>
              <Select value={newService} onValueChange={setNewService}>
                <SelectTrigger><SelectValue placeholder="Select service..." /></SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assign To (Executive/Manager)</Label>
              <Select value={newAssigned} onValueChange={setNewAssigned}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Unassigned</SelectItem>
                  {executives?.map(e => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.name} ({e.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Expected Completion Date</Label>
              <Input value={newExpected} onChange={e => setNewExpected(e.target.value)} placeholder="e.g. September 30, 2026" />
            </div>
            <div className="space-y-2">
              <Label>Initial Notes</Label>
              <Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} rows={2} placeholder="Case details or special instructions..." />
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 btn-gradient border-0 text-white" onClick={handleCreate} disabled={createCase.isPending || !newCustomerId || !newService}>
                {createCase.isPending ? "Creating..." : "Create Case"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editCase} onOpenChange={(o) => !o && setEditCase(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Update Case — {editCase?.caseNumber}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select value={editAssigned} onValueChange={setEditAssigned}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Unassigned</SelectItem>
                  {executives?.map(e => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.name} ({e.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Expected Completion Date</Label>
              <Input value={editExpected} onChange={e => setEditExpected(e.target.value)} placeholder="e.g. June 30, 2026" />
            </div>
            <div className="space-y-2">
              <Label>Notes for Customer</Label>
              <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3} placeholder="Update notes visible to customer..." />
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 btn-gradient border-0 text-white" onClick={handleSave} disabled={updateCase.isPending}>
                {updateCase.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setEditCase(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Case?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the case along with all associated documents and payments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              {deleteCase.isPending ? "Deleting..." : "Delete Case"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
