import { useState } from "react";
import { 
  useListStaff, useCreateStaff, useUpdateStaff, useArchiveStaff, useGetStaff, useGetStaffIdCard, useGetStaffPerformance,
  getListStaffQueryKey, getGetStaffQueryKey, getGetStaffIdCardQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Shield, Search, IdCard, Activity, Briefcase, UserX, KeyRound, Download, Printer } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";

const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700 border-green-200",
  INACTIVE: "bg-gray-100 text-gray-700 border-gray-200",
  SUSPENDED: "bg-orange-50 text-orange-700 border-orange-200",
  ARCHIVED: "bg-red-50 text-red-700 border-red-200",
};

export default function AdminStaff() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  
  const { data: staffList, isLoading } = useListStaff(
    { 
      ...(statusFilter !== "ALL" ? { status: statusFilter as any } : {})
    },
    { query: { queryKey: getListStaffQueryKey(statusFilter !== "ALL" ? { status: statusFilter as any } : {}) } }
  );

  const filteredStaff = staffList?.filter(s => 
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.email.toLowerCase().includes(search.toLowerCase()) || 
    s.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ name: "", email: "", mobile: "", password: "", designation: "", department: "" });
  const createStaff = useCreateStaff();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCreate = () => {
    if (!createData.name || !createData.email || !createData.mobile || !createData.password) {
      toast({ title: "Name, email, mobile, and password are required", variant: "destructive" });
      return;
    }
    createStaff.mutate({
      data: {
        name: createData.name, email: createData.email, mobile: createData.mobile, password: createData.password,
        designation: createData.designation || undefined, department: createData.department || undefined
      }
    }, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getListStaffQueryKey({}) });
        setShowCreate(false);
        setCreateData({ name: "", email: "", mobile: "", password: "", designation: "", department: "" });
        toast({ title: "Staff Created", description: `Employee ID: ${res.profile.employeeId}` });
      },
      onError: () => toast({ title: "Failed to create staff", variant: "destructive" })
    });
  };

  const StaffDetailsModal = ({ id, onClose }: { id: number, onClose: () => void }) => {
    const { data: staff } = useGetStaff(id, { query: { enabled: !!id, queryKey: getGetStaffQueryKey(id) } });
    const { data: card } = useGetStaffIdCard(id, { query: { enabled: !!id, queryKey: getGetStaffIdCardQueryKey(id) } });
    const updateStaff = useUpdateStaff();
    const archiveStaff = useArchiveStaff();
    const [editMode, setEditMode] = useState(false);
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState<any>(staff?.profile.accountStatus);

    const handleUpdate = (updates: any) => {
      updateStaff.mutate({ id, data: updates }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetStaffQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListStaffQueryKey({}) });
          toast({ title: "Staff updated" });
          setPassword("");
        },
        onError: () => toast({ title: "Failed to update staff", variant: "destructive" })
      });
    };

    const handlePrintCard = () => {
      if (!card) return;
      const html = `
        <html><head><style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f0f0; margin: 0; }
          .card { width: 300px; height: 480px; background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow: hidden; position: relative; display: flex; flex-direction: column; align-items: center; border: 1px solid #e5e7eb; }
          .header { background: linear-gradient(135deg, #1d4ed8, #4f46e5); color: white; width: 100%; text-align: center; padding: 20px 0 40px; }
          .header h2 { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 1px; }
          .photo { width: 100px; height: 100px; border-radius: 50%; background: #e5e7eb; border: 4px solid white; margin-top: -50px; display: flex; justify-content: center; align-items: center; font-size: 32px; font-weight: bold; color: #9ca3af; overflow: hidden; z-index: 10; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
          .photo img { width: 100%; height: 100%; object-fit: cover; }
          .name { margin: 15px 0 5px; font-size: 20px; font-weight: bold; color: #1f2937; text-align: center; }
          .role { font-size: 14px; color: #4f46e5; font-weight: 600; text-align: center; margin-bottom: 20px; }
          .info { width: 100%; padding: 0 24px; box-sizing: border-box; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px; border-bottom: 1px dashed #e5e7eb; padding-bottom: 5px; }
          .info-label { color: #6b7280; }
          .info-value { color: #1f2937; font-weight: 600; text-align: right; }
          .footer { margin-top: auto; padding: 15px; width: 100%; background: #f9fafb; text-align: center; font-size: 10px; color: #6b7280; box-sizing: border-box; }
          .footer-code { font-family: monospace; font-size: 11px; margin-top: 5px; color: #4b5563; }
        </style></head>
        <body>
          <div class="card">
            <div class="header"><h2>CIR CONSULTATION</h2></div>
            <div class="photo">
              ${card.profilePhotoUrl ? `<img src="${card.profilePhotoUrl}" />` : card.name.charAt(0).toUpperCase()}
            </div>
            <div class="name">${card.name}</div>
            <div class="role">${card.designation || "STAFF"}</div>
            <div class="info">
              <div class="info-row"><span class="info-label">EMP ID</span><span class="info-value">${card.employeeId}</span></div>
              <div class="info-row"><span class="info-label">DOJ</span><span class="info-value">${card.joiningDate ? new Date(card.joiningDate).toLocaleDateString() : "—"}</span></div>
              <div class="info-row"><span class="info-label">Dept</span><span class="info-value">${card.department || "—"}</span></div>
            </div>
            <div class="footer">
              Valid ID Card • Property of CIR<br/>
              <div class="footer-code">Auth: ${card.verificationCode.substring(0,8)}</div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body></html>
      `;
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    };

    if (!staff) return <div className="p-8 text-center">Loading...</div>;

    return (
      <Tabs defaultValue="details">
        <TabsList className="w-full">
          <TabsTrigger value="details" className="flex-1">Details & Access</TabsTrigger>
          <TabsTrigger value="idcard" className="flex-1">ID Card</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6 pt-4">
          <div className="flex gap-4 items-start">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl bg-primary/10 text-primary">{staff.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-bold">{staff.user.name}</h3>
              <div className="text-sm text-muted-foreground font-mono">{staff.profile.employeeId}</div>
              <div className="flex gap-2 mt-2">
                <Badge className={ACCOUNT_STATUS_COLORS[staff.profile.accountStatus]}>{staff.profile.accountStatus}</Badge>
                <Badge variant="outline">{staff.profile.employmentStatus.replace("_", " ")}</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Email</Label><div className="text-sm font-medium">{staff.user.email}</div></div>
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Mobile</Label><div className="text-sm font-medium">{staff.user.mobile || "—"}</div></div>
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Designation</Label><div className="text-sm font-medium">{staff.profile.designation || "—"}</div></div>
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Department</Label><div className="text-sm font-medium">{staff.profile.department || "—"}</div></div>
          </div>

          <div className="border-t border-border pt-4 space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2"><Shield size={14} className="text-primary"/> Account Controls</h4>
            <div className="flex items-end gap-3">
              <div className="space-y-2 flex-1">
                <Label>Account Status</Label>
                <Select value={status || staff.profile.accountStatus} onValueChange={v => {
                  setStatus(v);
                  handleUpdate({ accountStatus: v });
                }}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <Label>Reset Password</Label>
              <div className="flex gap-2">
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" />
                <Button variant="secondary" onClick={() => handleUpdate({ password })} disabled={!password}>Reset</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="idcard" className="pt-4 space-y-4 text-center">
          <p className="text-sm text-muted-foreground mb-4">Generate and print an official staff ID card.</p>
          <div className="w-64 h-96 mx-auto bg-white rounded-xl shadow-md border border-border flex flex-col items-center overflow-hidden relative">
            <div className="w-full h-24 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            <div className="w-20 h-20 rounded-full bg-slate-200 border-4 border-white -mt-10 mb-3 flex items-center justify-center text-3xl font-bold text-slate-400 shadow-sm">
              {staff.user.name.charAt(0)}
            </div>
            <div className="text-lg font-bold text-slate-800">{staff.user.name}</div>
            <div className="text-sm font-semibold text-indigo-600 mb-4">{staff.profile.designation || "Staff"}</div>
            
            <div className="w-full px-6 space-y-2 text-xs">
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-1"><span className="text-slate-500">EMP ID</span><span className="font-semibold">{staff.profile.employeeId}</span></div>
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-1"><span className="text-slate-500">Dept</span><span className="font-semibold">{staff.profile.department || "—"}</span></div>
            </div>
          </div>
          <Button onClick={handlePrintCard} className="gap-2 mt-4"><Printer size={16} /> Print / Save as PDF</Button>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage team members, assignments, and access</p>
        </div>
        <Button className="btn-gradient border-0 text-white gap-2" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Staff Member
        </Button>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            placeholder="Search staff..." 
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
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assignments</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !filteredStaff?.length ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No staff found</TableCell></TableRow>
            ) : filteredStaff.map(s => (
              <TableRow key={s.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">{s.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm text-foreground">{s.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{s.employeeId}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{s.designation || "—"}</div>
                  <div className="text-xs text-muted-foreground">{s.department || "—"}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm truncate max-w-[150px]" title={s.email}>{s.email}</div>
                  <div className="text-xs text-muted-foreground">{s.mobile || "—"}</div>
                </TableCell>
                <TableCell>
                  <Badge className={`text-xs ${ACCOUNT_STATUS_COLORS[s.accountStatus]}`}>
                    {s.accountStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <div className="text-center">
                      <div className="text-sm font-semibold">{s.activeAssignments || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Cases</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold">{s.pendingTasks || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Tasks</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 justify-end">
                    <Button size="sm" variant="ghost" className="h-8 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10" onClick={() => setSelectedStaffId(s.id)}>
                      Manage
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Staff Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Staff Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Full Name *</Label><Input value={createData.name} onChange={e => setCreateData(c => ({...c, name: e.target.value}))} /></div>
            <div className="space-y-2"><Label>Email Address *</Label><Input type="email" value={createData.email} onChange={e => setCreateData(c => ({...c, email: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Mobile *</Label><Input value={createData.mobile} onChange={e => setCreateData(c => ({...c, mobile: e.target.value}))} /></div>
              <div className="space-y-2"><Label>Initial Password *</Label><Input type="password" value={createData.password} onChange={e => setCreateData(c => ({...c, password: e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Designation</Label><Input value={createData.designation} onChange={e => setCreateData(c => ({...c, designation: e.target.value}))} /></div>
              <div className="space-y-2"><Label>Department</Label><Input value={createData.department} onChange={e => setCreateData(c => ({...c, department: e.target.value}))} /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1 btn-gradient text-white border-0" onClick={handleCreate} disabled={createStaff.isPending}>
                {createStaff.isPending ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff Details Modal */}
      <Dialog open={selectedStaffId !== null} onOpenChange={(o) => !o && setSelectedStaffId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Manage Staff</DialogTitle></DialogHeader>
          {selectedStaffId && <StaffDetailsModal id={selectedStaffId} onClose={() => setSelectedStaffId(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
