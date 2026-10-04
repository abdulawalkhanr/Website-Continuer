import { useState, useEffect } from "react";
import { useGetMe, useListCases, useListPayments, getGetMeQueryKey, getListCasesQueryKey, getListPaymentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle, FileText, FileSignature, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { generateReceipt, generateAgreement } from "@/lib/pdf-generator";
import { useToast } from "@/hooks/use-toast";
import { useSearch } from "wouter";

function statusBadge(status: string) {
  if (status === "PAID") return <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>;
  if (status === "PARTIAL") return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Partial</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

function submitPayUForm(payuUrl: string, params: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = payuUrl;
  form.style.display = "none";
  Object.entries(params).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

export default function DashboardPayments() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: cases } = useListCases(user ? { customerId: user.id } : {}, { query: { enabled: !!user, queryKey: getListCasesQueryKey(user ? { customerId: user.id } : {}) } });
  const activeCase = cases?.[0];
  const { data: payments, isLoading } = useListPayments({ caseId: activeCase?.id }, { query: { enabled: !!activeCase, queryKey: getListPaymentsQueryKey({ caseId: activeCase?.id }), refetchInterval: 5000, refetchOnWindowFocus: true, staleTime: 0 } });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [payLoading, setPayLoading] = useState(false);

  const payment = payments?.[0];
  const serviceFee = typeof payment?.serviceFee === "number" ? payment.serviceFee : parseFloat(String(payment?.serviceFee || 0));
  const advancePaid = typeof payment?.advancePaid === "number" ? payment.advancePaid : parseFloat(String(payment?.advancePaid || 0));
  const pendingAmount = typeof payment?.pendingAmount === "number" ? payment.pendingAmount : parseFloat(String(payment?.pendingAmount || 0));
  const paidPct = serviceFee > 0 ? Math.round((advancePaid / serviceFee) * 100) : 0;

  // Handle PayU redirect-back status
  const payuStatus = searchParams.get("payu");
  const transactionId = searchParams.get("txn");
  useEffect(() => {
    if (payuStatus === "success") {
      toast({ title: "Payment successful!", description: `Transaction ID: ${transactionId || ""}` });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    } else if (payuStatus === "failed") {
      toast({ title: "Payment failed", description: "Your payment was not completed. Please try again.", variant: "destructive" });
    } else if (payuStatus === "pending") {
      toast({ title: "Payment processing", description: "Waiting for PayU confirmation. Your payment status will refresh automatically." });
    } else if (payuStatus === "error") {
      toast({ title: "Payment error", description: "Something went wrong. Please contact support.", variant: "destructive" });
    }
  }, [payuStatus, transactionId, queryClient, toast]);

  const handlePayNow = async () => {
    if (!payment) return;
    setPayLoading(true);
    try {
      const res = await fetch("/api/payu/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ paymentId: payment.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to initiate payment");
      }
      const { payuUrl, params } = await res.json() as { payuUrl: string; params: Record<string, string> };
      submitPayUForm(payuUrl, params);
    } catch (e) {
      toast({ title: "Payment initiation failed", description: (e as Error).message, variant: "destructive" });
      setPayLoading(false);
    }
  };

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

      {/* PayU return status banners */}
      {searchParams.get("payu") === "success" && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
          <CheckCircle size={20} className="text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Payment Successful!</p>
            <p className="text-sm text-green-700">Transaction ID: {searchParams.get("txn")}</p>
          </div>
        </div>
      )}
      {searchParams.get("payu") === "failed" && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertCircle size={20} className="text-red-600 shrink-0" />
          <div>
            <p className="font-semibold text-red-800">Payment Failed</p>
            <p className="text-sm text-red-700">Your payment was not completed. Please try again.</p>
          </div>
        </div>
      )}

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
          {/* Stats */}
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

          {/* Progress */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Payment Progress</h3>
              {statusBadge(payment.paymentStatus)}
            </div>
            <Progress value={paidPct} className="h-3 mb-2" />
            <div className="text-sm text-muted-foreground">{paidPct}% of total service fee paid</div>
            {payment.paymentStatus === "PAID" && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                <CheckCircle size={18} className="text-green-600" />
                <p className="text-sm text-green-800 font-medium">Full payment received. Thank you!</p>
              </div>
            )}
          </div>

          {/* Pay Now card */}
          {pendingAmount > 0 && (
            <div className="glass-card rounded-2xl p-6 border-2 border-primary/20">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-semibold text-lg">Pay Pending Balance</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Securely pay <span className="font-bold text-foreground">₹{pendingAmount.toLocaleString()}</span> via PayU — UPI, Credit/Debit Card, Net Banking, or Wallets accepted.
                  </p>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                    <ShieldCheck size={13} className="text-green-600" />
                    <span>256-bit SSL secured &nbsp;·&nbsp; Powered by PayU</span>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="btn-gradient border-0 text-white gap-2 shrink-0 px-8"
                  onClick={handlePayNow}
                  disabled={payLoading}
                >
                  {payLoading ? <><Loader2 size={16} className="animate-spin" /> Redirecting...</> : <><CreditCard size={16} /> Pay ₹{pendingAmount.toLocaleString()}</>}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {["UPI", "Credit Card", "Debit Card", "Net Banking", "Wallets"].map(m => (
                  <span key={m} className="text-xs px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground">{m}</span>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold mb-1">Documents</h3>
            <p className="text-xs text-muted-foreground mb-4">Download your payment receipt and service agreement as PDF.</p>
            <div className="flex flex-wrap gap-3">
              <Button className="btn-gradient border-0 text-white gap-2" onClick={handleGenerateReceipt} disabled={!payment || !user || !activeCase}>
                <FileText size={15} /> Download Receipt
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleGenerateAgreement} disabled={!user || !activeCase}>
                <FileSignature size={15} /> Download Agreement
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              A new tab opens — use <strong>Print → Save as PDF</strong> to save.
            </p>
          </div>

          {/* Details */}
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
