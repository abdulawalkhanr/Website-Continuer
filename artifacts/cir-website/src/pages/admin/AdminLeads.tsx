import { useState } from "react";
import { useListLeads, useUpdateLead, useGetLeadStats, getListLeadsQueryKey, getGetLeadStatsQueryKey, ListLeadsStage } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Phone, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STAGES = ["NEW", "CONTACTED", "SCHEDULED", "CONVERTED", "COMPLETED"];
const STAGE_COLORS: Record<string, string> = {
  NEW: "bg-slate-100 text-slate-700 border-slate-200",
  CONTACTED: "bg-blue-100 text-blue-700 border-blue-200",
  SCHEDULED: "bg-yellow-100 text-yellow-700 border-yellow-200",
  CONVERTED: "bg-green-100 text-green-700 border-green-200",
  COMPLETED: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function AdminLeads() {
  const [stageFilter, setStageFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const activeStage = stageFilter !== "ALL" ? stageFilter as ListLeadsStage : undefined;
  const { data: leads, isLoading } = useListLeads(activeStage ? { stage: activeStage } : {}, { query: { queryKey: getListLeadsQueryKey(activeStage ? { stage: activeStage } : {}) } });
  const { data: stats } = useGetLeadStats({ query: { queryKey: getGetLeadStatsQueryKey() } });
  const updateLead = useUpdateLead();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filtered = leads?.filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.mobile.includes(search)) || [];

  const handleStageChange = (id: number, stage: string) => {
    updateLead.mutate({ id, data: { stage: stage as "NEW" | "CONTACTED" | "SCHEDULED" | "CONVERTED" | "COMPLETED" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey({}) });
        queryClient.invalidateQueries({ queryKey: getGetLeadStatsQueryKey() });
        toast({ title: "Lead updated" });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lead Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage and track all incoming inquiries</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {STAGES.map(s => (
            <div key={s} className={`rounded-xl p-3 text-center border ${STAGE_COLORS[s]}`}>
              <div className="text-xl font-bold">{(stats as unknown as Record<string, number>)[s.toLowerCase()] || 0}</div>
              <div className="text-xs mt-0.5 font-medium">{s}</div>
            </div>
          ))}
          <div className="rounded-xl p-3 text-center border bg-primary/10 border-primary/20">
            <div className="text-xl font-bold text-primary">{stats.total}</div>
            <div className="text-xs mt-0.5 text-primary font-medium">TOTAL</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input data-testid="leads-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or mobile..." className="pl-9" />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40" data-testid="leads-stage-filter"><SelectValue placeholder="All Stages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Stages</SelectItem>
            {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading leads...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No leads found</TableCell></TableRow>
            ) : filtered.map(lead => (
              <TableRow key={lead.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {lead.mobile}
                    <a href={`tel:${lead.mobile}`} className="text-primary hover:text-primary/80"><Phone size={13} /></a>
                    <a href={`https://wa.me/91${lead.mobile}`} target="_blank" rel="noopener noreferrer" className="text-green-600"><MessageCircle size={13} /></a>
                  </div>
                </TableCell>
                <TableCell>{lead.city || "—"}</TableCell>
                <TableCell className="max-w-[140px] truncate">{lead.serviceRequired || "—"}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{lead.source}</Badge></TableCell>
                <TableCell>
                  <Select value={lead.stage} onValueChange={v => handleStageChange(lead.id, v)}>
                    <SelectTrigger className={`w-32 h-7 text-xs border ${STAGE_COLORS[lead.stage]}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <a href={`tel:${lead.mobile}`}><Button size="sm" variant="ghost" className="h-7 px-2"><Phone size={13} /></Button></a>
                    <a href={`https://wa.me/91${lead.mobile}`} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="ghost" className="h-7 px-2 text-green-600"><MessageCircle size={13} /></Button></a>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
