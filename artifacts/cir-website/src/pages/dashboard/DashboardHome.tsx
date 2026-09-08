import { motion } from "framer-motion";
import { useGetMe, useListCases, useListDocuments, getListCasesQueryKey, getListDocumentsQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FileText, CreditCard, MessageSquare, Bell, CheckCircle, Clock, ArrowRight } from "lucide-react";

const STATUS_STEPS = [
  { key: "DOCUMENTS_SUBMITTED", label: "Documents Submitted", pct: 10 },
  { key: "CASE_REVIEW", label: "Case Review", pct: 25 },
  { key: "DOCUMENTATION_VERIFIED", label: "Docs Verified", pct: 40 },
  { key: "DISPUTE_SUBMITTED", label: "Dispute Submitted", pct: 60 },
  { key: "BUREAU_LENDER_REVIEW", label: "Bureau Review", pct: 75 },
  { key: "FOLLOW_UP", label: "Follow Up", pct: 88 },
  { key: "COMPLETED", label: "Completed", pct: 100 },
];

function getStatusColor(status: string) {
  if (status === "COMPLETED") return "bg-green-100 text-green-700 border-green-200";
  if (["DISPUTE_SUBMITTED", "BUREAU_LENDER_REVIEW", "FOLLOW_UP"].includes(status)) return "bg-blue-100 text-blue-700 border-blue-200";
  return "bg-primary/10 text-primary border-primary/20";
}

export default function DashboardHome() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: cases, isLoading: casesLoading } = useListCases(
    user ? { customerId: user.id } : {},
    { query: { enabled: !!user, queryKey: getListCasesQueryKey(user ? { customerId: user.id } : {}) } }
  );

  const activeCase = cases?.[0];
  const currentStepIdx = activeCase ? STATUS_STEPS.findIndex(s => s.key === activeCase.status) : -1;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="glass-card rounded-2xl p-6">
          <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.name?.split(" ")[0] || "Customer"}</h1>
          <p className="text-muted-foreground text-sm">Here's a summary of your credit case and recent activity.</p>
        </div>
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "My Case", href: "/dashboard/case", icon: <FileText size={22} />, color: "bg-primary/10 text-primary" },
          { label: "Documents", href: "/dashboard/documents", icon: <FileText size={22} />, color: "bg-accent/20 text-accent-foreground" },
          { label: "Payments", href: "/dashboard/payments", icon: <CreditCard size={22} />, color: "bg-secondary/50 text-secondary-foreground" },
          { label: "Support", href: "/dashboard/tickets", icon: <MessageSquare size={22} />, color: "bg-green-100 text-green-700" },
        ].map(action => (
          <Link key={action.label} href={action.href}>
            <div className="glass-card rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:shadow-md transition-shadow text-center h-full">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>{action.icon}</div>
              <span className="text-sm font-medium">{action.label}</span>
              <ArrowRight size={14} className="text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>

      {/* Active case card */}
      {casesLoading ? (
        <div className="glass-card rounded-2xl p-8 animate-pulse text-center text-muted-foreground">Loading case details...</div>
      ) : activeCase ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="glass-card rounded-2xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Case Number</div>
                <div className="text-xl font-bold gradient-text">{activeCase.caseNumber}</div>
              </div>
              <Badge className={getStatusColor(activeCase.status)}>{activeCase.status.replace(/_/g, " ")}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-sm">
              <div><div className="text-muted-foreground text-xs">Service Type</div><div className="font-medium">{activeCase.serviceType}</div></div>
              {!!(activeCase as unknown as Record<string, unknown>).assignedToName && <div><div className="text-muted-foreground text-xs">Assigned To</div><div className="font-medium">{(activeCase as unknown as Record<string, unknown>).assignedToName as string}</div></div>}
              {activeCase.expectedCompletionDate && <div><div className="text-muted-foreground text-xs">Expected Completion</div><div className="font-medium">{activeCase.expectedCompletionDate}</div></div>}
            </div>
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-bold text-primary">{activeCase.progressPercentage}%</span>
              </div>
              <Progress value={activeCase.progressPercentage} className="h-3" />
            </div>
            {/* Timeline steps */}
            <div className="grid grid-cols-7 gap-1">
              {STATUS_STEPS.map((step, i) => {
                const isDone = i <= currentStepIdx;
                const isCurrent = i === currentStepIdx;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${isCurrent ? "btn-gradient text-white shadow-md" : isDone ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"}`}>
                      {isDone ? <CheckCircle size={14} /> : <Clock size={12} />}
                    </div>
                    <div className="text-[9px] text-center text-muted-foreground leading-tight hidden sm:block">{step.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end">
              <Link href="/dashboard/case">
                <Button size="sm" className="btn-gradient border-0 text-white">View Full Timeline <ArrowRight size={14} className="ml-1" /></Button>
              </Link>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">
          <FileText size={40} className="mx-auto mb-3 text-primary/40" />
          <p className="font-medium mb-1">No active case</p>
          <p className="text-sm">Your case will appear here once registered by our team.</p>
          <a href="tel:01169296558" className="mt-4 inline-block">
            <Button className="btn-gradient border-0 text-white mt-2">Contact Support</Button>
          </a>
        </div>
      )}
    </div>
  );
}
