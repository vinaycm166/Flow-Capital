"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Network, Building2, UploadCloud, Globe2, Activity, Zap, ChevronRight, BarChart3, Database, Trash2, CheckCircle, XCircle, Loader2, Wifi, Download } from "lucide-react";
import Link from "next/link";
import { getSocket } from "@/lib/socket";

// ── Status badge helper ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING_VERIFICATION: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    ACCEPTED:             "bg-blue-500/15 text-blue-400 border-blue-500/30",
    FUNDED:               "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    SETTLED:              "bg-purple-500/15 text-purple-400 border-purple-500/30",
    TOKENIZED:            "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  };
  return (
    <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider ${map[status] ?? "bg-secondary text-muted-foreground"}`}>
      {status === "PENDING_VERIFICATION" ? "Pending" : status.replace("_", " ")}
    </Badge>
  );
}

export default function EnterpriseDashboard() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, 'tokenize' | null>>({});
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [connected, setConnected] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("flowcapital_token");
      const headers = { Authorization: `Bearer ${token}` };
      const [invRes, transRes] = await Promise.all([
        fetch("/api/invoices", { headers }),
        fetch("/api/payment/transactions", { headers })
      ]);
      if (invRes.ok) setInvoices(await invRes.json());
      if (transRes.ok) setTransactions(await transRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Socket.IO real-time listeners ─────────────────────────────────────────
  useEffect(() => {
    fetchData();
    const socket = getSocket();

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // New invoice uploaded by SME → appears instantly
    socket.on("invoice_created", (invoice: any) => {
      setInvoices(prev => {
        if (prev.find(i => i.id === invoice.id)) return prev;
        return [invoice, ...prev];
      });
      showToast(`📄 New invoice from ${invoice.buyer} — ₹${invoice.amount.toLocaleString()}`, "success");
    });

    // Someone else accepted → update badge + disable buttons
    socket.on("invoice_accepted", (invoice: any) => {
      setInvoices(prev => prev.map(i => i.id === invoice.id ? { ...i, ...invoice } : i));
      setActionLoading(prev => ({ ...prev, [invoice.id]: null }));
    });

    // Invoice deleted elsewhere
    socket.on("invoice_deleted", ({ id }: { id: string }) => {
      setInvoices(prev => prev.filter(i => i.id !== id));
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("invoice_created");
      socket.off("invoice_accepted");
      socket.off("invoice_deleted");
    };
  }, [fetchData]);

  // ── Tokenize ───────────────────────────────────────
  const handleTokenize = async (id: string) => {
    setActionLoading(prev => ({ ...prev, [id]: 'tokenize' }));
    try {
      const token = localStorage.getItem("flowcapital_token");
      const res = await fetch(`/api/invoices/${id}/tokenize`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const updated = await res.json();
        setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...updated } : i));
        showToast("✅ Invoice tokenized successfully!", "success");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to tokenize invoice", "error");
      }
    } catch {
      showToast("Server connection failed", "error");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this invoice?")) return;
    try {
      const token = localStorage.getItem("flowcapital_token");
      const res = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setInvoices(invoices.filter(i => i.id !== id));
        showToast("Invoice deleted", "success");
      }
    } catch { showToast("Delete failed", "error"); }
  };

  const handleDownloadReport = async () => {
    const token = localStorage.getItem("flowcapital_token");
    const res = await fetch("/api/reports/invoices", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "invoices_report.csv"; a.click();
      URL.revokeObjectURL(url);
    }
  };

  const totalVolume = invoices.reduce((acc, i) => acc + i.amount, 0);
  const activeVendors = new Set(invoices.map(i => i.buyer)).size;
  const pendingCount = invoices.filter(i => i.status === "PENDING_VERIFICATION").length;
  const acceptedCount = invoices.filter(i => i.status === "ACCEPTED" || i.status === "FUNDED").length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.45 } }
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto min-h-screen relative pb-20">
      {/* Background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none" />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -40, x: "-50%" }}
            className={`fixed top-6 left-1/2 z-[100] px-6 py-3 rounded-xl text-sm font-semibold shadow-2xl border backdrop-blur-xl ${
              toast.type === "error"
                ? "bg-red-500/20 border-red-500/30 text-red-300"
                : "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8 z-10 relative">
        
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-r from-secondary/80 to-background/20 p-6 rounded-3xl border border-border/50 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">
                Global Operations Matrix
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-muted-foreground text-sm">Nexus Corporation</p>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${connected ? "text-emerald-400" : "text-red-400"}`}>
                  <Wifi className="w-3 h-3" />
                  {connected ? "Live" : "Reconnecting..."}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={handleDownloadReport} className="border-indigo-500/30 hover:bg-indigo-500/10 gap-2">
              <Download className="w-4 h-4 text-indigo-400" />
              Export CSV
            </Button>
          </div>
        </motion.div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Working Capital Deployed", value: `₹${totalVolume.toLocaleString()}`, change: "+12.4%", trend: "up", icon: Activity, color: "text-indigo-400" },
            { title: "Active Vendor Programs",   value: activeVendors.toString(),          change: "+45",    trend: "up", icon: Network,   color: "text-cyan-400" },
            { title: "Pending Verification",      value: pendingCount.toString(),           change: "Live",   trend: "up", icon: Zap,       color: "text-yellow-400" },
            { title: "Accepted & Funded",         value: acceptedCount.toString(),          change: "Funded", trend: "up", icon: Globe2,    color: "text-emerald-400" }
          ].map((stat, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <Card className="glass-card h-full border-border/50 bg-secondary/20 relative overflow-hidden group hover:border-indigo-500/50 transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full pointer-events-none" />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl bg-background/50 border border-border/50 shadow-inner ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="text-emerald-400 border-emerald-400/20 bg-emerald-400/10 text-[10px]">
                      {stat.change}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-black tracking-tight">{stat.value}</h3>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Verification Queue — THE CORE REAL-TIME TABLE */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    {pendingCount > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${pendingCount > 0 ? "bg-yellow-400" : "bg-emerald-400"}`} />
                  </span>
                  Invoice Verification Queue
                </CardTitle>
                <CardDescription>
                  Invoices assigned to your organization
                </CardDescription>
              </div>
              <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                {pendingCount} Pending
              </Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30 hover:bg-transparent">
                      <TableHead className="w-[100px]">Invoice ID</TableHead>
                      <TableHead>Buyer / Vendor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                          No invoices yet. They will appear here in real-time when SMEs upload them.
                        </TableCell>
                      </TableRow>
                    ) : invoices.map((inv) => {
                      const canTokenize = inv.status === "ACCEPTED";
                      const isLoading = actionLoading[inv.id];
                      return (
                        <motion.tr
                          key={inv.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="border-border/10 hover:bg-white/5 transition-colors group"
                        >
                          <TableCell className="font-mono text-xs font-bold text-muted-foreground">
                            {inv.id.substring(0, 8)}
                          </TableCell>
                          <TableCell className="font-semibold">{inv.buyer}</TableCell>
                          <TableCell className="font-mono text-emerald-400 font-bold">
                            ₹{inv.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(inv.dueDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {inv.riskScore ? (
                              <Badge variant="outline" className={`text-[10px] ${inv.riskScore.category === 'A' ? 'text-emerald-400 border-emerald-400/30' : inv.riskScore.category === 'B' ? 'text-yellow-400 border-yellow-400/30' : 'text-red-400 border-red-400/30'}`}>
                                {inv.riskScore.category} ({inv.riskScore.score})
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Scoring...</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={inv.status} />
                          </TableCell>
                          <TableCell>
                            {canTokenize ? (
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  disabled={!!isLoading}
                                  onClick={() => handleTokenize(inv.id)}
                                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-md shadow-emerald-500/20"
                                >
                                  {isLoading === 'tokenize' ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-3 h-3" />
                                  )}
                                  Tokenize
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <span className="text-xs text-muted-foreground italic truncate max-w-[120px]">
                                  {inv.status === "PENDING_VERIFICATION" ? "⏳ Awaiting Admin" : inv.status === "TOKENIZED" ? "🪙 Tokenized" : inv.status === "FUNDED" ? "💰 Funded" : "—"}
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleDelete(inv.id)}
                              className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Liquidity Pipeline Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="col-span-full lg:col-span-2">
            <Card className="glass-card border-border/50 h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">Liquidity Pipeline</CardTitle>
                    <CardDescription>Real-time volume distributed across vendor tiers</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">View Full Details <ChevronRight className="w-3 h-3" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full flex items-end gap-2 mt-4 px-2 pb-6 border-b border-border/30 relative">
                  <div className="absolute inset-x-0 bottom-6 top-0 flex flex-col justify-between pointer-events-none">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full border-b border-border/10" />)}
                  </div>
                  {[40, 60, 35, 80, 50, 95, 65, 85, 45, 75, 55, 90].map((height, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end group h-full z-10 relative">
                      <div className="w-full bg-gradient-to-t from-indigo-600/40 to-cyan-400/80 rounded-t-sm transition-all duration-500 group-hover:brightness-125" style={{ height: `${height}%` }}>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          ₹{(height * 1.5).toFixed(1)}M
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 px-2 text-xs text-muted-foreground font-medium uppercase tracking-widest">
                  <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Risk Summary */}
          <motion.div variants={itemVariants} className="col-span-full lg:col-span-1">
            <Card className="glass-card border-border/50 h-full relative overflow-hidden bg-gradient-to-br from-background via-secondary/20 to-indigo-900/10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full" />
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                  Portfolio Breakdown
                </CardTitle>
                <CardDescription>Invoice status distribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Pending", count: invoices.filter(i => i.status === "PENDING_VERIFICATION").length, color: "bg-yellow-400", total: invoices.length },
                  { label: "Accepted", count: invoices.filter(i => i.status === "ACCEPTED").length, color: "bg-blue-400", total: invoices.length },
                  { label: "Funded", count: invoices.filter(i => i.status === "FUNDED").length, color: "bg-emerald-400", total: invoices.length },
                  { label: "Settled", count: invoices.filter(i => i.status === "SETTLED").length, color: "bg-purple-400", total: invoices.length },
                ].map(item => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">{item.label}</span>
                      <span className="font-bold">{item.count}</span>
                    </div>
                    <Progress
                      value={item.total > 0 ? (item.count / item.total) * 100 : 0}
                      className="h-2 bg-secondary/50"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

      </motion.div>
    </div>
  );
}
