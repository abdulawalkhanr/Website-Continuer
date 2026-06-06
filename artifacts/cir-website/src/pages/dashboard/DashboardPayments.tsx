import { useGetMe, useListCases, useListPayments, getGetMeQueryKey, getListCasesQueryKey, getListPaymentsQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Download, CheckCircle, FileText, FileSignature } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { generateReceipt, generateAgreement } from "@/lib/pdf-generator";

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

  const handleGenerateReceipt = () => {
    if (!payment || !user || !activeCase) return;
    generateReceipt({
      paymentId: payment.id,
      date: payment.createdAt,
      customerName: user.name,
      customerEmail: user.email,
      customerMobile: (user as unknown as Record<string, unknown>).mobile as string | undefined,
      customerCity: (user as unknown as Record<string, unknown>).city as string | undefined,
      caseNumber: activeCase.caseNumber,
      serviceType: activeCase.serviceType,
      serviceFee,
      advancePaid,
      pendingAmount,
      paymentStatus: payment.paymentStatus,
    });
  };

  const handleGenerateAgreement = () => {
    if (!user || !activeCase) return;
    generateAgreement({
      paymentId: payment?.id,
      date: payment?.createdAt ?? new Date(),
      customerName: user.name,
      customerEmail: user.email,
      customerMobile: (user as unknown as Record<string, unknown>).mobile as string | undefined,
      customerCity: (user as unknown as Record<string, unknown>).city as string | undefined,
      caseNumber: activeCase.caseNumber,
      serviceType: activeCase.serviceType,
      serviceFee: serviceFee || 0,
      advancePaid,
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Payments</h2>
      {isLoading ? (
        <div className="glass-card rounded-2xl p-8 animate-pulse text-center text-muted-foreground">Loading...</div>
      ) : !payment ? (
        <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">
          <CreditCard size={40} className="mx-auto mb-3 text-primary/30" />
          <p>No payment details available yet. Our team will update this once your case is registered.</p>
          {activeCase && (
            <Button variant="outline" className="mt-4 gap-2" onClick={handleGenerateAgreement}>
              <FileSignature size={15} /> Download Agreement
            </Button>
          )}
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
            <h3 className="font-semibold mb-1">Documents</h3>
            <p className="text-xs text-muted-foreground mb-4">Download your payment receipt and service agreement as PDF from your browser.</p>
            <div className="flex flex-wrap gap-3">
              <Button
                className="btn-gradient border-0 text-white gap-2"
                onClick={handleGenerateReceipt}
                disabled={!payment || !user || !activeCase}
              >
                <FileText size={15} /> Download Receipt
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleGenerateAgreement}
                disabled={!user || !activeCase}
              >
                <FileSignature size={15} /> Download Agreement
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              A new tab will open — use your browser's <strong>Print → Save as PDF</strong> option to save the document.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold mb-3">Payment Details</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><div className="text-muted-foreground text-xs">Case Number</div><div className="font-medium">{activeCase?.caseNumber}</div></div>
              <div><div className="text-muted-foreground text-xs">Service Type</div><div className="font-medium">{activeCase?.serviceType?.replace(/_/g, " ")}</div></div>
              <div><div className="text-muted-foreground text-xs">Payment Status</div><div className="font-medium">{payment.paymentStatus}</div></div>
              <div><div className="text-muted-foreground text-xs">Payment ID</div><div className="font-medium font-mono">#{payment.id}</div></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
