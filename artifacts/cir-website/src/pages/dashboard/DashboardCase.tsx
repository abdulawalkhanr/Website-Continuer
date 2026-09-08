import { useGetMe, useListCases, getGetMeQueryKey, getListCasesQueryKey } from "@workspace/api-client-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_STEPS = [
  { key: "DOCUMENTS_SUBMITTED", label: "Documents Submitted", desc: "Your case documents have been received and logged in our system.", pct: 10 },
  { key: "CASE_REVIEW", label: "Case Review", desc: "Our credit experts are analysing your credit report and identifying all issues.", pct: 25 },
  { key: "DOCUMENTATION_VERIFIED", label: "Documentation Verified", desc: "All submitted documents have been verified and the dispute is being prepared.", pct: 40 },
  { key: "DISPUTE_SUBMITTED", label: "Dispute Submitted", desc: "Formal dispute has been filed with the concerned credit bureau and/or lender.", pct: 60 },
  { key: "BUREAU_LENDER_REVIEW", label: "Bureau/Lender Review", desc: "The credit bureau and lender are reviewing the dispute. This typically takes 30–45 days.", pct: 75 },
  { key: "FOLLOW_UP", label: "Follow Up In Progress", desc: "We are actively following up with the bureau/lender to expedite resolution.", pct: 88 },
  { key: "COMPLETED", label: "Resolution Complete", desc: "Your credit report has been successfully updated. Please download a fresh credit report to verify.", pct: 100 },
];

export default function DashboardCase() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: cases, isLoading } = useListCases(
    user ? { customerId: user.id } : {},
    { query: { enabled: !!user, queryKey: getListCasesQueryKey(user ? { customerId: user.id } : {}) } }
  );

  const activeCase = cases?.[0];
  const currentStepIdx = activeCase ? STATUS_STEPS.findIndex(s => s.key === activeCase.status) : -1;

  if (isLoading) return <div className="glass-card rounded-2xl p-8 animate-pulse text-center text-muted-foreground">Loading case details...</div>;

  if (!activeCase) return (
    <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">
      <p className="font-medium">No case found. Contact our support team to register your case.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Case Details</h2>
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Case Number</div>
            <div className="text-2xl font-bold gradient-text">{activeCase.caseNumber}</div>
          </div>
          <Badge className={activeCase.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary border-primary/20"}>
            {activeCase.status.replace(/_/g, " ")}
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
          <div><div className="text-muted-foreground text-xs">Service</div><div className="font-medium">{activeCase.serviceType}</div></div>
          <div><div className="text-muted-foreground text-xs">Customer</div><div className="font-medium">{user?.name}</div></div>
          {!!(activeCase as unknown as Record<string, unknown>).assignedToName && <div><div className="text-muted-foreground text-xs">Assigned To</div><div className="font-medium">{(activeCase as unknown as Record<string, unknown>).assignedToName as string}</div></div>}
          {activeCase.expectedCompletionDate && <div><div className="text-muted-foreground text-xs">Expected Completion</div><div className="font-medium">{activeCase.expectedCompletionDate}</div></div>}
          <div><div className="text-muted-foreground text-xs">Registered On</div><div className="font-medium">{new Date(activeCase.createdAt).toLocaleDateString()}</div></div>
          <div><div className="text-muted-foreground text-xs">Last Updated</div><div className="font-medium">{new Date(activeCase.updatedAt).toLocaleDateString()}</div></div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-bold text-primary">{activeCase.progressPercentage}%</span>
          </div>
          <Progress value={activeCase.progressPercentage} className="h-3 mb-1" />
        </div>
        {activeCase.notes && (
          <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <div className="text-xs font-semibold text-primary mb-1">Notes from our team</div>
            <p className="text-sm text-muted-foreground">{activeCase.notes}</p>
          </div>
        )}
      </div>

      {/* Full Timeline */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-6">Case Timeline</h3>
        <div className="space-y-6">
          {STATUS_STEPS.map((step, i) => {
            const isDone = i <= currentStepIdx;
            const isCurrent = i === currentStepIdx;
            return (
              <motion.div key={step.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCurrent ? "btn-gradient shadow-md" : isDone ? "bg-green-100" : "bg-muted"}`}>
                    {isDone ? <CheckCircle size={18} className={isCurrent ? "text-white" : "text-green-600"} /> : <Clock size={16} className="text-muted-foreground" />}
                  </div>
                  {i < STATUS_STEPS.length - 1 && <div className={`w-0.5 flex-1 mt-2 ${isDone ? "bg-green-300" : "bg-border"}`} style={{ minHeight: 24 }} />}
                </div>
                <div className="pb-4 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-semibold ${isDone ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</span>
                    {isCurrent && <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Current Stage</Badge>}
                    {isDone && !isCurrent && <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Completed</Badge>}
                  </div>
                  <p className={`text-sm ${isDone ? "text-muted-foreground" : "text-muted-foreground/50"}`}>{step.desc}</p>
                  <div className="text-xs text-muted-foreground mt-1">{step.pct}% progress</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
