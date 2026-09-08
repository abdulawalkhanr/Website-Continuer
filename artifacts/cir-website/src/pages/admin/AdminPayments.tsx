import { useState } from "react";
import {
  useListPayments, useCreatePayment, useUpdatePayment, useDeletePayment,
  useGetPaymentStats, useListCases,
  getListPaymentsQueryKey, getGetPaymentStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit, FileText, FileSignature, Plus, IndianRupee, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateReceipt, generateAgreement } from "@/lib/pdf-generator";

type EnrichedPayment = {
  id: number;
  caseId: number;
  caseNumber?: string | null;
  serviceType?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerMobile?: string | null;
  customerCity?: string | null;
  serviceFee: number;
  advancePaid: number;
  pendingAmount: number;
  paymentStatus: string;
  createdAt: string | Date;
};

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-green-100 text-green-700 border-green-200",
  PARTIAL: "bg-yellow-100 text-yellow-700 border-yellow-200",
  PENDING: "bg-red-50 text-red-700 border-red-200",
};

const PAYMENT_STATUSES = ["PENDING", "PARTIAL", "PAID"];

export default function AdminPayments() {
  const { data: payments, isLoading } = useListPayments({}, { query: { queryKey: getListPaymentsQueryKey({}) } });
  const { data: stats } = useGetPaymentStats({ query: { queryKey: getGetPaymentStatsQueryKey() } });
  const { data: cases } = useListCases({});
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const deletePayment = useDeletePayment();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Delete state
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Add payment state
  const [showAdd, setShowAdd] = useState(false);
  const [newCaseId, setNewCaseId] = useState("");
  const [newServiceFee, setNewServiceFee] = useState("");
  const [newAdvancePaid, setNewAdvancePaid] = useState("");

  // Edit payment state
  const [editPayment, setEditPayment] = useState<EnrichedPayment | null>(null);
  const [editServiceFee, setEditServiceFee] = useState("");
  const [editAdvance, setEditAdvance] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey({}) });
    queryClient.invalidateQueries({ queryKey: getGetPaymentStatsQueryKey() });
  };

  const handleDelete = () => {
    if (deleteId === null) return;
    deletePayment.mutate({ id: deleteId }, {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Payment record deleted" }); },
      onError: () => toast({ title: "Failed to delete payment", variant: "destructive" }),
    });
  };

  const openEdit = (p: EnrichedPayment) => {
    setEditPayment(p);
    setEditServiceFee(String(p.serviceFee));
    setEditAdvance(String(p.advancePaid));
    setEditStatus(p.paymentStatus);
  };

  const openAdd = () => {
    setNewCaseId("");
    setNewServiceFee("");
    setNewAdvancePaid("");
    setShowAdd(true);
  };

  const handleCreate = () => {
    if (!newCaseId || !newServiceFee) {
      toast({ title: "Case and service fee are required", variant: "destructive" });
      return;
    }
    const serviceFee = parseFloat(newServiceFee);
    const advancePaid = parseFloat(newAdvancePaid || "0");
    if (isNaN(serviceFee) || serviceFee <= 0) {
      toast({ title: "Enter a valid service fee", variant: "destructive" });
      return;
    }
    createPayment.mutate({
      data: {
        caseId: parseInt(newCaseId),
        serviceFee,
        advancePaid: advancePaid || undefined,
      }
    }, {
      onSuccess: () => {
        invalidate();
        setShowAdd(false);
        toast({ title: "Payment record created" });
      },
      onError: () => toast({ title: "Failed to create payment", variant: "destructive" }),
    });
  };

  const handleSave = () => {
    if (!editPayment) return;
    const advancePaid = parseFloat(editAdvance);
    const serviceFee = parseFloat(editServiceFee);
    updatePayment.mutate({
      id: editPayment.id,
      data: {
        advancePaid: isNaN(advancePaid) ? undefined : advancePaid,
        paymentStatus: editStatus as "PAID" | "PARTIAL" | "PENDING",
      }
    }, {
      onSuccess: () => {
        invalidate();
        setEditPayment(null);
        toast({ title: "Payment updated" });
      },
      onError: () => toast({ title: "Failed to update payment", variant: "destructive" }),
    });
  };

  // Computed pending for add form
  const addPending = Math.max(0, (parseFloat(newServiceFee) || 0) - (parseFloat(newAdvancePaid) || 0));
  const addStatus = (parseFloat(newAdvancePaid) || 0) >= (parseFloat(newServiceFee) || 0) && (parseFloat(newServiceFee) || 0) > 0
    ? "PAID"
    : (parseFloat(newAdvancePaid) || 0) > 0
      ? "PARTIAL"
      : "PENDING";

  // Computed pending for edit form
  const editPending = Math.max(0, (parseFloat(editServiceFee) || 0) - (parseFloat(editAdvance) || 0));

  const handleReceipt = (p: EnrichedPayment) => generateReceipt({
    paymentId: p.id, date: p.createdAt,
    customerName: p.customerName || "Client",
    customerEmail: p.customerEmail || undefined,
    customerMobile: p.customerMobile || undefined,
    customerCity: p.customerCity || undefined,
    caseNumber: p.caseNumber || `#${p.caseId}`,
    serviceType: p.serviceType || "Credit Report Rectification",
    serviceFee: p.serviceFee, advancePaid: p.advancePaid,
    pendingAmount: p.pendingAmount, paymentStatus: p.paymentStatus,
  });

  const handleAgreement = (p: EnrichedPayment) => generateAgreement({
    paymentId: p.id, date: p.createdAt,
    customerName: p.customerName || "Client",
    customerEmail: p.customerEmail || undefined,
    customerMobile: p.customerMobile || undefined,
    customerCity: p.customerCity || undefined,
    caseNumber: p.caseNumber || `#${p.caseId}`,
    serviceType: p.serviceType || "Credit Report Rectification",
    serviceFee: p.serviceFee, advancePaid: p.advancePaid,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Add payment records, track collections, generate receipts &amp; agreements</p>
        </div>
        <Button className="btn-gradient border-0 text-white gap-2" onClick={openAdd}>
          <Plus size={16} /> Add Payment
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="stat-card rounded-xl p-4 text-center">
            <div className="text-xl font-bold gradient-text">₹{(stats.totalRevenue || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Billed</div>
          </div>
          <div className="rounded-xl p-4 text-center bg-green-50 border border-green-200">
            <div className="text-xl font-bold text-green-700">₹{(stats.collectedRevenue || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Collected</div>
          </div>
          <div className="rounded-xl p-4 text-center bg-orange-50 border border-orange-200">
            <div className="text-xl font-bold text-orange-700">₹{(stats.pendingRevenue || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="stat-card rounded-xl p-4 text-center">
            <div className="text-xl font-bold">{stats.totalCases}</div>
            <div className="text-xs text-muted-foreground">Total Cases</div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Service Fee</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Pending</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !payments?.length ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <IndianRupee size={32} className="opacity-30" />
                    <p>No payment records yet</p>
                    <Button size="sm" variant="outline" onClick={openAdd} className="gap-1">
                      <Plus size={14} /> Add First Payment
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (payments as unknown as EnrichedPayment[]).map(p => (
              <TableRow key={p.id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-xs">{p.caseNumber || `#${p.caseId}`}</TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{p.customerName || "—"}</div>
                  <div className="text-xs text-muted-foreground">{p.customerMobile || p.customerEmail || ""}</div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate" title={p.serviceType || ""}>
                  {p.serviceType || "—"}
                </TableCell>
                <TableCell className="font-medium">₹{p.serviceFee.toLocaleString()}</TableCell>
                <TableCell className="text-green-600 font-medium">₹{p.advancePaid.toLocaleString()}</TableCell>
                <TableCell className="text-orange-600">₹{p.pendingAmount.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge className={`text-xs border ${STATUS_COLORS[p.paymentStatus] || ""}`}>{p.paymentStatus}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("en-IN")}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 justify-end">
                    <Button size="sm" variant="ghost" className="h-7 px-2" title="Edit payment" onClick={() => openEdit(p)}>
                      <Edit size={13} />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-blue-600" title="Download Receipt" onClick={() => handleReceipt(p)}>
                      <FileText size={13} />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-purple-600" title="Download Agreement" onClick={() => handleAgreement(p)}>
                      <FileSignature size={13} />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" title="Delete payment" onClick={() => setDeleteId(p.id)}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="glass-card rounded-xl p-4 flex items-start gap-3 text-sm">
        <FileText size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <div>
          <span className="font-medium">Generating documents: </span>
          Click <FileText size={12} className="inline text-blue-500" /> for receipt or{" "}
          <FileSignature size={12} className="inline text-purple-500" /> for agreement.
          A new tab opens — use <strong>Print → Save as PDF</strong> to download.
        </div>
      </div>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this payment record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              {deletePayment.isPending ? "Deleting..." : "Delete Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Add Payment Dialog ── */}
      <Dialog open={showAdd} onOpenChange={(o) => !o && setShowAdd(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IndianRupee size={18} className="text-primary" /> Add Payment Record
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Case selector */}
            <div className="space-y-2">
              <Label>Case *</Label>
              <Select value={newCaseId} onValueChange={setNewCaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a case..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {cases?.length ? cases.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <span className="font-mono text-xs mr-2 text-muted-foreground">{c.caseNumber}</span>
                      {(c as unknown as { customerName?: string }).customerName || `Customer #${c.customerId}`}
                      {" — "}{c.serviceType}
                    </SelectItem>
                  )) : (
                    <div className="px-4 py-3 text-sm text-muted-foreground">No cases found. Create a case first.</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Service Fee */}
            <div className="space-y-2">
              <Label>Total Service Fee (₹) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  className="pl-7"
                  value={newServiceFee}
                  onChange={e => setNewServiceFee(e.target.value)}
                  placeholder="e.g. 5000"
                />
              </div>
            </div>

            {/* Advance Paid */}
            <div className="space-y-2">
              <Label>Amount Received / Advance Paid (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  className="pl-7"
                  value={newAdvancePaid}
                  onChange={e => setNewAdvancePaid(e.target.value)}
                  placeholder="0 if nothing received yet"
                />
              </div>
            </div>

            {/* Summary preview */}
            {newServiceFee && (
              <div className="p-3 bg-muted/50 rounded-xl text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Fee</span>
                  <span className="font-medium">₹{(parseFloat(newServiceFee) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Received</span>
                  <span className="font-medium text-green-600">₹{(parseFloat(newAdvancePaid) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium text-orange-600">₹{addPending.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={`text-xs border ${STATUS_COLORS[addStatus]}`}>{addStatus}</Badge>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                className="flex-1 btn-gradient border-0 text-white"
                onClick={handleCreate}
                disabled={createPayment.isPending || !newCaseId || !newServiceFee}
              >
                {createPayment.isPending ? "Creating..." : "Create Payment Record"}
              </Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Payment Dialog ── */}
      <Dialog open={!!editPayment} onOpenChange={(o) => !o && setEditPayment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit size={16} className="text-primary" /> Update Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editPayment && (
              <div className="p-3 bg-muted/50 rounded-xl text-sm space-y-1">
                <div className="font-semibold">{editPayment.customerName || "Client"}</div>
                <div className="text-muted-foreground text-xs">{editPayment.caseNumber} — {editPayment.serviceType || "Service"}</div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Total Service Fee (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <Input
                  type="number"
                  min="0"
                  className="pl-7"
                  value={editServiceFee}
                  onChange={e => setEditServiceFee(e.target.value)}
                  placeholder="Service fee"
                  disabled
                />
              </div>
              <p className="text-xs text-muted-foreground">Service fee cannot be changed after creation.</p>
            </div>

            <div className="space-y-2">
              <Label>Amount Received / Advance Paid (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <Input
                  type="number"
                  min="0"
                  className="pl-7"
                  value={editAdvance}
                  onChange={e => setEditAdvance(e.target.value)}
                  placeholder="Amount received"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${s === "PAID" ? "bg-green-500" : s === "PARTIAL" ? "bg-yellow-500" : "bg-red-500"}`} />
                        {s}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editPayment && (
              <div className="p-3 bg-muted/50 rounded-xl text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Fee</span>
                  <span className="font-medium">₹{(parseFloat(editServiceFee) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Received</span>
                  <span className="font-medium text-green-600">₹{(parseFloat(editAdvance) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium text-orange-600">₹{editPending.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                className="flex-1 btn-gradient border-0 text-white"
                onClick={handleSave}
                disabled={updatePayment.isPending}
              >
                {updatePayment.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setEditPayment(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
