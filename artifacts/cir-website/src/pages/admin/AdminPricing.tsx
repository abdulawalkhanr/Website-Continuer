import { useState } from "react";
import { 
  useListPricingRules, getListPricingRulesQueryKey,
  useCreatePricingRule, useUpdatePricingRule, useDeletePricingRule
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Plus, Tag, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";

export default function AdminPricing() {
  const { data: rules, isLoading } = useListPricingRules({ query: { queryKey: getListPricingRulesQueryKey() } });
  const createRule = useCreatePricingRule();
  const updateRule = useUpdatePricingRule();
  const deleteRule = useDeletePricingRule();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  // Form State
  const [name, setName] = useState("");
  const [serviceInfo, setServiceInfo] = useState("");
  const [baseFee, setBaseFee] = useState("1000");
  const [capFee, setCapFee] = useState("");
  const [issueFees, setIssueFees] = useState<{key: string, value: string}[]>([
    { key: "LATE_PAYMENT", value: "500" },
    { key: "DEFAULT", value: "1000" }
  ]);

  const resetForm = () => {
    setName("");
    setServiceInfo("");
    setBaseFee("1000");
    setCapFee("");
    setIssueFees([
      { key: "LATE_PAYMENT", value: "500" },
      { key: "DEFAULT", value: "1000" }
    ]);
    setEditId(null);
    setShowCreate(false);
  };

  const handleEditInit = (r: any) => {
    setEditId(r.id);
    setName(r.name);
    setServiceInfo(r.serviceInfo || "");
    setBaseFee(r.baseFee.toString());
    setCapFee(r.capFee ? r.capFee.toString() : "");
    setIssueFees(Object.entries(r.issueFees).map(([k,v]) => ({ key: k, value: String(v) })));
    setShowCreate(true);
  };

  const handleSave = async () => {
    if (!name || !baseFee) return;
    const issueFeesObj: Record<string, number> = {};
    issueFees.forEach(f => { if (f.key && f.value) issueFeesObj[f.key] = Number(f.value); });
    
    try {
      if (editId) {
        await updateRule.mutateAsync({
          id: editId,
          data: {
            name,
            serviceInfo: serviceInfo || null,
            baseFee: Number(baseFee),
            capFee: capFee ? Number(capFee) : null,
            issueFees: issueFeesObj
          }
        });
        toast({ title: "Pricing Rule Updated" });
      } else {
        await createRule.mutateAsync({
          data: {
            name,
            serviceInfo: serviceInfo || null,
            baseFee: Number(baseFee),
            capFee: capFee ? Number(capFee) : null,
            issueFees: issueFeesObj,
            isActive: true
          }
        });
        toast({ title: "Pricing Rule Created" });
      }
      queryClient.invalidateQueries({ queryKey: getListPricingRulesQueryKey() });
      resetForm();
    } catch (e) {
      toast({ title: "Failed to save pricing rule", variant: "destructive" });
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await updateRule.mutateAsync({ id, data: { isActive } });
      queryClient.invalidateQueries({ queryKey: getListPricingRulesQueryKey() });
      toast({ title: isActive ? "Rule activated" : "Rule deactivated" });
    } catch (e) {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    try {
      await deleteRule.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListPricingRulesQueryKey() });
      toast({ title: "Rule deleted" });
    } catch (e) {
      toast({ title: "Failed to delete rule", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pricing Rules</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage deterministic base and issue-specific fees</p>
        </div>
        <Button className="btn-gradient border-0 text-white gap-2" onClick={() => { resetForm(); setShowCreate(true); }}>
          <Plus size={16} /> Add Rule
        </Button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule Name</TableHead>
              <TableHead>Base Fee</TableHead>
              <TableHead>Cap Fee</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : !rules?.length ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">No rules found</TableCell></TableRow>
            ) : rules.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  {r.name}
                  {r.serviceInfo && <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={r.serviceInfo}>{r.serviceInfo}</div>}
                  <div className="text-xs text-muted-foreground mt-1">
                    {Object.entries(r.issueFees).map(([k,v]) => `${k}: ₹${v}`).join(" | ")}
                  </div>
                </TableCell>
                <TableCell>₹{r.baseFee}</TableCell>
                <TableCell>{r.capFee ? `₹${r.capFee}` : "No cap"}</TableCell>
                <TableCell>v{r.version}</TableCell>
                <TableCell>
                  <Badge className={r.isActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}>
                    {r.isActive ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 justify-end">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleToggleActive(r.id, !r.isActive)} title={r.isActive ? "Deactivate" : "Activate"}>
                      {r.isActive ? <XCircle size={13} className="text-muted-foreground" /> : <CheckCircle size={13} className="text-green-600" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEditInit(r)} title="Edit">
                      <Pencil size={13} className="text-primary" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDelete(r.id)} title="Delete">
                      <Trash2 size={13} className="text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showCreate} onOpenChange={o => !o && resetForm()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Tag size={20} className="text-primary"/> {editId ? "Edit" : "Create"} Pricing Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Rule Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Standard 2024 Tier 1" />
            </div>
            <div className="space-y-2">
              <Label>Service Info Description</Label>
              <Textarea value={serviceInfo} onChange={e => setServiceInfo(e.target.value)} placeholder="Explain the service included..." className="h-20" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Fee *</Label>
                <Input type="number" value={baseFee} onChange={e => setBaseFee(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cap Fee (Optional)</Label>
                <Input type="number" value={capFee} onChange={e => setCapFee(e.target.value)} placeholder="e.g. 5000" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="flex justify-between items-center">
                Issue Fees
                <Button size="sm" variant="ghost" onClick={() => setIssueFees([...issueFees, {key: "", value: ""}])}>
                  <Plus size={14} className="mr-1"/> Add Issue
                </Button>
              </Label>
              {issueFees.map((f, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <Input placeholder="Issue Code (e.g. LATE_PAYMENT)" value={f.key} onChange={e => {
                    const newF = [...issueFees]; newF[i].key = e.target.value; setIssueFees(newF);
                  }} />
                  <Input type="number" placeholder="Fee Amount" value={f.value} onChange={e => {
                    const newF = [...issueFees]; newF[i].value = e.target.value; setIssueFees(newF);
                  }} className="w-32" />
                  <Button variant="ghost" size="icon" onClick={() => setIssueFees(issueFees.filter((_, idx) => idx !== i))}>&times;</Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button className="btn-gradient text-white" onClick={handleSave} disabled={!name || !baseFee || createRule.isPending || updateRule.isPending}>
              {createRule.isPending || updateRule.isPending ? "Saving..." : "Save Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}