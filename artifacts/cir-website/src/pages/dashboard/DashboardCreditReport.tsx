import { useState, useRef, useEffect } from "react";
import { 
  useGetMe, getGetMeQueryKey, 
  useListCreditReports, getListCreditReportsQueryKey,
  useCreateCreditReportUploadUrl, useFinalizeCreditReportUpload,
  useProcessCreditReport, useGetCurrentQuote, getGetCurrentQuoteQueryKey, useCreateQuoteCheckout,
  useCompareCreditReports, getCompareCreditReportsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/contexts/TranslationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Lock, AlertCircle, ShieldAlert, Zap, TrendingUp, CreditCard, ChevronRight, Calculator, IndianRupee, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function DashboardCreditReport() {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: reports, isLoading: reportsLoading } = useListCreditReports(
    { query: { enabled: !!user, queryKey: getListCreditReportsQueryKey() } }
  );

  const { data: quote } = useGetCurrentQuote(
    { query: { enabled: !!user, queryKey: getGetCurrentQuoteQueryKey() } }
  );

  const uploadUrlMut = useCreateCreditReportUploadUrl();
  const finalizeMut = useFinalizeCreditReportUpload();
  const processMut = useProcessCreditReport();
  const checkoutMut = useCreateQuoteCheckout();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [pdfPassword, setPdfPassword] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [compareId, setCompareId] = useState<number | null>(null);

  const activeReport = reports?.find(r => r.isCurrent) || reports?.[0];

  const { data: comparison, isLoading: compareLoading } = useCompareCreditReports(
    activeReport?.id || 0, compareId || 0,
    { query: { enabled: !!activeReport?.id && !!compareId, queryKey: getCompareCreditReportsQueryKey(activeReport?.id || 0, compareId || 0) } }
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "File too large. Maximum 15MB allowed.", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const contentType = selectedFile.type as any;
      if (!["application/pdf", "image/jpeg", "image/png"].includes(contentType)) {
        throw new Error("Invalid file type");
      }

      // 1. Get presigned URL
      const { uploadURL, objectPath, headers } = await uploadUrlMut.mutateAsync({
        data: {
          contentType,
          size: selectedFile.size
        }
      });

      // 2. PUT file to S3
      const putResponse = await fetch(uploadURL, {
        method: "PUT",
        headers: headers as Record<string, string>,
        body: selectedFile
      });
      if (!putResponse.ok) {
        throw new Error("Failed to upload to storage: " + putResponse.statusText);
      }

      // 3. Finalize
      const report = await finalizeMut.mutateAsync({
        data: {
          objectPath,
          originalFilename: selectedFile.name,
          contentType,
          size: selectedFile.size
        }
      });

      queryClient.invalidateQueries({ queryKey: getListCreditReportsQueryKey() });
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      toast({ title: "Report uploaded successfully" });

      if (contentType === "application/pdf") {
        setProcessingId(report.id);
        setShowPasswordDialog(true);
      } else {
        await processMut.mutateAsync({ id: report.id, data: {} });
        queryClient.invalidateQueries({ queryKey: getListCreditReportsQueryKey() });
      }

    } catch (e) {
      toast({ title: "Failed to upload report", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleProcessWithPassword = async () => {
    if (!processingId) return;
    setShowPasswordDialog(false);
    try {
      await processMut.mutateAsync({ id: processingId, data: { password: pdfPassword || undefined } });
      queryClient.invalidateQueries({ queryKey: getListCreditReportsQueryKey() });
      toast({ title: "Processing started" });
    } catch (e) {
      toast({ title: "Failed to start processing", variant: "destructive" });
    }
    setPdfPassword("");
    setProcessingId(null);
  };
  const acceptAndPay = async () => {
    if (!quote) return;
    try {
      const checkout = await checkoutMut.mutateAsync({ id: quote.id, data: { accept: true } });
      const form = document.createElement("form");
      form.method = "POST"; form.action = checkout.payuUrl; form.style.display = "none";
      Object.entries(checkout.params).forEach(([key, value]) => { const input = document.createElement("input"); input.type = "hidden"; input.name = key; input.value = value; form.appendChild(input); });
      document.body.appendChild(form); form.submit();
    } catch (error) {
      toast({ title: "Could not start secure checkout", description: (error as Error).message, variant: "destructive" });
    }
  };

  if (reportsLoading) return <div className="p-8 text-center text-muted-foreground">{t("common.loading")}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t("nav.creditReport")}</h2>
        <p className="text-muted-foreground text-sm mt-1">Intelligence and insights from your latest credit report.</p>
      </div>

      {!activeReport ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <FileText size={48} className="mx-auto mb-4 text-primary/40" />
          <h3 className="text-lg font-semibold mb-2">{t("report.noReport")}</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">{t("report.uploadDesc")}</p>
          
          <div className="max-w-md mx-auto border-2 border-dashed border-primary/20 rounded-xl p-6 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => fileRef.current?.click()}>
            <Upload size={24} className="text-primary/60 mx-auto mb-2" />
            {selectedFile ? (
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium">{t("report.uploadBtn")}</p>
                <p className="text-xs text-muted-foreground">{t("report.fileTypes")}</p>
              </div>
            )}
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
          </div>
          {selectedFile && (
            <Button className="mt-4 btn-gradient text-white w-full max-w-md" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? t("report.uploading") : t("common.submit")}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex flex-wrap gap-4 items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold gradient-text">{activeReport.bureau || "Credit Report"}</h3>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">{activeReport.version}</Badge>
                  {activeReport.processingStatus === "NEEDS_MANUAL_REVIEW" && (
                    <Badge variant="destructive" className="flex items-center gap-1"><ShieldAlert size={12}/> {t("report.needsReview")}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeReport.reportDate ? t("dashboard.reportProcessed", { date: new Date(activeReport.reportDate).toLocaleDateString() }) : new Date(activeReport.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">{t("dashboard.score")}</div>
                <div className="text-3xl font-bold text-foreground">{activeReport.score || "—"}</div>
              </div>
            </div>

            {activeReport.processingStatus === "PROCESSING" && (
              <div className="p-4 bg-blue-50 text-blue-700 rounded-xl flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0"/>
                <span className="font-medium text-sm">{t("report.processing")}</span>
              </div>
            )}
            {activeReport.processingStatus === "FAILED" && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
                <AlertCircle size={20} className="shrink-0"/>
                <span className="font-medium text-sm">{t("report.failed")} - Please re-upload or contact support.</span>
              </div>
            )}
            
            {activeReport.processingStatus === "PROCESSED" && !!activeReport.analysis && (
              <div className="space-y-4">
                <div className="p-5 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-primary/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={18} className="text-primary" />
                    <h4 className="font-semibold">Analysis Pending Review</h4>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80 mb-2">
                    {(activeReport.summaries as any)?.[language] || (activeReport.summaries as any)?.ENGLISH || "Analysis has been generated and is awaiting final manual review. Scanned images and uncertain extraction require verification by our experts before the finalized insights are provided."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Tabs defaultValue="detail">
            <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 mb-6">
              <TabsTrigger value="detail" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 py-2">{t("report.tabs.detail")}</TabsTrigger>
              <TabsTrigger value="compare" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 py-2">{t("report.tabs.compare")}</TabsTrigger>
              <TabsTrigger value="quote" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 py-2">{t("report.tabs.quote")}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="detail" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-card rounded-2xl p-5">
                  <h4 className="font-semibold flex items-center gap-2 mb-4"><CreditCard size={18} className="text-primary" /> {t("report.accounts")}</h4>
                  <div className="space-y-3">
                    {Array.isArray(activeReport.accounts) && activeReport.accounts.length > 0 ? activeReport.accounts.map((acc: any, i: number) => (
                      <div key={i} className="p-3 border rounded-xl flex justify-between items-center bg-white/50">
                        <div>
                          <div className="font-medium text-sm">{acc.bankName}</div>
                          <div className="text-xs text-muted-foreground">{acc.accountType} · {acc.accountNumberMasked}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">₹{acc.currentBalance}</div>
                          <Badge variant="outline" className={`text-[10px] mt-1 ${acc.status === "ACTIVE" ? "border-green-200 text-green-700 bg-green-50" : "border-muted"}`}>{acc.status}</Badge>
                        </div>
                      </div>
                    )) : <div className="text-sm text-muted-foreground">No accounts extracted or pending review.</div>}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-5">
                  <h4 className="font-semibold flex items-center gap-2 mb-4"><ShieldAlert size={18} className="text-destructive" /> {t("report.flags")}</h4>
                  <div className="space-y-3">
                    {Array.isArray(activeReport.flags) && activeReport.flags.length > 0 ? activeReport.flags.map((flag: any, i: number) => (
                      <div key={i} className="p-3 border border-red-100 bg-red-50/50 rounded-xl flex gap-3">
                        <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-sm text-red-900">{flag.title}</div>
                          <div className="text-xs text-red-700 mt-1">{flag.description}</div>
                        </div>
                      </div>
                    )) : <div className="text-sm text-muted-foreground text-center py-4">No critical flags found or pending review.</div>}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="compare">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="font-semibold mb-1">Compare Versions</h3>
                    <p className="text-sm text-muted-foreground">Original (initial upload) vs Updated/Rectified (post-consultation).</p>
                  </div>
                  {reports && reports.length > 1 && (
                    <div className="w-full sm:w-auto">
                      <select 
                        className="w-full sm:w-64 p-2 rounded-lg border bg-white text-sm"
                        value={compareId || ""}
                        onChange={e => setCompareId(e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">Select report to compare...</option>
                        {reports.filter(r => r.id !== activeReport.id).map(r => (
                          <option key={r.id} value={r.id}>
                            {r.version} - {new Date(r.createdAt).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {!reports || reports.length < 2 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <TrendingUp size={48} className="mx-auto mb-4 text-primary/40" />
                    <p>Comparison requires multiple report versions (e.g., Original vs Rectified).</p>
                  </div>
                ) : !compareId ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>Please select a previous report version above to view the comparison.</p>
                  </div>
                ) : compareLoading ? (
                  <div className="text-center py-10 text-muted-foreground">{t("common.loading")}</div>
                ) : comparison ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex flex-wrap gap-6 items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Previous Score</div>
                        <div className="text-2xl font-bold">{comparison.comparedReport.score || "N/A"}</div>
                      </div>
                      <div className="flex items-center text-primary">
                        <ArrowRight size={24} className="opacity-50" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Current Score</div>
                        <div className="text-2xl font-bold">{comparison.currentReport.score || "N/A"}</div>
                      </div>
                      {comparison.scoreChange != null && (
                        <div className={`px-3 py-1.5 rounded-lg font-bold text-sm ${comparison.scoreChange > 0 ? "bg-green-100 text-green-700" : comparison.scoreChange < 0 ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"}`}>
                          {comparison.scoreChange > 0 ? "+" : ""}{comparison.scoreChange} Points
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-xl">
                      <strong>Disclaimer:</strong> {comparison.disclaimer} Note: RECTIFIED label indicates our process completion, not a guarantee of score improvement.
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">Comparison failed or not available.</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="quote">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calculator className="text-primary w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{t("report.tabs.quote")}</h3>
                    <p className="text-sm text-muted-foreground">Deterministic pricing based on your report</p>
                  </div>
                </div>

                {quote ? (
                  <div className="space-y-4 max-w-lg">
                    <div className="space-y-3">
                      {quote.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            {(item.code || (item as { label?: string }).label || "Service item").replace(/_/g, " ")}
                          </span>
                          <span className="font-medium flex items-center"><IndianRupee size={12} className="mr-0.5"/>{item.amount}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t flex justify-between items-center font-bold text-lg">
                      <span>Total</span>
                      <span className="flex items-center text-primary"><IndianRupee size={16} className="mr-0.5"/>{quote.total}</span>
                    </div>
                    <Button className="btn-gradient text-white w-full" onClick={acceptAndPay} disabled={checkoutMut.isPending}>
                      {checkoutMut.isPending ? "Preparing secure checkout..." : quote.acceptedAt ? "Resume secure payment" : "Accept quote & pay securely"}
                    </Button>
                    {quote.acceptedAt && <p className="text-xs text-muted-foreground">You can safely resume a pending checkout or start a new secure attempt after a failed payment.</p>}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Quote will be generated after report is fully processed and reviewed.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock size={18} className="text-primary"/> PDF Password Required</DialogTitle>
            <DialogDescription>
              If your credit report is password protected, please enter it below. This is never stored.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              type="password" 
              placeholder="Report password (optional)" 
              value={pdfPassword} 
              onChange={e => setPdfPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleProcessWithPassword()}>Skip</Button>
            <Button className="btn-gradient text-white" onClick={() => handleProcessWithPassword()}>Process Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}