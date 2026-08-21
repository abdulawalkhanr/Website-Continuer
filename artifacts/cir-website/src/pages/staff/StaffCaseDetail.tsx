import { useState } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetStaffPortalCase, useUpdateStaffPortalCase, useCreateCaseNote, useCreateCaseComm,
  getGetStaffPortalCaseQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, Clock, FileText, Send, User, MapPin, Mail, Phone, Calendar } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  DOCUMENTS_SUBMITTED: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CASE_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
  DOCUMENTATION_VERIFIED: "bg-purple-50 text-purple-700 border-purple-200",
  DISPUTE_SUBMITTED: "bg-primary/10 text-primary border-primary/20",
  BUREAU_LENDER_REVIEW: "bg-orange-50 text-orange-700 border-orange-200",
  FOLLOW_UP: "bg-teal-50 text-teal-700 border-teal-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
};

export default function StaffCaseDetail() {
  const { id } = useParams();
  const caseId = parseInt(id || "0");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useGetStaffPortalCase(caseId, { 
    query: { enabled: !!caseId, queryKey: getGetStaffPortalCaseQueryKey(caseId) } 
  });

  const updateCase = useUpdateStaffPortalCase();
  const createNote = useCreateCaseNote();
  const createComm = useCreateCaseComm();

  // Local state for forms
  const [status, setStatus] = useState<any>("");
  const [progress, setProgress] = useState("");
  const [summary, setSummary] = useState("");
  
  const [noteText, setNoteText] = useState("");
  
  const [commType, setCommType] = useState<any>("CALLED_CUSTOMER");
  const [commNote, setCommNote] = useState("");
  const [commFollowUp, setCommFollowUp] = useState("");

  const handleUpdateStatus = () => {
    if (!data) return;
    updateCase.mutate({
      caseId: caseId,
      data: {
        status: status || data.case.status,
        progressPercentage: progress ? parseInt(progress) : data.case.progressPercentage,
        summary: summary || undefined
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStaffPortalCaseQueryKey(caseId) });
        toast({ title: "Case updated successfully" });
        setSummary("");
      },
      onError: () => toast({ title: "Update failed", variant: "destructive" })
    });
  };

  const handleAddNote = () => {
    if (!noteText) return;
    createNote.mutate({ caseId, data: { note: noteText } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStaffPortalCaseQueryKey(caseId) });
        setNoteText("");
        toast({ title: "Note added" });
      },
      onError: () => toast({ title: "Failed to add note", variant: "destructive" })
    });
  };

  const handleLogComm = () => {
    if (!commType) return;
    createComm.mutate({ 
      caseId, 
      data: { 
        type: commType, 
        note: commNote || undefined, 
        nextFollowUpDate: commFollowUp || undefined 
      } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStaffPortalCaseQueryKey(caseId) });
        setCommType("CALLED_CUSTOMER");
        setCommNote("");
        setCommFollowUp("");
        toast({ title: "Communication logged" });
      },
      onError: () => toast({ title: "Failed to log communication", variant: "destructive" })
    });
  };

  if (isLoading) return <div className="py-12 text-center">Loading case details...</div>;
  if (!data) return <div className="py-12 text-center text-red-500">Case not found</div>;

  return (
    <div className="space-y-6">
      <Link href="/staff/cases" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft size={16} className="mr-2" /> Back to My Cases
      </Link>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-white p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{data.case.caseNumber}</h1>
            <Badge className={STATUS_COLORS[data.case.status]}>{data.case.status.replace(/_/g, " ")}</Badge>
            <Badge variant="outline" className={data.assignment.priority === "URGENT" || data.assignment.priority === "HIGH" ? "text-destructive border-destructive" : ""}>
              {data.assignment.priority} Priority
            </Badge>
          </div>
          <p className="text-lg font-medium text-muted-foreground">{data.case.serviceType}</p>
          {data.assignment.dueDate && (
            <div className="flex items-center text-sm text-destructive mt-2 font-medium">
              <Clock size={14} className="mr-1" /> Due: {new Date(data.assignment.dueDate).toLocaleDateString()}
            </div>
          )}
        </div>
        
        <div className="w-full md:w-64 bg-muted/30 p-4 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold">Overall Progress</span>
            <span className="text-sm font-bold text-primary">{data.case.progressPercentage}%</span>
          </div>
          <Progress value={data.case.progressPercentage} className="h-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Updates */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="update">
            <TabsList className="w-full bg-white border border-border p-1 rounded-xl shadow-sm h-auto">
              <TabsTrigger value="update" className="flex-1 py-2.5 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Update Status</TabsTrigger>
              <TabsTrigger value="note" className="flex-1 py-2.5 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Internal Note</TabsTrigger>
              <TabsTrigger value="comm" className="flex-1 py-2.5 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Log Comm</TabsTrigger>
            </TabsList>
            
            <TabsContent value="update" className="bg-white p-6 rounded-xl border border-border shadow-sm mt-4">
              <h3 className="font-semibold mb-4 text-lg">Update Case Status</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>New Status</Label>
                    <Select value={status || data.case.status} onValueChange={setStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Progress (%)</Label>
                    <Input type="number" min="0" max="100" value={progress || data.case.progressPercentage} onChange={e => setProgress(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Activity Summary (Optional)</Label>
                  <Textarea placeholder="What was done?" value={summary} onChange={e => setSummary(e.target.value)} rows={3} />
                </div>
                <Button className="w-full btn-gradient text-white border-0" onClick={handleUpdateStatus} disabled={updateCase.isPending}>
                  {updateCase.isPending ? "Updating..." : "Save Case Update"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="note" className="bg-white p-6 rounded-xl border border-border shadow-sm mt-4">
              <h3 className="font-semibold mb-4 text-lg">Add Internal Note</h3>
              <div className="space-y-4">
                <Textarea placeholder="Type internal staff note here..." value={noteText} onChange={e => setNoteText(e.target.value)} rows={4} />
                <Button className="w-full" onClick={handleAddNote} disabled={createNote.isPending || !noteText}>
                  {createNote.isPending ? "Adding..." : "Add Internal Note"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="comm" className="bg-white p-6 rounded-xl border border-border shadow-sm mt-4">
              <h3 className="font-semibold mb-4 text-lg">Log Customer Communication</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Communication Type</Label>
                    <Select value={commType} onValueChange={setCommType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CALLED_CUSTOMER">Called Customer</SelectItem>
                        <SelectItem value="WHATSAPP_SENT">WhatsApp Sent</SelectItem>
                        <SelectItem value="EMAIL_SENT">Email Sent</SelectItem>
                        <SelectItem value="DOCUMENTS_REQUESTED">Documents Requested</SelectItem>
                        <SelectItem value="CUSTOMER_RESPONDED">Customer Responded</SelectItem>
                        <SelectItem value="FOLLOW_UP_REQUIRED">Follow-up Required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Next Follow-up Date (Optional)</Label>
                    <Input type="date" value={commFollowUp} onChange={e => setCommFollowUp(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="Details of the communication..." value={commNote} onChange={e => setCommNote(e.target.value)} rows={3} />
                </div>
                <Button className="w-full" onClick={handleLogComm} disabled={createComm.isPending || !commType}>
                  {createComm.isPending ? "Logging..." : "Log Communication"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Documents & Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
              <h3 className="font-semibold mb-4 text-lg">Documents</h3>
              <div className="space-y-3">
                {data.documents?.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-primary" />
                      <div>
                        <div className="text-sm font-medium">{doc.name}</div>
                        <div className="text-[10px] text-muted-foreground">{doc.type.replace(/_/g, " ")}</div>
                      </div>
                    </div>
                    {doc.fileUrl && (
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:bg-primary/10 p-1.5 rounded-md transition-colors">
                        <FileText size={14} />
                      </a>
                    )}
                  </div>
                ))}
                {(!data.documents || data.documents.length === 0) && (
                  <div className="text-sm text-muted-foreground text-center py-2">No documents.</div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
              <h3 className="font-semibold mb-4 text-lg">Related Tasks</h3>
              <div className="space-y-3">
                {data.tasks?.map(task => (
                  <div key={task.id} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-sm font-medium">{task.title}</div>
                      <Badge variant="outline" className="text-[9px] px-1 py-0">{task.status.replace(/_/g, " ")}</Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground flex justify-between mt-2">
                      <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}</span>
                      <span className={task.priority === "URGENT" || task.priority === "HIGH" ? "text-destructive font-semibold" : ""}>{task.priority}</span>
                    </div>
                  </div>
                ))}
                {(!data.tasks || data.tasks.length === 0) && (
                  <div className="text-sm text-muted-foreground text-center py-2">No tasks.</div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline / Activity */}
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm mt-6">
            <h3 className="font-semibold mb-6 text-lg">Case Timeline</h3>
            <div className="space-y-6 pl-4 border-l-2 border-muted relative">
              {data.activities?.map((act, i) => (
                <div key={act.id} className="relative">
                  <div className="absolute -left-[23px] bg-white p-1 rounded-full border border-border">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{act.action.replace(/_/g, " ")}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                      <span>{new Date(act.createdAt).toLocaleString()}</span>
                      <span>•</span>
                      <span>{act.actorName}</span>
                    </div>
                    {act.summary && <div className="text-sm mt-2 text-foreground/80 bg-muted/40 p-3 rounded-lg border border-border/50">{act.summary}</div>}
                    {act.newStatus && act.previousStatus !== act.newStatus && (
                      <div className="text-xs mt-2 text-muted-foreground">
                        Status changed to <Badge variant="secondary" className="text-[10px] ml-1">{act.newStatus.replace(/_/g, " ")}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {(!data.activities || data.activities.length === 0) && (
                <div className="text-sm text-muted-foreground ml-2">No activity recorded yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Customer & Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
            <h3 className="font-semibold mb-4 text-lg border-b border-border pb-2 flex items-center gap-2">
              <User size={18} className="text-primary" /> Client Details
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Name</Label>
                <div className="font-medium">{data.customer?.name}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Mobile</Label>
                <div className="flex items-center gap-2">
                  <a href={`tel:${data.customer?.mobile}`} className="text-primary font-medium hover:underline">{data.customer?.mobile}</a>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Email</Label>
                <div className="break-all">{data.customer?.email}</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
            <h3 className="font-semibold mb-4 text-lg border-b border-border pb-2 flex items-center gap-2">
              <FileText size={18} className="text-primary" /> Internal Notes
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {data.notes?.map(n => (
                <div key={n.id} className="bg-yellow-50/50 border border-yellow-100 p-3 rounded-lg">
                  <div className="text-xs font-semibold text-yellow-800 mb-1 flex justify-between">
                    <span>{n.authorName}</span>
                    <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm text-yellow-900/90 whitespace-pre-wrap">{n.note}</div>
                </div>
              ))}
              {(!data.notes || data.notes.length === 0) && (
                <div className="text-sm text-muted-foreground text-center py-4">No internal notes.</div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
            <h3 className="font-semibold mb-4 text-lg border-b border-border pb-2 flex items-center gap-2">
              <Send size={18} className="text-primary" /> Comm Log
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {data.communications?.map(c => (
                <div key={c.id} className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
                  <div className="text-xs font-semibold text-slate-700 mb-1 flex justify-between">
                    <Badge variant="outline" className="text-[9px] px-1 py-0">{c.type.replace(/_/g, " ")}</Badge>
                  </div>
                  {c.note && <div className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{c.note}</div>}
                  <div className="text-[10px] text-slate-400 mt-2 flex justify-between">
                    <span>By {c.staffName} on {new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {(!data.communications || data.communications.length === 0) && (
                <div className="text-sm text-muted-foreground text-center py-4">No comms logged.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
