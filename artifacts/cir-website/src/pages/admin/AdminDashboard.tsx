import { useGetAdminDashboard, useGetMonthlyStats, getGetAdminDashboardQueryKey, getGetMonthlyStatsQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Users, Briefcase, CheckCircle, Clock, TrendingUp, DollarSign, MessageSquare, Share2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

function MetricCard({ label, value, icon, color, sub }: { label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className={`rounded-2xl p-5 ${color} border`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground/70">{label}</span>
          <div className="w-9 h-9 rounded-xl bg-white/50 flex items-center justify-center">{icon}</div>
        </div>
        <div className="text-3xl font-bold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { data: dashboard } = useGetAdminDashboard({ query: { queryKey: getGetAdminDashboardQueryKey() } });
  const { data: monthly } = useGetMonthlyStats({ query: { queryKey: getGetMonthlyStatsQueryKey() } });

  const metrics = dashboard ? [
    { label: "Total Customers", value: dashboard.totalCustomers, icon: <Users size={18} className="text-primary" />, color: "bg-primary/8 border-primary/15", sub: "Registered users" },
    { label: "Active Cases", value: dashboard.activeCases, icon: <Briefcase size={18} className="text-purple-600" />, color: "bg-purple-50 border-purple-200", sub: "In progress" },
    { label: "Completed Cases", value: dashboard.completedCases, icon: <CheckCircle size={18} className="text-green-600" />, color: "bg-green-50 border-green-200", sub: "Successfully resolved" },
    { label: "Pending Cases", value: dashboard.pendingCases, icon: <Clock size={18} className="text-yellow-600" />, color: "bg-yellow-50 border-yellow-200", sub: "Awaiting action" },
    { label: "Total Revenue", value: `₹${(dashboard.totalRevenue || 0).toLocaleString()}`, icon: <TrendingUp size={18} className="text-blue-600" />, color: "bg-blue-50 border-blue-200", sub: "Service fees" },
    { label: "Pending Revenue", value: `₹${(dashboard.pendingRevenue || 0).toLocaleString()}`, icon: <DollarSign size={18} className="text-orange-600" />, color: "bg-orange-50 border-orange-200", sub: "To be collected" },
    { label: "Today Leads", value: dashboard.todayLeads ?? 0, icon: <Users size={18} className="text-pink-600" />, color: "bg-pink-50 border-pink-200", sub: "New inquiries today" },
    { label: "Open Tickets", value: dashboard.openTickets ?? 0, icon: <MessageSquare size={18} className="text-teal-600" />, color: "bg-teal-50 border-teal-200", sub: "Awaiting response" },
  ] : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of all business metrics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* Charts */}
      {monthly && monthly.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold mb-6">Monthly Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="leads" stroke="#A7D8FF" strokeWidth={2} dot={{ fill: "#A7D8FF", r: 4 }} name="Leads" />
              <Line type="monotone" dataKey="cases" stroke="#DCC6FF" strokeWidth={2} dot={{ fill: "#DCC6FF", r: 4 }} name="Cases" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Revenue chart */}
      {monthly && monthly.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold mb-6">Monthly Revenue Collected (₹)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
              <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e", r: 4 }} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
