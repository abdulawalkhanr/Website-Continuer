import { useState } from "react";
import { Link } from "wouter";
import { useListStaffPortalCases, getListStaffPortalCasesQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Search, ChevronRight } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  DOCUMENTS_SUBMITTED: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CASE_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
  DOCUMENTATION_VERIFIED: "bg-purple-50 text-purple-700 border-purple-200",
  DISPUTE_SUBMITTED: "bg-primary/10 text-primary border-primary/20",
  BUREAU_LENDER_REVIEW: "bg-orange-50 text-orange-700 border-orange-200",
  FOLLOW_UP: "bg-teal-50 text-teal-700 border-teal-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
};

export default function StaffCases() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const { data: cases, isLoading } = useListStaffPortalCases(
    { 
      ...(statusFilter !== "ALL" ? { status: statusFilter as any } : {}),
      ...(priorityFilter !== "ALL" ? { priority: priorityFilter as any } : {})
    },
    { 
      query: { 
        queryKey: getListStaffPortalCasesQueryKey({
          ...(statusFilter !== "ALL" ? { status: statusFilter as any } : {}),
          ...(priorityFilter !== "ALL" ? { priority: priorityFilter as any } : {})
        })
      } 
    }
  );

  const filteredCases = cases?.filter(c => 
    !search || 
    c.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    c.serviceType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Cases</h1>
          <p className="text-muted-foreground text-sm mt-1">Cases currently assigned to you</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            placeholder="Search cases..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            {Object.keys(STATUS_COLORS).map(s => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priority</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case #</TableHead>
              <TableHead>Client & Service</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status & Progress</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !filteredCases?.length ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No cases found matching your filters</TableCell></TableRow>
            ) : filteredCases.map(c => (
              <TableRow key={c.id} className="hover:bg-muted/30 group">
                <TableCell className="font-mono font-medium text-xs">{c.caseNumber}</TableCell>
                <TableCell>
                  <div className="font-medium text-sm text-foreground">{c.customerName || "—"}</div>
                  <div className="text-xs text-muted-foreground">{c.serviceType}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={c.assignmentPriority === "URGENT" || c.assignmentPriority === "HIGH" ? "text-destructive border-destructive" : ""}>
                    {c.assignmentPriority || "NORMAL"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="w-full max-w-[150px]">
                    <Badge className={`text-[10px] mb-2 px-1.5 py-0 ${STATUS_COLORS[c.status]}`}>
                      {c.status.replace(/_/g, " ")}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Progress value={c.progressPercentage} className="h-1.5 flex-1" />
                      <span className="text-[10px] text-muted-foreground">{c.progressPercentage}%</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {c.assignmentDueDate ? new Date(c.assignmentDueDate).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/staff/cases/${c.id}`}>
                    <Button size="sm" variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
                      Open <ChevronRight size={16} className="ml-1" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
