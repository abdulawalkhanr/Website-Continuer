import { useState } from "react";
import { useListPayments, useUpdatePayment, useGetPaymentStats, getListPaymentsQueryKey, getGetPaymentStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Payment = { id: number; caseId: number; caseNumber?: string | null; serviceFee: number; advancePaid: number; pendingAmount: number; paymentStatus: string; createdAt: string | Date };

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-green-100 text-green-700 border-green-200",
  PARTIAL: "bg-yellow-100 text-yellow-700 border-yellow-200",
  PENDING: "bg-red-50 text-red-700 border-red-200",
};

export default function AdminPayments() {
  const { data: payments, isLoading } = useListPayments({}, { query: { queryKey: getListPaymentsQueryKey({}) } });
  const { data: stats } = useGetPaymentStats({ query: { queryKey: getGetPaymentStatsQueryKey() } });
  const updatePayment = useUpdatePayment();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [editAdvance, setEditAdvance] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const openEdit = (p: Payment) => {
    setEditPayment(p);
    setEditAdvance(String(p.advancePaid));
    setEditStatus(p.paymentStatus);
  };

  const handleSave = () => {
    if (!editPayment) return;
    updatePayment.mutate({ id: editPayment.id, data: { advancePaid: parseFloat(editAdvance) } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey({}) });
        queryClient.invalidateQueries({ queryKey: getGetPaymentStatsQueryKey() });
        setEditPayment(null);
        toast({ title: "Payment updated" });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Track and manage all service fee payments</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="stat-card rounded-xl p-4 text-center"><div className="text-xl font-bold gradient-text">₹{(stats.totalRevenue || 0).toLocaleString()}</div><div className="text-xs text-muted-foreground">Total Billed</div></div>
          <div className="rounded-xl p-4 text-center bg-green-50 border border-green-200"><div className="text-xl font-bold text-green-700">₹{(stats.collectedRevenue || 0).toLocaleString()}</div><div className="text-xs text-muted-foreground">Collected</div></div>
          <div className="rounded-xl p-4 text-center bg-orange-50 border border-orange-200"><div className="text-xl font-bold text-orange-700">₹{(stats.pendingRevenue || 0).toLocaleString()}</div><div className="text-xs text-muted-foreground">Pending</div></div>
          <div className="stat-card rounded-xl p-4 text-center"><div className="text-xl font-bold">{stats.totalCases}</div><div className="text-xs text-muted-foreground">Total Cases</div></div>
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case #</TableHead>
              <TableHead>Service Fee</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Pending</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !payments?.length ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No payments found</TableCell></TableRow>
            ) : payments.map(p => (
              <TableRow key={p.id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-xs">{(p as unknown as Record<string, unknown>).caseNumber as string || `#${p.caseId}`}</TableCell>
                <TableCell className="font-medium">₹{(typeof p.serviceFee === "number" ? p.serviceFee : parseFloat(String(p.serviceFee))).toLocaleString()}</TableCell>
                <TableCell className="text-green-600 font-medium">₹{(typeof p.advancePaid === "number" ? p.advancePaid : parseFloat(String(p.advancePaid))).toLocaleString()}</TableCell>
                <TableCell className="text-orange-600">₹{(typeof p.pendingAmount === "number" ? p.pendingAmount : parseFloat(String(p.pendingAmount))).toLocaleString()}</TableCell>
                <TableCell><Badge className={`text-xs ${STATUS_COLORS[p.paymentStatus]}`}>{p.paymentStatus}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(p as Payment)}>
                    <Edit size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editPayment} onOpenChange={(o) => !o && setEditPayment(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Update Payment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount Paid (₹)</Label>
              <Input type="number" value={editAdvance} onChange={e => setEditAdvance(e.target.value)} placeholder="Amount paid" />
            </div>
            {editPayment && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <div>Service Fee: ₹{editPayment.serviceFee.toLocaleString()}</div>
                <div>Pending: ₹{Math.max(0, editPayment.serviceFee - parseFloat(editAdvance || "0")).toLocaleString()}</div>
              </div>
            )}
            <div className="flex gap-3">
              <Button className="flex-1 btn-gradient border-0 text-white" onClick={handleSave} disabled={updatePayment.isPending}>
                {updatePayment.isPending ? "Saving..." : "Update Payment"}
              </Button>
              <Button variant="outline" onClick={() => setEditPayment(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
