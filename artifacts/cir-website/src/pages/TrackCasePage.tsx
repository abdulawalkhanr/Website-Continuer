import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Search } from "lucide-react";
import { useTrackCase, getTrackCaseQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_STEPS = [
  { key: "DOCUMENTS_SUBMITTED", label: "Documents Submitted", pct: 10 },
  { key: "CASE_REVIEW", label: "Case Review Started", pct: 25 },
  { key: "DOCUMENTATION_VERIFIED", label: "Documentation Verified", pct: 40 },
  { key: "DISPUTE_SUBMITTED", label: "Dispute Submitted", pct: 60 },
  { key: "BUREAU_LENDER_REVIEW", label: "Bureau/Lender Review", pct: 75 },
  { key: "FOLLOW_UP", label: "Follow Up In Progress", pct: 88 },
  { key: "COMPLETED", label: "Completed", pct: 100 },
];

export default function TrackCasePage() {
  const [caseNumber, setCaseNumber] = useState("");
  const [mobile, setMobile] = useState("");
  const [query, setQuery] = useState<{ caseNumber?: string; mobile?: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: caseData, isLoading, error } = useTrackCase(query || {}, {
    query: { enabled: !!query, queryKey: getTrackCaseQueryKey(query || {}) },
  });

  const handleSearch = (type: "case" | "mobile") => {
    if (type === "case" && caseNumber) setQuery({ caseNumber });
    if (type === "mobile" && mobile) setQuery({ mobile });
  };

  const currentStepIdx = caseData ? STATUS_STEPS.findIndex(s => s.key === caseData.status) : -1;

  return (
    <div className="min-h-screen">
      <section className="hero-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Case Tracking</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Track Your Case</h1>
          <p className="text-lg text-muted-foreground">Enter your Case ID or mobile number to track real-time progress</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-2xl p-8 mb-8">
            <Tabs defaultValue="case">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="case" className="flex-1">Track by Case ID</TabsTrigger>
                <TabsTrigger value="mobile" className="flex-1">Track by Mobile</TabsTrigger>
              </TabsList>
              <TabsContent value="case">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Case ID</Label>
                    <Input data-testid="track-case-id" value={caseNumber} onChange={e => setCaseNumber(e.target.value)} placeholder="e.g. CIR-2026-1234" onKeyDown={e => e.key === "Enter" && handleSearch("case")} />
                  </div>
                  <Button className="w-full btn-gradient border-0 text-white" onClick={() => handleSearch("case")} disabled={!caseNumber || isLoading} data-testid="track-case-submit">
                    <Search size={18} className="mr-2" /> {isLoading ? "Searching..." : "Track Case"}
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="mobile">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mobile Number</Label>
                    <Input data-testid="track-mobile" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Registered mobile number" onKeyDown={e => e.key === "Enter" && handleSearch("mobile")} />
                  </div>
                  <Button className="w-full btn-gradient border-0 text-white" onClick={() => handleSearch("mobile")} disabled={!mobile || isLoading} data-testid="track-mobile-submit">
                    <Search size={18} className="mr-2" /> {isLoading ? "Searching..." : "Track Case"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {error && (
            <div className="glass-card rounded-2xl p-6 text-center text-muted-foreground">
              Case not found. Please check your Case ID or mobile number.
            </div>
          )}

          {caseData && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Case Number</div>
                    <div className="text-xl font-bold gradient-text">{caseData.caseNumber}</div>
                  </div>
                  <Badge className={caseData.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary border-primary/20"}>
                    {caseData.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div><div className="text-muted-foreground">Customer</div><div className="font-medium">{caseData.customerName}</div></div>
                  <div><div className="text-muted-foreground">Service</div><div className="font-medium">{caseData.serviceType}</div></div>
                  {caseData.expectedCompletionDate && <div><div className="text-muted-foreground">Expected Completion</div><div className="font-medium">{caseData.expectedCompletionDate}</div></div>}
                  <div><div className="text-muted-foreground">Last Updated</div><div className="font-medium">{new Date(caseData.updatedAt).toLocaleDateString()}</div></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="font-bold text-primary">{caseData.progressPercentage}%</span>
                  </div>
                  <Progress value={caseData.progressPercentage} className="h-3" />
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold mb-6">Case Timeline</h3>
                <div className="space-y-4">
                  {STATUS_STEPS.map((step, i) => {
                    const isDone = i <= currentStepIdx;
                    const isCurrent = i === currentStepIdx;
                    return (
                      <div key={step.key} className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDone ? "btn-gradient" : "bg-muted"}`}>
                          {isDone ? <CheckCircle size={16} className="text-white" /> : <Clock size={14} className="text-muted-foreground" />}
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${isDone ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</div>
                        </div>
                        {isCurrent && <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Current</Badge>}
                        {isDone && !isCurrent && <CheckCircle size={16} className="text-green-500" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
