import { useState, useEffect } from "react";
import { 
  useGetStaffPortalProfile, useUpdateStaffPortalProfile, getGetStaffPortalProfileQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, User, MapPin, Phone, Lock, Save } from "lucide-react";

export default function StaffProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useGetStaffPortalProfile({ query: { queryKey: getGetStaffPortalProfileQueryKey() } });
  const updateProfile = useUpdateStaffPortalProfile();

  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactMobile, setEmergencyContactMobile] = useState("");

  useEffect(() => {
    if (data) {
      setMobile(data.user.mobile || "");
      setAddress(data.profile.address || "");
      setEmergencyContactName(data.profile.emergencyContactName || "");
      setEmergencyContactMobile(data.profile.emergencyContactMobile || "");
    }
  }, [data]);

  const handleSave = () => {
    updateProfile.mutate({
      data: {
        mobile, address, emergencyContactName, emergencyContactMobile
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStaffPortalProfileQueryKey() });
        toast({ title: "Profile updated successfully" });
      },
      onError: () => toast({ title: "Failed to update profile", variant: "destructive" })
    });
  };

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading profile...</div>;
  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your personal information</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Protected Info - Visual Only */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-10 -mt-10 pointer-events-none" />
            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <Avatar className="h-24 w-24 border-4 border-white/20">
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {data.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{data.user.name}</h2>
                <p className="text-slate-300 text-sm mt-1">{data.profile.designation || "Staff Member"}</p>
                <div className="inline-flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider mt-3 font-semibold">
                  <Shield size={10} /> {data.profile.accountStatus}
                </div>
              </div>
            </div>
            
            <div className="mt-8 space-y-3 pt-6 border-t border-white/20 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Employee ID</span>
                <span className="font-mono">{data.profile.employeeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Department</span>
                <span>{data.profile.department || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Role</span>
                <span>{data.user.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Joining Date</span>
                <span>{data.profile.joiningDate ? new Date(data.profile.joiningDate).toLocaleDateString() : "—"}</span>
              </div>
            </div>
            
            <div className="mt-6 flex items-start gap-2 text-xs text-slate-400 bg-black/20 p-3 rounded-lg">
              <Lock size={14} className="shrink-0 mt-0.5" />
              <span>These organizational fields are managed by administration and cannot be changed here.</span>
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b border-border pb-2">
              <User size={18} className="text-primary" /> Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input value={data.user.email} disabled className="bg-muted text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground">Contact admin to change email</p>
              </div>
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={mobile} onChange={e => setMobile(e.target.value)} className="pl-9" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              <Label>Residential Address</Label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3 text-muted-foreground" />
                <textarea 
                  value={address} 
                  onChange={e => setAddress(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9"
                />
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-6 mt-8 flex items-center gap-2 border-b border-border pb-2">
              <Phone size={18} className="text-primary" /> Emergency Contact
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input value={emergencyContactName} onChange={e => setEmergencyContactName(e.target.value)} placeholder="Full Name" />
              </div>
              <div className="space-y-2">
                <Label>Contact Mobile</Label>
                <Input value={emergencyContactMobile} onChange={e => setEmergencyContactMobile(e.target.value)} placeholder="Mobile Number" />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <Button onClick={handleSave} disabled={updateProfile.isPending} className="btn-gradient border-0 text-white gap-2 px-8">
                {updateProfile.isPending ? "Saving..." : <><Save size={16} /> Save Changes</>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}