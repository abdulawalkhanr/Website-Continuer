import { useGetMe, useListCases, useListPayments, getGetMeQueryKey, getListCasesQueryKey, getListPaymentsQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Download, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

function statusBadge(status: string) {
  if (status === "PAID") return <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>;
  if (status === "PARTIAL") return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Partial</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

export default function DashboardPayments() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: cases } = useListCases(user ? { customerId: user.id } : {}, { query: { enabled: !!user, queryKey: getListCasesQueryKey(user ? { customerId: user.id } : {}) } });
  const activeCase = cases?.[0];
  const { data: payments, isLoading } = useListPayments({ caseId: activeCase?.id }, { query: { enabled: !!activeCase, queryKey: getListPaymentsQueryKey({ caseId: activeCase?.id }) } });

  const payment = payments?.[0];
  const serviceFee = typeof payment?.serviceFee === "number" ? payment.serviceFee : parseFloat(String(payment?.serviceFee || 0));
  const advancePaid = typeof payment?.advancePaid === "number" ? payment.advancePaid : parseFloat(String(payment?.advancePaid || 0));
  const pendingAmount = typeof payment?.pendingAmount === "number" ? payment.pendingAmount : parseFloat(String(payment?.pendingAmount || 0));
  const paidPct = serviceFee > 0 ? Math.round((advancePaid / serviceFee) * 100) : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Payments</h2>
      {isLoading ? (
        <div className="glass-card rounded-2xl p-8 animate-pulse text-center text-muted-foreground">Loading...</div>
      ) : !payment ? (
        <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">
          <CreditCard size={40} className="mx-auto mb-3 text-primary/30" />
          <p>No payment details available yet. Our team will update this once your case is registered.</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="stat-card rounded-2xl p-5">
              <div className="text-xs text-muted-foreground mb-1">Service Fee</div>
              <div className="text-2xl font-bold">₹{serviceFee.toLocaleString()}</div>
            </div>
            <div className="stat-card rounded-2xl p-5">
              <div className="text-xs text-muted-foreground mb-1">Amount Paid</div>
              <div className="text-2xl font-bold text-green-600">₹{advancePaid.toLocaleString()}</div>
            </div>
            <div className="stat-card rounded-2xl p-5">
              <div className="text-xs text-muted-foreground mb-1">Pending Amount</div>
              <div className="text-2xl font-bold text-orange-500">₹{pendingAmount.toLocaleString()}</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Payment Progress</h3>
              {statusBadge(payment.paymentStatus)}
            </div>
            <Progress value={paidPct} className="h-3 mb-2" />
            <div className="text-sm text-muted-foreground">{paidPct}% of total service fee paid</div>
            {pendingAmount > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-800 font-medium">Pending Balance: ₹{pendingAmount.toLocaleString()}</p>
                <p className="text-xs text-yellow-700 mt-1">Please contact us to complete payment. Pay via UPI or bank transfer.</p>
              </div>
            )}
            {payment.paymentStatus === "PAID" && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                <CheckCircle size={18} className="text-green-600" />
                <p className="text-sm text-green-800 font-medium">Full payment received. Thank you!</p>
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Documents</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="flex items-center gap-2" disabled={!payment.receiptUrl}>
                <Download size={16} /> Download Receipt
              </Button>
              <Button variant="outline" className="flex items-center gap-2" disabled={!payment.agreementUrl}>
                <Download size={16} /> Download Agreement
              </Button>
            </div>
            {!payment.receiptUrl && <p className="text-xs text-muted-foreground mt-2">Documents will be available once payment is confirmed by our team.</p>}
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold mb-3">Payment Details</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><div className="text-muted-foreground text-xs">Case Number</div><div className="font-medium">{(payment as unknown as Record<string, unknown>).caseNumber as string || activeCase?.caseNumber}</div></div>
              <div><div className="text-muted-foreground text-xs">Payment Status</div><div className="font-medium">{payment.paymentStatus}</div></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
