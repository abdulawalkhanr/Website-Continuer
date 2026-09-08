import { useState } from "react";
import {
  Bell, ChevronRight, CreditCard, FileText, LayoutDashboard, LogOut,
  MessageSquare, ShieldAlert, AlertCircle, Zap, Calculator, IndianRupee,
  TrendingUp,
} from "lucide-react";
import "./_group.css";

const report = {
  bureau: "CIBIL",
  version: "V2 — RECTIFIED",
  reportDate: "22/04/2025",
  score: "742",
  analysis: "Analysis has been generated and is awaiting final manual review. Scanned images and uncertain extraction require verification by our experts before the finalized insights are provided.",
  accounts: [
    { bankName: "HDFC Bank", type: "Credit Card", number: "XXXX-XXXX-4821", balance: "18,450", status: "ACTIVE" },
    { bankName: "ICICI Bank", type: "Personal Loan", number: "XXXX-XXXX-7194", balance: "1,24,600", status: "ACTIVE" },
    { bankName: "Bajaj Finance", type: "Consumer Loan", number: "XXXX-XXXX-2386", balance: "0", status: "CLOSED" },
  ],
  flags: [
    { title: "Late payment history found", description: "One delayed payment was reported on your ICICI Bank personal loan in the last 24 months." },
    { title: "High credit utilisation", description: "Your current credit-card utilisation is higher than the recommended 30% threshold." },
  ],
};

const nav = [
  ["Overview", LayoutDashboard], ["My Case", FileText], ["Credit Report", FileText],
  ["Documents", FileText], ["Payments", CreditCard], ["Support", MessageSquare], ["Notifications", Bell],
] as const;

export function Current() {
  const [tab, setTab] = useState<"detail" | "compare" | "quote">("detail");
  return (
    <div className="cir-credit-journey min-h-screen bg-[hsl(var(--muted)/.3)] text-[hsl(var(--foreground))] flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-white border-r border-[hsl(var(--border))] shadow-sm">
        <div className="p-6 flex flex-col min-h-screen">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-xl font-bold gradient-text">CIR</span>
            <span className="text-sm text-[hsl(var(--muted-foreground))]">Customer Portal</span>
          </div>
          <div className="flex items-center gap-3 mb-8 p-3 rounded-xl bg-[hsl(var(--primary)/.05)] border border-[hsl(var(--primary)/.1)]">
            <div className="size-10 rounded-full bg-[hsl(var(--primary)/.2)] text-[hsl(var(--primary))] flex items-center justify-center font-bold">P</div>
            <div className="min-w-0"><div className="text-sm font-semibold truncate">Priya Sharma</div><div className="text-xs text-[hsl(var(--muted-foreground))] truncate">priya.sharma@email.com</div></div>
          </div>
          <nav className="space-y-1 flex-1">
            {nav.map(([label, Icon]) => <div key={label} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${label === "Credit Report" ? "btn-gradient text-white shadow-sm" : "text-[hsl(var(--muted-foreground))]"}`}>
              <Icon size={18} />{label}{label === "Credit Report" && <ChevronRight size={14} className="ml-auto text-white/70" />}
            </div>)}
          </nav>
          <div className="mt-6 pt-4 border-t border-[hsl(var(--border))]">
            <div className="px-3 py-2 mb-2 text-sm text-[hsl(var(--muted-foreground))]">Back to Website</div>
            <button className="w-full h-10 rounded-lg border border-red-200 text-red-600 flex items-center px-3 text-sm font-medium"><LogOut size={18} className="mr-2" />Logout</button>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div><h2 className="text-2xl font-bold">Credit Report</h2><p className="text-sm mt-1 text-[hsl(var(--muted-foreground))]">Intelligence and insights from your latest credit report.</p></div>
          <section className="glass-card rounded-2xl p-5 sm:p-6">
            <div className="flex flex-wrap gap-4 items-start justify-between mb-6">
              <div><div className="flex items-center gap-2 flex-wrap"><h3 className="text-xl font-bold gradient-text">{report.bureau}</h3><span className="text-xs px-2.5 py-0.5 rounded-full border border-[hsl(var(--primary)/.2)] bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]">{report.version}</span></div><p className="text-sm mt-1 text-[hsl(var(--muted-foreground))]">Report processed on {report.reportDate}</p></div>
              <div className="text-right"><div className="text-xs uppercase tracking-wider font-semibold mb-1 text-[hsl(var(--muted-foreground))]">Score</div><div className="text-3xl font-bold">{report.score}</div></div>
            </div>
            <div className="p-5 bg-gradient-to-br from-[hsl(var(--primary)/.05)] to-[hsl(var(--accent)/.05)] rounded-xl border border-[hsl(var(--primary)/.1)]">
              <div className="flex items-center gap-2 mb-3"><Zap size={18} className="text-[hsl(var(--primary))]" /><h4 className="font-semibold">Analysis Pending Review</h4></div>
              <p className="text-sm leading-relaxed text-[hsl(var(--foreground)/.8)]">{report.analysis}</p>
            </div>
          </section>
          <div>
            <div className="flex border-b border-[hsl(var(--border))] mb-6">
              {([["detail", "Report Details"], ["compare", "Compare Versions"], ["quote", "Quote"]] as const).map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === id ? "border-[hsl(var(--primary))] text-[hsl(var(--foreground))]" : "border-transparent text-[hsl(var(--muted-foreground))]"}`}>{label}</button>)}
            </div>
            {tab === "detail" && <div className="grid md:grid-cols-2 gap-6">
              <section className="glass-card rounded-2xl p-5"><h4 className="font-semibold flex items-center gap-2 mb-4"><CreditCard size={18} className="text-[hsl(var(--primary))]" />Accounts</h4><div className="space-y-3">{report.accounts.map(a => <div key={a.number} className="p-3 border border-[hsl(var(--border))] rounded-xl flex justify-between items-center bg-white/50"><div><div className="font-medium text-sm">{a.bankName}</div><div className="text-xs text-[hsl(var(--muted-foreground))]">{a.type} · {a.number}</div></div><div className="text-right"><div className="font-medium text-sm">₹{a.balance}</div><span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full border ${a.status === "ACTIVE" ? "border-green-200 text-green-700 bg-green-50" : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"}`}>{a.status}</span></div></div>)}</div></section>
              <section className="glass-card rounded-2xl p-5"><h4 className="font-semibold flex items-center gap-2 mb-4"><ShieldAlert size={18} className="text-red-500" />Flags</h4><div className="space-y-3">{report.flags.map(f => <div key={f.title} className="p-3 border border-red-100 bg-red-50/50 rounded-xl flex gap-3"><AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" /><div><div className="font-medium text-sm text-red-900">{f.title}</div><div className="text-xs text-red-700 mt-1">{f.description}</div></div></div>)}</div></section>
            </div>}
            {tab === "compare" && <section className="glass-card rounded-2xl p-6"><div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"><div><h3 className="font-semibold mb-1">Compare Versions</h3><p className="text-sm text-[hsl(var(--muted-foreground))]">Original (initial upload) vs Updated/Rectified (post-consultation).</p></div><select className="w-full sm:w-64 p-2 rounded-lg border border-[hsl(var(--border))] bg-white text-sm"><option>Select report to compare...</option><option>V1 — Original · 12/03/2025</option></select></div><div className="text-center py-10 text-[hsl(var(--muted-foreground))]"><TrendingUp size={48} className="mx-auto mb-4 text-[hsl(var(--primary)/.4)]" /><p>Please select a previous report version above to view the comparison.</p></div></section>}
            {tab === "quote" && <section className="glass-card rounded-2xl p-6"><div className="flex items-center gap-3 mb-6 pb-6 border-b border-[hsl(var(--border))]"><div className="size-12 rounded-xl bg-[hsl(var(--primary)/.1)] flex items-center justify-center"><Calculator className="text-[hsl(var(--primary))] size-6" /></div><div><h3 className="font-semibold text-lg">Quote</h3><p className="text-sm text-[hsl(var(--muted-foreground))]">Deterministic pricing based on your report</p></div></div><div className="max-w-lg space-y-3"><div className="flex justify-between text-sm"><span className="text-[hsl(var(--muted-foreground))]">REPORT ANALYSIS</span><span className="font-medium flex items-center"><IndianRupee size={12} />999</span></div><div className="pt-4 border-t border-[hsl(var(--border))] flex justify-between font-bold text-lg"><span>Total</span><span className="flex items-center text-[hsl(var(--primary))]"><IndianRupee size={16} />999</span></div></div></section>}
          </div>
        </div>
      </main>
    </div>
  );
}